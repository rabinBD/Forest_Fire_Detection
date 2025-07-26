import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
import { onMessageListener, messaging } from "../services/firebase";
// import "./App.css";
import LandingPage from "./pages/landing/LandingPage";
import Dashboard2 from "./pages/dashboard/Dashboard2"; // updated dashboard
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import History from "./pages/dashboard/History";
import Sensors from "./pages/dashboard/Sensors";
import Messages from "./pages/dashboard/Messages";
import Settings from "./pages/dashboard/Settings";

function App() {
  useEffect(() => {
    const unsubscribe = onMessageListener();
    console.log("unsubscribe: ", unsubscribe);

    return () => {
      unsubscribe();
    };
  }, [messaging]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Nested Dashboard2 layout and its child pages */}
        <Route path="/dashboard2" element={<DashboardLayout />}>
          <Route index element={<Dashboard2 />} />
          <Route path="history" element={<History />} />
          <Route path="sensors" element={<Sensors />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
