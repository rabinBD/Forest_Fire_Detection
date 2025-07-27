// import React, { useEffect, useState } from "react";
// import "../../styles/Dashboard2.css";
// import { FaTemperatureHigh, FaCloud, FaUserCircle, FaHistory, FaCog, FaEnvelope, FaMicrochip, FaThLarge, FaShieldAlt } from "react-icons/fa";
// import { WiHumidity } from "react-icons/wi";
// import { FaFireFlameCurved } from "react-icons/fa6";
// import LeafletMap from "../../components/LeafletMap";
// import { onMessageListener, requestPermission } from "../../../services/firebase";

// const Dashboard2 = () => {
//   const [temperature, setTemperature] = useState(null);
//   const [humidity, setHumidity] = useState(null);
//   const [gas, setGas] = useState(null);
//   const [flame, setFlame] = useState(null);
//   const [fireStatus, setFireStatus] = useState("Normal");
//   const [showPopup, setShowPopup] = useState(false);
//   const [notificationMessage, setNotificationMessage] = useState("");
//   const [userEmail, setUserEmail] = useState("");
//   const [userRole, setUserRole] = useState("");

//   // Firebase Notifications
//   useEffect(() => {
//     requestPermission();

//     const unsubscribe = onMessageListener((payload) => {
//       const { title, body } = payload.notification;
//       const message = `${title}: ${body}`;
//       setNotificationMessage(message);
//       setShowPopup(true);
//       setFireStatus("Fire Detected!");

//       setTimeout(() => {
//         setShowPopup(false);
//         setNotificationMessage("");
//         setFireStatus("Normal");
//       }, 10000); // 10 seconds
//     });

//     return () => unsubscribe();
//   }, []);

//   // WebSocket for live sensor data
//   useEffect(() => {
//     const socket = new WebSocket("https://a6b67507c2c0.ngrok-free.app/api/sensors/data");

//     socket.onopen = () => {
//       setTemperature(0);
//       setHumidity(0);
//       setGas(0);
//       setFlame(false);
//     };

//     socket.onmessage = (event) => {
//       try {
//         const message = JSON.parse(event.data);
//         if (message.type === "sensor_update") {
//           const { temperature, humidity, gas, flame } = message.data;
//           setTemperature(temperature);
//           setHumidity(humidity);
//           setGas(gas);
//           setFlame(flame);
//         }
//       } catch (err) {
//         console.error("WebSocket error:", err);
//       }
//     };

//     return () => socket.close();
//   }, []);

//   // Fire Detection Polling
//   useEffect(() => {
//     const fetchFireStatus = async () => {
//       try {
//         const res = await fetch("http://localhost:8080/api/sensors/getDetectData?limit=1&page=1");
//         if (res.status === 304) return; // Avoid processing unchanged responses

//         const data = await res.json();
//         const latest = data?.data?.[0];

//         if (latest?.fireDetected) {
//           setFireStatus("Fire Detected!");
//           setShowPopup(true);
//           setNotificationMessage("Fire Detected: There is a fire in the area!");

//           setTimeout(() => {
//             setShowPopup(false);
//             setNotificationMessage("");
//           }, 10000); // Hide after 10 seconds
//         } else {
//           setFireStatus("Normal");
//         }
//       } catch (err) {
//         console.error("Fire data fetch error:", err);
//       }
//     };

//     fetchFireStatus();
//     const interval = setInterval(fetchFireStatus, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     const email = localStorage.getItem("userEmail") || "Not Available";
//     const role = localStorage.getItem("userRole") || "Not Available";
//     setUserEmail(email);
//     setUserRole(role);
//   }, []);

//   return (
//     <section className="dash" id="dashboard-view">
//       {/* Centered Toast Fire Alert */}
//       {showPopup && (
//         <div className="center-toast-popup">
//           {notificationMessage}
//         </div>
//       )}

//       <main className="main-content" id="dashboard">
//         <div className="cards-container" id="sensors">
//           <SensorCard
//             title="Temperature"
//             value={temperature !== null ? `${temperature} °C` : "Loading..."}
//             color="red"
//             icon={<FaTemperatureHigh size={30} color="red" />}
//           />
//           <SensorCard
//             title="Humidity"
//             value={humidity !== null ? `${humidity} %` : "Loading..."}
//             color="green"
//             icon={<WiHumidity size={50} color="blue" />}
//           />
//           <SensorCard
//             title="Gas"
//             value={gas !== null ? `${gas} ppm` : "Loading..."}
//             color="gray"
//             icon={<FaCloud size={40} color="yellow" />}
//           />
//           <SensorCard
//             title="Flame"
//             value={
//               flame !== null ? (flame ? "Flame Detected" : "No Flame") : "Loading..."
//             }
//             color={flame ? "red" : "gray"}
//             icon={<FaFireFlameCurved size={30} color="red" />}
//           />
//         </div>

//         <div className="top-section">
//           <div className="status-card">
//             <div className="chart-container bg-gradient-to-r from-green-500 to-blue-500 h-full flex justify-center items-center text-white">
//               <div className="text-center">
//                 <div className="icon-div">
//                   <FaShieldAlt size={36} className="opacity-80" />
//                 </div>
//                 <p className="text-lg font-medium">System Status: {fireStatus}</p>
//                 <p className="text-sm opacity-80 mt-2">
//                   All sensors operating within {fireStatus === "Normal" ? "normal" : "alert"} parameters
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="map-container">
//             <LeafletMap />
//           </div>
//         </div>
//       </main>
//     </section>
//   );
// };

// const SensorCard = ({ title, value, color, icon }) => (
//   <div className={`sensor-card ${color}`}>
//     <div className="sensor-content">
//       <h4>{title}</h4>
//       <div className="sensor-value">
//         <p>{value}</p>
//       </div>
//     </div>
//     <div className="icon">{icon}</div>
//   </div>
// );

// export default Dashboard2;

import React, { useEffect, useState } from "react";
import "../../styles/Dashboard2.css";
import { FaTemperatureHigh, FaCloud, FaUserCircle, FaHistory, FaCog, FaEnvelope, FaMicrochip, FaThLarge, FaShieldAlt } from "react-icons/fa";
import { WiHumidity } from "react-icons/wi";
import { FaFireFlameCurved } from "react-icons/fa6";
import LeafletMap from "../../components/LeafletMap";
import { onMessageListener, requestPermission } from "../../../services/firebase";

const Dashboard2 = () => {
  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [gas, setGas] = useState(null);
  const [flame, setFlame] = useState(null);
  const [fireStatus, setFireStatus] = useState("Normal");
  const [showPopup, setShowPopup] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");

  // Firebase Notifications
  useEffect(() => {
    requestPermission();

    const unsubscribe = onMessageListener((payload) => {
      const { title, body } = payload.notification;
      const message = `${title}: ${body}`;
      setNotificationMessage(message);
      setShowPopup(true);
      setFireStatus("Fire Detected!");

      setTimeout(() => {
        setShowPopup(false);
        setNotificationMessage("");
        setFireStatus("Normal");
      }, 10000); // 10 seconds
    });

    return () => unsubscribe();
  }, []);

  // WebSocket for live sensor data
  useEffect(() => {
    const socket = new WebSocket("https://09d4b3953237.ngrok-free.app/api/sensors/data");

    socket.onopen = () => {
      setTemperature(0);
      setHumidity(0);
      setGas(0);
      setFlame(false);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "sensor_update") {
          const { temperature, humidity, gas, flame } = message.data;
          setTemperature(temperature);
          setHumidity(humidity);
          setGas(gas);
          setFlame(flame);
        }
      } catch (err) {
        console.error("WebSocket error:", err);
      }
    };

    socket.onclose = () => {
      console.warn("WebSocket disconnected. Attempting to reconnect...");
      setTimeout(() => {
        const newSocket = new WebSocket("https://09d4b3953237.ngrok-free.app/api/sensors/data");
        newSocket.onmessage = socket.onmessage;
        newSocket.onopen = socket.onopen;
        newSocket.onclose = socket.onclose;
      }, 5000); // Reconnect after 5 seconds
    };

    return () => socket.close();
  }, []);

  // Fire Detection Polling
  useEffect(() => {
    const fetchFireStatus = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/sensors/getDetectData?limit=1&page=1");
        if (res.status === 304) return; // Avoid processing unchanged responses

        const data = await res.json();
        const latest = data?.data?.[0];

        if (latest?.fireDetected) {
          setFireStatus("Fire Detected!");
          setShowPopup(true);
          setNotificationMessage("Fire Detected: There is a fire in the area!");

          setTimeout(() => {
            setShowPopup(false);
            setNotificationMessage("");
          }, 10000); // Hide after 10 seconds
        } else {
          setFireStatus("Normal");
        }
      } catch (err) {
        console.error("Fire data fetch error:", err);
      }
    };

    fetchFireStatus();
    const interval = setInterval(fetchFireStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const email = localStorage.getItem("userEmail") || "Not Available";
    const role = localStorage.getItem("userRole") || "Not Available";
    setUserEmail(email);
    setUserRole(role);
  }, []);

  return (
    <section className="dash" id="dashboard-view">
      {/* Centered Toast Fire Alert */}
      {showPopup && (
        <div className="center-toast-popup">
          {notificationMessage}
        </div>
      )}

      <main className="main-content" id="dashboard">
        <div className="cards-container" id="sensors">
          <SensorCard
            title="Temperature"
            value={temperature !== null ? `${temperature} °C` : "Loading..."}
            color="red"
            icon={<FaTemperatureHigh size={30} color="red" />}
          />
          <SensorCard
            title="Humidity"
            value={humidity !== null ? `${humidity} %` : "Loading..."}
            color="green"
            icon={<WiHumidity size={50} color="blue" />}
          />
          <SensorCard
            title="Gas"
            value={gas !== null ? `${gas} ppm` : "Loading..."}
            color="gray"
            icon={<FaCloud size={40} color="yellow" />}
          />
          <SensorCard
            title="Flame"
            value={
              flame !== null ? (flame ? "Flame Detected" : "No Flame") : "Loading..."
            }
            color={flame ? "red" : "gray"}
            icon={<FaFireFlameCurved size={30} color="red" />}
          />
        </div>

        <div className="top-section">
          <div className="status-card">
            <div className="chart-container bg-gradient-to-r from-green-500 to-blue-500 h-full flex justify-center items-center text-white">
              <div className="text-center">
                <div className="icon-div">
                  <FaShieldAlt size={36} className="opacity-80" />
                </div>
                <p className="text-lg font-medium">
                  System Status: {fireStatus}
                </p>
                <p className="text-sm opacity-80 mt-2">
                  All sensors operating within {fireStatus === "Normal" ? "normal" : "alert"} parameters
                </p>
              </div>
            </div>
          </div>

          <div className="map-container">
            <LeafletMap />
          </div>
        </div>
      </main>
    </section>
  );
};

const SensorCard = ({ title, value, color, icon }) => (
  <div className={`sensor-card ${color}`}>
    <div className="sensor-content">
      <h4>{title}</h4>
      <div className="sensor-value">
        <p>{value}</p>
      </div>
    </div>
    <div className="icon">{icon}</div>
  </div>
);

export default Dashboard2;

