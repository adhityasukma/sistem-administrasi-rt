import './StatsCard.css';

export default function StatsCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  return (
    <div className="stats-card">
      <div className={`stats-card-icon ${color}`}>
        {Icon && <Icon />}
      </div>
      <div className="stats-card-content">
        <div className="stats-card-value">{value}</div>
        <div className="stats-card-title">{title}</div>
        {subtitle && <div className="stats-card-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}
