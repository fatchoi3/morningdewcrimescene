import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';

/**
 * CameraScanner
 * QR 코드 스캔 수단을 2가지 제공하는 컴포넌트:
 *   1) 카메라 팝업 스캔 (jsQR 라이브러리로 영상 프레임 분석, 인식 시 자동 닫힘)
 *   2) 텍스트 직접 입력 (수동 코드 입력)
 *
 * Props:
 *   gameActive      - 게임이 활성화 상태인지 여부 (false이면 스캔 버튼 비활성)
 *   onScan(code)    - 코드가 인식됐을 때 호출되는 콜백. { message } 객체를 반환해야 함
 *   externalMessage - 부모 컴포넌트에서 주입하는 상태 메시지 (예: 서버 응답 결과)
 */
function CameraScanner({ gameActive, onScan, externalMessage }) {
  // video 엘리먼트 참조 — 카메라 스트림을 재생하는 데 사용
  const videoRef = useRef(null);
  // canvas 엘리먼트 참조 — 화면에는 숨겨두고 프레임 픽셀 데이터를 추출하는 데 사용
  const canvasRef = useRef(null);
  // requestAnimationFrame ID 참조 — 모달 닫힐 때 루프를 취소하기 위해 보관
  const animFrameRef = useRef(null);
  // 직전에 스캔한 코드 — 3초 내 동일 코드 중복 처리를 막기 위한 잠금 값
  const lastScannedRef = useRef('');

  const [cameraOpen, setCameraOpen] = useState(false); // 카메라 팝업 열림 여부
  const [scanning, setScanning] = useState(false);     // 스캔 라인 애니메이션 표시 여부
  const [scanInput, setScanInput] = useState('');       // 수동 입력 필드 값
  const [message, setMessage] = useState('카메라로 QR 코드를 스캔하거나 코드를 직접 입력하세요.');

  // 부모로부터 외부 메시지가 전달되면 안내 문구를 덮어씀
  useEffect(() => {
    if (externalMessage) setMessage(externalMessage);
  }, [externalMessage]);

  // ESC 키로 카메라 팝업 닫기
  useEffect(() => {
    if (!cameraOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') setCameraOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [cameraOpen]);

  /**
   * scanFrame
   * requestAnimationFrame 루프로 매 프레임마다 호출됨.
   * video 엘리먼트의 현재 프레임을 숨겨진 canvas에 그린 뒤
   * jsQR로 QR 코드를 디코딩한다.
   * QR 코드가 감지되면 onScan 콜백을 호출하고 팝업을 자동으로 닫는다.
   */
  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // 영상 데이터가 아직 준비되지 않았으면 다음 프레임에서 재시도
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    // 현재 비디오 프레임을 canvas에 그려 픽셀 데이터를 얻음
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // jsQR로 픽셀 데이터를 분석해 QR 코드 디코딩 시도
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert' // 색상 반전 시도 생략 → 속도 향상
    });

    // QR 코드가 감지됐고, 직전에 스캔한 코드와 다를 때만 처리
    if (code && code.data && code.data !== lastScannedRef.current) {
      lastScannedRef.current = code.data;
      const result = onScan(code.data);
      setMessage(`QR 인식: ${code.data} — ${result.message}`);
      // 인식 성공 시 팝업 자동 닫기
      setCameraOpen(false);
      // 3초 후 동일 코드 재스캔 허용
      setTimeout(() => { lastScannedRef.current = ''; }, 3000);
      return; // 루프 중단 (cleanup이 카메라를 종료함)
    }

    // 다음 프레임 예약
    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [onScan]);

  /**
   * cameraOpen 상태가 바뀔 때 카메라를 켜거나 끄는 사이드이펙트.
   * - 열릴 때: 후면 카메라 스트림을 요청하고 scanFrame 루프를 시작
   * - 닫힐 때(cleanup): 애니메이션 루프를 취소하고 카메라 스트림 트랙을 모두 중지
   */
  useEffect(() => {
    let stream = null;

    /**
     * startCamera
     * 브라우저에 카메라 권한을 요청하고 video 엘리먼트에 스트림을 연결한다.
     * 권한 거부 등 오류 발생 시 안내 메시지를 표시하고 팝업을 닫는다.
     */
    const startCamera = async () => {
      try {
        // facingMode: 'environment' → 모바일에서 후면(메인) 카메라 우선 사용
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScanning(true);
          animFrameRef.current = requestAnimationFrame(scanFrame); // QR 스캔 루프 시작
        }
      } catch {
        setMessage('카메라를 사용할 수 없습니다. 코드를 직접 입력해 주세요.');
        setCameraOpen(false);
      }
    };

    if (cameraOpen) {
      startCamera();
    }

    // 팝업이 닫히거나 컴포넌트가 언마운트될 때 리소스 정리
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop()); // 카메라 하드웨어 해제
      }
      setScanning(false);
    };
  }, [cameraOpen, scanFrame]);

  /**
   * handleManualScan
   * 텍스트 입력 필드에 직접 입력된 코드를 onScan에 전달하는 핸들러.
   * 입력값이 비어 있으면 안내 메시지만 표시하고 종료한다.
   */
  const handleManualScan = () => {
    if (!scanInput) {
      setMessage('QR 코드 텍스트를 입력하세요. 예: CLUE-01');
      return;
    }
    const result = onScan(scanInput);
    setMessage(result.message);
    if (result.success) setScanInput('');
  };

  return (
    <div className="form-group">
      {/* 카메라 팝업 열기 버튼 */}
      <button type="button" className="control-button" onClick={() => setCameraOpen(true)}>
        카메라로 QR 스캔
      </button>

      {/* 수동 코드 입력 영역 */}
      <div className="form-group">
        <label htmlFor="scan-input">코드 직접 입력</label>
        <input
          id="scan-input"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && gameActive && handleManualScan()}
          placeholder="예: CLUE-01"
        />
        <button type="button" className="control-button" onClick={handleManualScan} disabled={!gameActive}>
          확인
        </button>
      </div>

      {/* 스캔 결과 및 안내 메시지 출력 영역 */}
      <div className="message-box">
        <p>{message}</p>
      </div>

      {/* 카메라 팝업 모달 — cameraOpen이 true일 때만 렌더링 */}
      {cameraOpen && (
        <div className="modal-overlay" onClick={() => setCameraOpen(false)}>
          <div className="camera-modal" onClick={(e) => e.stopPropagation()}>
            <div className="camera-modal-header">
              <span className="camera-modal-title">QR 코드에 카메라를 가져다 대세요</span>
              <button
                type="button"
                className="modal-close"
                onClick={() => setCameraOpen(false)}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* 카메라 영상 및 스캔 오버레이 */}
            <div className="camera-viewport">
              <video ref={videoRef} muted playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              {scanning && (
                <div className="scan-overlay">
                  <div className="scan-line" />
                </div>
              )}
              {/* 중앙 조준선 가이드 */}
              <div className="scan-guide" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraScanner;
