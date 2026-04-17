function EvidenceList({ evidence }) {
  if (evidence.length === 0) {
    return <p>아직 수집한 증거가 없습니다. QR 코드를 스캔해 증거를 찾으세요.</p>;
  }

  return (
    <div>
      {evidence.map((item) => (
        <div key={item.code} className="evidence-item">
          <div className="evidence-code">[{item.code}] {item.title}</div>
          <div>{item.description}</div>
          <div><strong>추가 정보:</strong> {item.detail}</div>
        </div>
      ))}
    </div>
  );
}

export default EvidenceList;
