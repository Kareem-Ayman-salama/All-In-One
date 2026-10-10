import { X } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { useBilingualText } from "../contexts/LanguageContext";

export function DetailPanel({ open, title, subtitle, meta = [], actions = [], activity = [], permissions = [], onClose }) {
  const tx = useBilingualText();
  if (!open) return null;

  const defaultActivity = [
    tx("تم الإنشاء في مساحة AIN", "Created in AIN workspace"),
    tx("تم فحص الصلاحيات", "Permissions checked"),
    tx("جاهز للمعالجة", "Ready for backend action"),
  ];

  return (
    <div className="detail-panel-backdrop" onMouseDown={onClose}>
      <aside className="detail-panel" aria-label={`${title} details`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="detail-panel-head">
          <div>
            <span>{tx("تفاصيل", "Details")}</span>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close details"><X size={18} /></button>
        </div>
        <div className="detail-panel-body">
          <div className="detail-meta-grid">
            {meta.map((item) => (
              <div className="detail-meta-item" key={item.label}>
                <span>{item.label}</span>
                {item.tone ? <Badge tone={item.tone}>{item.value}</Badge> : <strong>{item.value}</strong>}
              </div>
            ))}
          </div>
          <div className="detail-activity">
            <h3>{tx("النشاط", "Activity")}</h3>
            {(activity.length ? activity : defaultActivity).map((item) => (
              <div className="timeline-row" key={item}>
                <span className="timeline-dot" />
                <strong>{item}</strong>
              </div>
            ))}
          </div>
          {permissions.length > 0 && (
            <div className="detail-activity">
              <h3>{tx("الصلاحيات", "Permissions")}</h3>
              <div className="detail-permission-list">
                {permissions.map((item) => <Badge key={item} tone={item.includes("Blocked") ? "danger" : "success"}>{item}</Badge>)}
              </div>
            </div>
          )}
        </div>
        <div className="detail-panel-actions">
          {actions.map((action) => (
            <Button key={action.label} variant={action.variant || "ghost"} onClick={action.onClick}>{action.label}</Button>
          ))}
        </div>
      </aside>
    </div>
  );
}

