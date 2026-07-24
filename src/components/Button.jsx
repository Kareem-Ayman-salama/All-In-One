export function Button({ children, variant = "primary", className = "", as: Component = "button", ...props }) {
  const buttonProps = Component === "button"
    ? { type: props.type || (props.form ? "submit" : "button") }
    : {};

  return (
    <Component className={`btn btn-${variant} ${className}`} {...buttonProps} {...props}>
      {children}
    </Component>
  );
}
