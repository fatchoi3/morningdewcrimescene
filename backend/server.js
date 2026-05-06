import { WebSocketServer } from 'ws';
import { evidenceMap } from './data/gameData.js';

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });
const rooms = new Map();

const createRoomCode = () => `ROOM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const send = (ws, payload) => {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

const broadcastRoom = (roomCode, payload) => {
  const room = rooms.get(roomCode);
  if (!room) return;

  const clients = [room.host, ...room.participants];
  clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
};

const cleanupConnection = (ws) => {
  if (!ws.roomCode) return;
  const room = rooms.get(ws.roomCode);
  if (!room) return;

  if (ws.isHost) {
    broadcastRoom(ws.roomCode, {
      type: 'room_closed',
      reason: '호스트가 방을 나갔습니다.'
    });
    rooms.delete(ws.roomCode);
  } else {
    room.participants = room.participants.filter((client) => client !== ws);
  }
};

wss.on('connection', (ws, req) => {
  const clientAddress = req.socket.remoteAddress;
  console.log(`WebSocket client connected: ${clientAddress}`);

  ws.roomCode = '';
  ws.isHost = false;

  ws.on('message', (message) => {
    console.log(`Received message from ${clientAddress}: ${message.toString()}`);
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (error) {
      send(ws, { type: 'error', error: '잘못된 메시지 형식입니다.' });
      return;
    }

    switch (data.type) {
      case 'create_room': {
        const roomCode = createRoomCode();
        rooms.set(roomCode, {
          host: ws,
          participants: [],
          gameActive: false,
          evidence: []
        });
        ws.roomCode = roomCode;
        ws.isHost = true;
        send(ws, { type: 'room_created', roomCode });
        send(ws, { type: 'game_state', gameActive: false, evidence: [] });
        break;
      }
      case 'join_room': {
        const room = rooms.get(data.roomCode);
        if (!room) {
          send(ws, { type: 'join_error', error: '존재하지 않는 방 코드입니다.' });
          return;
        }

        room.participants.push(ws);
        ws.roomCode = data.roomCode;
        ws.isHost = false;
        send(ws, { type: 'join_success', roomCode: data.roomCode });
        send(ws, { type: 'game_state', gameActive: room.gameActive, evidence: room.evidence });
        break;
      }
      case 'toggle_game': {
        const room = rooms.get(data.roomCode);
        if (!room || room.host !== ws) {
          send(ws, { type: 'action_error', error: '호스트만 게임을 제어할 수 있습니다.' });
          return;
        }
        room.gameActive = !room.gameActive;
        broadcastRoom(data.roomCode, { type: 'game_state', gameActive: room.gameActive, evidence: room.evidence });
        break;
      }
      case 'reset_game': {
        const room = rooms.get(data.roomCode);
        if (!room || room.host !== ws) {
          send(ws, { type: 'action_error', error: '호스트만 게임을 초기화할 수 있습니다.' });
          return;
        }
        room.gameActive = false;
        room.evidence = [];
        broadcastRoom(data.roomCode, { type: 'game_state', gameActive: false, evidence: room.evidence });
        break;
      }
      case 'scan_evidence': {
        const room = rooms.get(data.roomCode);
        if (!room) {
          send(ws, { type: 'scan_result', success: false, message: '방을 찾을 수 없습니다.' });
          return;
        }
        if (!room.gameActive) {
          send(ws, { type: 'scan_result', success: false, message: '게임이 시작되지 않았습니다.' });
          return;
        }

        const code = data.code.trim().toUpperCase();
        const evidence = evidenceMap[code];
        if (!evidence) {
          send(ws, { type: 'scan_result', success: false, message: '알 수 없는 QR 코드입니다.' });
          return;
        }

        if (room.evidence.some((item) => item.code === code)) {
          send(ws, {
            type: 'scan_result',
            success: false,
            message: `이미 수집된 증거입니다: ${evidence.title}`
          });
          return;
        }

        room.evidence.push({ code, ...evidence });
        broadcastRoom(data.roomCode, { type: 'game_state', gameActive: room.gameActive, evidence: room.evidence });
        send(ws, {
          type: 'scan_result',
          success: true,
          message: `증거 수집 완료: ${evidence.title}`
        });
        break;
      }
      default: {
        send(ws, { type: 'error', error: '알 수 없는 메시지 타입입니다.' });
      }
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`WebSocket client disconnected: ${clientAddress} (code=${code}, reason=${reason})`);
    cleanupConnection(ws);
  });
});

console.log(`WebSocket server listening on ws://localhost:${PORT}`);
