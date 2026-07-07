import { useState, useEffect } from 'react';
import './StartLights.css';

export default function StartLights({ onComplete }) {
  const [activeLights, setActiveLights] = useState(0);
  const [phase, setPhase] = useState('sequence');
  const [goFlash, setGoFlash] = useState(false);

  useEffect(() => {
    const timers = [];

    for (let i = 1; i <= 5; i++) {
      timers.push(setTimeout(() => setActiveLights(i), i * 800));
    }

    timers.push(
      setTimeout(() => {
        setPhase('off');
        setActiveLights(0);
      }, 4800)
    );

    timers.push(
      setTimeout(() => {
        setGoFlash(true);
        setPhase('go');
      }, 5200)
    );

    timers.push(
      setTimeout(() => {
        onComplete?.();
      }, 5800)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className="start-lights-overlay">
      <div className="start-lights-panel">
        <div className="start-lights-label">LOADING TELEMETRY</div>
        <div className="start-lights-row">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`start-light ${
                phase === 'sequence' && activeLights >= n ? 'on' : ''
              } ${phase === 'off' ? 'off' : ''}`}
            />
          ))}
        </div>
        {goFlash && <div className="start-go">GO!</div>}
      </div>
    </div>
  );
}
