function InfoCard({ title, details }) {
  return (
    <div className="card" style={{ marginBottom: '18px' }}>
      <h2>{title}</h2>
      <div className="form-group">
        {Object.entries(details).map(([key, value]) => (
          <div key={key}>
            <strong>{key === 'name' ? '이름' : key === 'age' ? '나이' : key === 'occupation' ? '직업' : key === 'gender' ? '성별' : key === 'hint' ? '힌트' : key === 'specialHint' ? '특별 단서' : key === 'detail' ? '설명' : key === 'notes' ? '참고' : key}:</strong>
            <div>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InfoCard;
