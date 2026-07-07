import './SummaryCard.css';

export default function SummaryCard({ label, title, subtitle, value, icon }) {
  return (
    <div className="summary-card animate-in">
      <div className="summary-card-icon">{icon}</div>
      <div className="summary-card-content">
        <span className="summary-card-label">{label}</span>
        <h3 className="summary-card-title">{title}</h3>
        {subtitle && <span className="summary-card-subtitle">{subtitle}</span>}
        {value !== undefined && (
          <span className="summary-card-value mono">{value} pts</span>
        )}
      </div>
    </div>
  );
}
