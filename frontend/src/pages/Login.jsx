import React, { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { api } from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("user@sih.local");
  const [password, setPassword] = useState("user123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.login({ email, password });
      localStorage.setItem("sih_token", result.token);
      localStorage.setItem("sih_user", JSON.stringify(result.user));
      onLogin(result.user);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to sign in. Start the backend and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-visual">
          <div className="login-visual-mark">
            <ShieldCheck size={26} />
          </div>
          <p className="login-visual-kicker">SIH26034 / LEGAL METROLOGY</p>
          <h1>Make every label decision visible.</h1>
          <p>
            Scan a package, find missing declarations, and keep the review trail
            in one calm workspace.
          </p>
          <div className="login-visual-footer">
            <span>OCR</span>
            <span>Rule 6</span>
            <span>Audit-ready</span>
          </div>
        </div>

        <div className="login-form-side">
          <p className="eyebrow">ACCESS PORTAL</p>
          <h2>Sign in to continue</h2>
          <p className="login-copy">
            Choose the workspace that matches your role.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <span className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
            {error && <p className="form-error">{error}</p>}
            <button
              className="primary-btn login-submit"
              type="submit"
              disabled={loading}
            >
              <LockKeyhole size={17} /> {loading ? "Signing in..." : "Sign in"}{" "}
              <ArrowRight size={17} />
            </button>
          </form>

          <div className="demo-credentials">
            <strong>Prototype accounts</strong>
            <span>User: user@sih.local / user123</span>
            <span>Inspector: inspector@sih.local / inspector123</span>
            <span>Admin: admin@sih.local / admin123</span>
          </div>
        </div>
      </section>
    </main>
  );
}
