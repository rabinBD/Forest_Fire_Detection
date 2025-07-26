import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
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
          <FaThLarge /> Dashboard
        </Link>
        <Link to="history" className="sidebar-link" onClick={closeSidebar}>
          <FaHistory /> History
        </Link>
        {/* <Link to="sensors" className="sidebar-link" onClick={closeSidebar}>
          <FaMicrochip /> Sensors
        </Link> */}
        {/* <Link to="messages" className="sidebar-link" onClick={closeSidebar}>
          <FaEnvelope /> Messages
        </Link> */}
        <Link to="settings" className="sidebar-link" onClick={closeSidebar}>
          <FaCog /> Settings
        </Link>
        <Link to="/login" className="sidebar-link" onClick={() => { 
          localStorage.removeItem('token'); 
          closeSidebar(); 
        }}>
          <FaSignOutAlt /> Logout
        </Link>
      </aside>

      <div className="dashboard-container">
        <nav className="navbar">
          <button className="menu-btn" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <h1 className="logo">FireGuard</h1>
          <FaUserCircle className="user-icon" />
        </nav>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
