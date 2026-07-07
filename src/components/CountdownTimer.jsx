import { useState, useEffect } from 'react';
import './CountdownTimer.css';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function CountdownTimer({ targetDate, raceName }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!targetDate) return;

    function calc() {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!targetDate) {
    return (
      <div className="countdown countdown--finished">
        <span>Season complete</span>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="countdown countdown--live">
        <span className="live-dot" />
        <span>Race in progress or starting soon</span>
      </div>
    );
  }

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds },
  ];

  return (
    <div className="countdown">
      <div className="countdown-race">{raceName}</div>
      <div className="countdown-units">
        {units.map(({ label, value }) => (
          <div key={label} className="countdown-unit">
            <span className="countdown-value mono">{pad(value)}</span>
            <span className="countdown-label">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
