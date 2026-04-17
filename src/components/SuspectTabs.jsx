import { useState } from 'react';
import InfoCard from './InfoCard.jsx';

function SuspectTabs({ suspects }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSuspect = suspects[activeIndex];

  return (
    <div className="card">
      <h2>용의자 목록</h2>
      <div className="tab-list">
        {suspects.map((suspect, index) => (
          <button
            key={suspect.id}
            type="button"
            className={`tab-button ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
          >
            {suspect.name}
          </button>
        ))}
      </div>
      <div className="tab-content">
        <InfoCard title="선택된 용의자" details={activeSuspect} />
      </div>
    </div>
  );
}

export default SuspectTabs;
