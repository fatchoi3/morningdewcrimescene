# Backend Deployment

This folder contains the minimal backend needed for EC2 deployment.

## Files

- `server.js`: WebSocket server implementation
- `data/gameData.js`: game data used by the server
- `package.json`: dependency and start script

## Run on EC2

1. Install Node.js and npm.
2. Upload this folder to EC2.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run with pm2:
   ```bash
   pm2 start server.js --name crime-server
   pm2 save
   ```

## Notes

- The server listens on port `3001` by default.
- If the frontend uses HTTPS, the frontend must connect with `wss://`.
- If you use TLS termination with nginx, proxy to `http://127.0.0.1:3001` and pass WebSocket headers.
