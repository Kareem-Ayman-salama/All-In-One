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

    return (
      <main className="error-page">
        <section className="card error-card">
          <h1>Application error</h1>
          <p>The frontend loaded, but React stopped because of a runtime error.</p>
          <pre>{this.state.error.message}</pre>
          <button
            className="btn btn-primary"
            onClick={() => {
              window.localStorage.clear();
              window.location.href = "/";
            }}
          >
            Clear session and reload
          </button>
        </section>
      </main>
    );
  }
}
