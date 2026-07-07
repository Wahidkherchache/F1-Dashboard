import './PointsBar.css';

export default function PointsBar({ value, max, label }) {
  const pct = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="points-bar">
      <div className="points-bar-track">
        <div
          className="points-bar-fill"
          style={{ width: `${pct}%` }}
        />
        <div className="points-bar-glow" style={{ width: `${pct}%` }} />
      </div>
      {label && <span className="points-bar-label mono">{label}</span>}
    </div>
  );
}
