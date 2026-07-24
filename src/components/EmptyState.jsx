import { Inbox } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({ title = "Nothing here yet", message = "Create your first item to start using this workspace.", actionLabel, onAction }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state-icon"><Inbox size={22} /></div>
      <strong>{title}</strong>
      <span>{message}</span>
      {actionLabel && <Button variant="ghost" onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
