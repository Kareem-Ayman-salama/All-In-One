export function FormField({ label, error, hint, children }) {
  return (
    <label className={error ? "form-field has-error" : "form-field"}>
      <span>{label}</span>
      {children}
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && <small>{error}</small>}
    </label>
  );
}
