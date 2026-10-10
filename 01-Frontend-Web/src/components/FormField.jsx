export function FormField({ label, error, hint, children, as: Component = "label", required = false }) {
  return (
    <Component className={error ? "form-field has-error" : "form-field"}>
      <span>{label}{required && <em aria-hidden="true"> *</em>}</span>
      {children}
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && <small role="alert">{error}</small>}
    </Component>
  );
}
