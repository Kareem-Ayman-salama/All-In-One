import { ArrowRight, CheckCircle2, Clock3, MoreHorizontal, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";

export function WorkspaceHero({ eyebrow, title, description, stats = [], actions, visual }) {
  return (
    <section className="workspace-hero">
      <div className="workspace-hero-copy">
        {eyebrow && <Badge tone="primary">{eyebrow}</Badge>}
        <h1>{title}</h1>
        <p>{description}</p>
        {actions && <div className="workspace-hero-actions">{actions}</div>}
        {stats.length > 0 && (
          <div className="workspace-hero-stats">
            {stats.map((stat) => (
              <span key={stat.label}>
                <strong>{stat.value}</strong>
                {stat.label}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="workspace-hero-visual">
        {visual || <ProductVisual />}
      </div>
    </section>
  );
}

export function ProductVisual() {
  return (
    <div className="product-visual" aria-hidden="true">
      <div className="product-card card-a">
        <Sparkles size={18} />
        <strong>AIO OS</strong>
        <span>Rooms, files, members</span>
      </div>
      <div className="product-card card-b">
        <ShieldCheck size={18} />
        <strong>Protected viewer</strong>
        <span>Watermark + no download</span>
      </div>
      <div className="product-orbit">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export function MetricRail({ items }) {
  return (
    <div className="metric-rail">
      {items.map((item) => (
        <MetricCard key={item.label} {...item} />
      ))}
    </div>
  );
}

export function MetricCard({ label, value, detail, tone = "primary", icon }) {
  return (
    <Card className={`metric-card metric-${tone}`}>
      <div className="metric-icon">{icon || <Sparkles size={18} />}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </Card>
  );
}

export function ActionGrid({ actions }) {
  return (
    <div className="action-grid">
      {actions.map((action) => {
        const Icon = action.icon || ArrowRight;
        const content = (
          <>
            <span className="action-icon"><Icon size={18} /></span>
            <strong>{action.title}</strong>
            <small>{action.description}</small>
          </>
        );
        if (action.onClick) {
          return <button className="action-card" onClick={action.onClick} type="button" key={action.title}>{content}</button>;
        }
        return <a className="action-card" href={action.href} key={action.title}>{content}</a>;
      })}
    </div>
  );
}

export function SectionHeader({ title, description, action }) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ResourceCard({ title, subtitle, meta = [], status, color = "#4F46E5", icon }) {
  return (
    <Card className="resource-card">
      <div className="resource-head">
        <div className="resource-icon" style={{ background: color }}>{icon || title.slice(0, 2).toUpperCase()}</div>
        <button className="icon-btn soft" type="button" aria-label={`More actions for ${title}`}><MoreHorizontal size={17} /></button>
      </div>
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
      <div className="resource-meta">
        {meta.map((item) => <span key={item}>{item}</span>)}
      </div>
      {status && <Badge tone={status.tone || "primary"}>{status.label}</Badge>}
    </Card>
  );
}

export function TimelineCard({ title, items }) {
  return (
    <Card title={title}>
      <div className="timeline-list">
        {items.map((item) => (
          <div className="timeline-item" key={item.title}>
            <span className={`timeline-dot ${item.tone || ""}`} />
            <div>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </div>
            <Badge tone={item.tone || "neutral"}>{item.time}</Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ChecklistCard({ title = "Launch checklist", items }) {
  return (
    <Card title={title} action={<Badge tone="primary">{items.filter((item) => item.done).length} / {items.length}</Badge>}>
      <div className="clean-checklist">
        {items.map((item) => (
          <div className={item.done ? "clean-check done" : "clean-check"} key={item.title}>
            <CheckCircle2 size={18} />
            <div>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </div>
            {!item.done && <Button variant="ghost">Continue</Button>}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function CalendarBoard({ events }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <section className="premium-calendar">
      <div className="calendar-month-head">
        <div>
          <span>July 2026</span>
          <strong>Connected schedule</strong>
        </div>
        <Badge tone="primary">{events.length} actions</Badge>
      </div>
      <div className="premium-calendar-grid">
        {days.map((day, index) => (
          <div className={index === 3 ? "premium-day active" : "premium-day"} key={day}>
            <span>{day}</span>
            <strong>{index + 12}</strong>
            {index === 3 && <small>Review</small>}
          </div>
        ))}
      </div>
      <div className="agenda-list">
        {events.map((event) => (
          <div className="event-card" key={event.title}>
            <div className="event-meta">
              <div className="event-icon"><Clock3 size={18} /></div>
              <div>
                <strong>{event.title}</strong>
                <span>{event.description}</span>
              </div>
            </div>
            <Button variant="ghost">{event.action}</Button>
          </div>
        ))}
      </div>
    </section>
  );
}
