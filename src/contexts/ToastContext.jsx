import { createContext, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const value = useMemo(() => ({
    showToast(message, tone = "success", action = null) {
      const id = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      setToasts((current) => [...current, { id, message, tone, action }]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 3200);
    }
  }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} role={toast.tone === "danger" ? "alert" : "status"} key={toast.id}>
            <span>{toast.message}</span>
            {toast.action && <button type="button" onClick={() => { toast.action.onClick(); setToasts((current) => current.filter((item) => item.id !== toast.id)); }}>{toast.action.label}</button>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider");
  return value;
}
