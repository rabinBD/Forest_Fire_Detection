import React, { useEffect, useState } from "react";
import "../../styles/Dashboard2.css";

import {
  FaUserCircle,
  FaHistory,
  FaCog,
  FaEnvelope,
  FaMicrochip,
  FaThLarge,
} from "react-icons/fa";
import LeafletMap from "../../components/LeafletMap";
import defaultForestImage from "../../assets/dashboard-forest.png";
import defaultMapImage from "../../assets/map.png";
import fireImage from "../../assets/fire.png"; // Add fire image to your assets folder


const Dashboard2 = () => {
  const [mapImage, setMapImage] = useState("");
  const [forestImage, setForestImage] = useState("");
  const [fireEventImage, setFireEventImage] = useState("");
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [gas, setGas] = useState(null);
  const [fireStatus, setFireStatus] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [showFireImage, setShowFireImage] = useState(false); // 👈 control fire image
  const [flame, setFlame] = useState(null);

  // AlertSilencer state
  const [isSuppressed, setIsSuppressed] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);

  useEffect(() => {
    // Load static images
    fetch("/api/map-image")
      .then((res) => res.json())
      .then((data) => setMapImage(data.url))
      .catch(() => setMapImage(defaultMapImage));

    fetch("/api/forest-image")
      .then((res) => res.json())
      .then((data) => setForestImage(data.url))
      .catch(() => setForestImage(defaultForestImage));

    // WebSocket connection to receive real-time sensor data
    const socket = new WebSocket(
      "https://d8bd8ca2aebd.ngrok-free.app/api/sensors/data"
    );
    //ws://localhost:8080

    ws: socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "sensor_update") {
          const { temperature, humidity, gas, flame } = message.data;

          setTemperature(temperature);
          setHumidity(humidity);
          setGas(gas);
          setFlame(flame);

          const fireDetected = gas > 100 || temperature > 40 || flame === true;
          setFireStatus(fireDetected ? "🔥 Fire Detected!" : "✅ Normal");
          setShowPopup(fireDetected);
          setShowFireImage(fireDetected);

          // If fire detected, fetch latest fire event image
          if (fireDetected) {
            fetch('http://localhost:8080/api/sensors/getDetectData?limit=1&page=1')
              .then(res => res.json())
              .then(data => {
                if (data.success && data.data && data.data[0]?.imageUrl) {
                  setFireEventImage(data.data[0].imageUrl);
                } else {
                  setFireEventImage("");
                }
              })
              .catch(() => setFireEventImage(""));
          } else {
            setFireEventImage("");
          }
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    // Fetch notification suppression status from backend API
    const fetchSuppression = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/notify/suppression');
        const data = await res.json();
        setIsSuppressed(!!data.longSuppression);
      } catch (err) {
        setIsSuppressed(false);
      }
    };
    fetchSuppression();

    return () => socket.close();
  }, []);



  return (
    <section className="dashboard-container" id="dashboard-view">
      {/*  Fire Alert Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2>Fire Detected!</h2>
            <p>Temperature and smoke levels are above normal.</p>
            <button onClick={() => setShowPopup(false)}>Close</button>
          </div>
        </div>
      )}

   

      <main className="main-content" id="dashboard">
        <h2 className="dashboard-title">Dashboard</h2>

        <div className="top-section">
          <div className="status-card">
            <h3>Status</h3>
            <img
              src={showFireImage && fireEventImage ? fireEventImage : (forestImage || defaultForestImage)}
              alt={showFireImage && fireEventImage ? "Fire Event" : "Forest Status"}
              className="status-image"
              style={{ border: showFireImage ? "2px solid red" : "none" }}
            />
            <p style={{ color: showFireImage ? "red" : "green", fontWeight: "bold" }}>
              {showFireImage ? "🔥 Fire Detected!" : "✅ Normal"}
            </p>
          </div>

          <div className="map-container">
            <LeafletMap />
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
          <SensorCard
            title="Flame"
            value={
              flame !== null
                ? flame
                  ? "🔥 Flame Detected"
                  : "✅ No Flame"
                : "Loading..."
            }
            color={flame ? "red" : "gray"} // Optional: color highlight for flame
          />
        </div>
      </main>
    </section>
  );
};

const SensorCard = ({ title, value, color, loading }) => (
  <div className={`sensor-card ${color}`}>
    <h4>{title}</h4>
    <div className="sensor-value">
      <p>{value}</p>
    </div>
  </div>
);

export default Dashboard2;
