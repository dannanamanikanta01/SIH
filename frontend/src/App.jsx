import React, { useEffect, useState } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RoleDashboard from "./pages/RoleDashboard";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sih_user")) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener("sih:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("sih:session-expired", handleSessionExpired);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("sih_token");
    localStorage.removeItem("sih_user");
    setUser(null);
  };

  const handleLogin = (nextUser) => {
    setUser(nextUser);
  };

  return (
    <div className="app-root">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : user.role === "user" ? (
        <Home onLogout={handleLogout} />
      ) : (
        <RoleDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}
