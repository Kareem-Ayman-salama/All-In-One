import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    const isAr = document.documentElement.lang === "ar";
    const t = (ar, en) => (isAr ? ar : en);

    return (
      <main className="error-page">
        <section className="card error-card">
          <h1>{t("خطأ في التطبيق", "Application error")}</h1>
          <p>{t("تم تحميل الواجهة، لكن React توقف بسبب خطأ في وقت التشغيل.", "The frontend loaded, but React stopped because of a runtime error.")}</p>
          <pre>{this.state.error.message}</pre>
          <button
            className="btn btn-primary"
            onClick={() => {
              window.localStorage.clear();
              window.location.href = "/";
            }}
          >
            {t("مسح الجلسة وإعادة التحميل", "Clear session and reload")}
          </button>
        </section>
      </main>
    );
  }
}
