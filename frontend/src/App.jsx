import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { setupFCMListener } from "../services/firebase";
import LandingPage from "./pages/landing/LandingPage";
import Dashboard2 from "./pages/dashboard/Dashboard2";
import Signup from "./pages/auth/Signup";
import Login from "./pages/auth/Login";
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import History from "./pages/dashboard/History";
import Sensors from "./pages/dashboard/Sensors";
import Messages from "./pages/dashboard/Messages";
import Settings from "./pages/dashboard/Settings";

function App() {
  useEffect(() => {
    setupFCMListener((notification) => {
      // Dispatch event globally
      const event = new CustomEvent("fire-alert", { detail: notification });
      window.dispatchEvent(event);
    });
  }, []);

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
