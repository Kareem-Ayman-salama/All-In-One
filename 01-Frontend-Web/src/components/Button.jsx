export function Button({
  children,
  variant = "primary",
  className = "",
  as: Component = "button",
  loading = false,
  loadingLabel,
  ...props
}) {
  const buttonProps = Component === "button"
    ? { type: props.type || (props.form ? "submit" : "button") }
    : {};

  const isDisabled = Boolean(props.disabled || loading);

  return (
    <Component
      className={`btn btn-${variant} ${className}`}
      {...buttonProps}
      {...props}
      disabled={Component === "button" ? isDisabled : undefined}
      aria-busy={loading || undefined}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {loading && loadingLabel ? loadingLabel : children}
    </Component>
  );
}
