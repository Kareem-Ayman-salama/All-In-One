import { Card } from "./Card";

export function StatGrid({ items }) {
  return (
    <div className="stat-grid">
      {items.map((item) => (
        <Card className="stat-card" key={item.label}>
          <div className={`stat-dot tone-${item.tone || "primary"}`} />
          <div className="stat-value">{item.value}</div>
          <div className="stat-label">{item.label}</div>
        </Card>
      ))}
    </div>
  );
}
