import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  FaUserCircle,
  FaHistory,
  FaCog,
  FaEnvelope,
  FaMicrochip,
  FaThLarge,
  FaBars,
  FaTimes,
  FaSignOutAlt,
} from "react-icons/fa";
import "../../styles/Dashboard2.css";
import "../../styles/Popup.css";

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const location = useLocation();
  console.log(location);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="layout">
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <a href="#home" className="sidebar-logo">
            <h2>FireGuard</h2>
          </a>
          <button className="close-btn" onClick={closeSidebar}>
            <FaTimes />
          </button>
        </div>
        <Link to="" className="sidebar-link" onClick={closeSidebar}>
          <FaThLarge /> <span>Dashboard</span>
        </Link>
        <Link to="history" className="sidebar-link" onClick={closeSidebar}>
          <FaHistory /> <span>History</span>
        </Link>
        {/* <Link to="sensors" className="sidebar-link" onClick={closeSidebar}>
          <FaMicrochip /> Sensors
        </Link> */}
        {/* <Link to="messages" className="sidebar-link" onClick={closeSidebar}>
          <FaEnvelope /> Messages
        </Link> */}
        <Link to="settings" className="sidebar-link" onClick={closeSidebar}>
          <FaCog /> <span>Settings</span>
        </Link>
        <Link to="/login" className="sidebar-link" onClick={closeSidebar}>
          <FaSignOutAlt /> <span>Logout</span>
        </Link>
      </aside>

      <div className="dashboard-container">
        <nav className="navbar">
          <button className="menu-btn" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <h1 className="logo">
            {location.pathname === "/dashboard2"
              ? "Dashboard"
              : location.pathname === "/dashboard2/settings"
              ? "Settings"
              : "History"}
          </h1>
          <div className="logo-container">
            <div className="logo-content-container">
              <div className="font-bold text-sm text-gray-600">Admin</div>
              <div className="text-sm font-semibold text-gray-600">
                laxmi@gmail.com
              </div>
            </div>
            <FaUserCircle className="user-icon" />
          </div>
        </nav>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
