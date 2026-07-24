export function OtpInput({ value, onChange, label }) {
  return (
    <fieldset className="otp-fieldset" dir="ltr">
      <legend>{label}</legend>
      <input
        className="otp-combined-input"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        aria-label={label}
        placeholder="••••••"
      />
    </fieldset>
  );
}
