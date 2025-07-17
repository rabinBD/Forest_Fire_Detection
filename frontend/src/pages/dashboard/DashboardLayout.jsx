import React from "react";
import { Outlet, Link } from "react-router-dom";
import {
  FaUserCircle,
  FaHistory,
  FaCog,
  FaEnvelope,
  FaMicrochip,
  FaThLarge,
} from "react-icons/fa";
import "./Dashboard2.css";

const DashboardLayout = () => {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>Menu</h2>
        <Link to="" className="sidebar-link">
          <FaThLarge /> Dashboard
        </Link>
        <Link to="history" className="sidebar-link">
          <FaHistory /> History
        </Link>
        <Link to="sensors" className="sidebar-link">
          <FaMicrochip /> Sensors
        </Link>
        <Link to="messages" className="sidebar-link">
          <FaEnvelope /> Messages
        </Link>
        <Link to="settings" className="sidebar-link">
          <FaCog /> Settings
        </Link>
      </aside>

      <div className="dashboard-container">
        <nav className="navbar">
          <h1 className="logo">FireGuard</h1>
          <FaUserCircle className="user-icon" />
        </nav>

        <main className="main-content">
          {/* Renders the page component here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
