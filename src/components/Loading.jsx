import { useLanguage } from "../contexts/LanguageContext";

export function Loading() {
  const { t } = useLanguage();

  return (
    <div className="loading loading-skeleton" role="status" aria-live="polite">
      <span>{t.loading}</span>
      <div className="skeleton-grid">
        {Array.from({ length: 6 }).map((_, index) => <div className="skeleton-card" key={index} />)}
      </div>
    </div>
  );
}
