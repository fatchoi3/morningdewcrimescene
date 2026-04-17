import { useEffect, useRef, useState } from 'react';

function CameraScanner({ gameActive, onScan, externalMessage }) {
  const videoRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [message, setMessage] = useState('카메라를 활성화하고 QR 텍스트를 입력하거나 이미지를 업로드하세요.');

  useEffect(() => {
    if (externalMessage) {
      setMessage(externalMessage);
    }
  }, [externalMessage]);

  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        setMessage('카메라를 사용할 수 없습니다. 파일 업로드로 대체하세요.');
        setCameraOn(false);
      }
    };

    if (cameraOn) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraOn]);

  const handleToggleCamera = () => {
    setCameraOn((prev) => !prev);
  };

  const handleManualScan = () => {
    if (!scanInput) {
      setMessage('QR 코드 텍스트를 입력하세요. 예: CLUE-01');
      return;
    }
    const result = onScan(scanInput);
    setMessage(result.message);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const fileName = file.name.toUpperCase();
    const match = fileName.match(/CLUE-0[0-9]/);
    if (match) {
      const code = match[0];
      const result = onScan(code);
      setMessage(result.message + ' (파일명에서 자동 인식)');
    } else {
      setMessage('파일 이름에서 QR 코드를 찾을 수 없습니다. 예: CLUE-01.png');
    }
    event.target.value = '';
  };

  return (
    <div className="form-group">
      <div className="video-frame">
        {cameraOn ? (
          <video ref={videoRef} muted playsInline />
        ) : (
          <div className="video-placeholder">
            <p>카메라가 꺼져 있습니다.</p>
            <p>카메라 버튼을 눌러 시작하세요.</p>
          </div>
        )}
      </div>

      <button type="button" className="small-button" onClick={handleToggleCamera}>
        {cameraOn ? '카메라 끄기' : '카메라 켜기'}
      </button>

      <div className="form-group">
        <label htmlFor="scan-input">QR 코드 텍스트</label>
        <input
          id="scan-input"
          value={scanInput}
          onChange={(event) => setScanInput(event.target.value)}
          placeholder="예: CLUE-01"
        />
        <button type="button" className="control-button" onClick={handleManualScan} disabled={!gameActive}>
          스캔 시작
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="file-upload">QR 사진 업로드</label>
        <input id="file-upload" type="file" accept="image/*" onChange={handleFileUpload} />
        <p className="scan-hint">파일 이름에 CLUE-01, CLUE-02, CLUE-03 같은 코드를 넣으면 자동 인식됩니다.</p>
      </div>

      <div className="message-box">
        <p>{message}</p>
      </div>
    </div>
  );
}

export default CameraScanner;
