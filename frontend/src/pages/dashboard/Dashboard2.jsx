import React, { useEffect, useState } from "react";
import "./Dashboard2.css";
import {
  FaUserCircle,
  FaHistory,
  FaCog,
  FaEnvelope,
  FaMicrochip,
  FaThLarge,
} from "react-icons/fa";
import { Link } from "react-router-dom";

import defaultMapImage from "../../assets/map.png";
import defaultForestImage from "../../assets/dashboard-forest.png";
import LeafletMap from "../../components/LeafletMap";

const Dashboard2 = () => {
  const [mapImage, setMapImage] = useState("");
  const [forestImage, setForestImage] = useState("");
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [gas, setGas] = useState(null);
  const [fireStatus, setFireStatus] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Fetch map and forest image
    fetch("/api/map-image")
      .then((res) => res.json())
      .then((data) => setMapImage(data.url))
      .catch(() => setMapImage(defaultMapImage));

    fetch("/api/forest-image")
      .then((res) => res.json())
      .then((data) => setForestImage(data.url))
      .catch(() => setForestImage(defaultForestImage));

    // Fetch sensor data every 10 seconds
    const fetchSensorData = () => {
      fetch("http://localhost:8080/api/sensors/latest")
        .then((res) => res.json())
        .then((data) => {
          setTemperature(data.temperature);
          setHumidity(data.humidity);
          setGas(data.gas);

          const fireDetected = data.fireDetected;
          setFireStatus(fireDetected ? "🔥 Fire Detected!" : "✅ Normal");
          setShowPopup(fireDetected);
        })
        .catch((err) => {
          console.error("Failed to fetch sensor data", err);
        });
    };

    fetchSensorData();
    const interval = setInterval(fetchSensorData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="dashboard-container" id="dashboard-view">
      {/* 🔥 Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>🚨 Fire Detected!</h2>
            <p>Temperature and smoke levels are above normal.</p>
            <button onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}

      <main className="main-content" id="dashboard">
        <h2 className="dashboard-title">Dashboard</h2>

        <div className="top-section">
          <div className="map-container">
            {/* <img
              src={mapImage || defaultMapImage}
              alt="Map"
              className="map-image"
            /> */}
            <LeafletMap />
          </div>
          <div className="status-card">
            <h3>Status</h3>
            <img
              src={forestImage || defaultForestImage}
              alt="Forest Status"
              className="status-image"
            />
            <p>{fireStatus || "Status unavailable"}</p>
          </div>
        </div>

        <div className="cards-container" id="sensors">
          <SensorCard
            title="Temperature"
            value={temperature !== null ? `${temperature} °C` : "Loading..."}
            color="red"
          />
          <SensorCard
            title="Humidity"
            value={humidity !== null ? `${humidity} %` : "Loading..."}
            color="green"
          />
          <SensorCard
            title="Gas"
            value={gas !== null ? `${gas} ppm` : "Loading..."}
            color="gray"
          />
        </div>
      </main>
    </section>
  );
};

const SensorCard = ({ title, value, color }) => {
  return (
    <div className={`sensor-card ${color}`}>
      <h4>{title}</h4>
      <div className="sensor-value">
        <p>{value}</p>
      </div>
    </div>
  );
};

export default Dashboard2;
