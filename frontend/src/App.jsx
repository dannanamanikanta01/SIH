import React from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import RoleDashboard from "./pages/RoleDashboard";
import "./App.css";
import { useState } from "react";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sih_user")) || null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("sih_token");
    localStorage.removeItem("sih_user");
    setUser(null);
  };

  return (
    <div className="app-root">
      {!user ? (
        <Login onLogin={setUser} />
      ) : user.role === "user" ? (
        <Home onLogout={handleLogout} />
      ) : (
        <RoleDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}
