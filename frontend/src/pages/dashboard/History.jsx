import React, { useEffect, useState, useRef } from "react";
import "../../styles/History.css";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/sensors/data");
        const result = await res.json(); // result = { success: true, data: [...] }
        console.log("📥 Fetched from API:", result);

        if (result.success && Array.isArray(result.data)) {
          setHistory(result.data); // ✅ use only the array part
          localStorage.setItem("sensorHistory", JSON.stringify(result.data));
        } else {
          console.warn("⚠️ API response malformed:", result);
        }
        setLoading(false);
      } catch (err) {
        console.error("⚠️ Failed to fetch from API, loading from cache", err);
        const cached = localStorage.getItem("sensorHistory");
        if (cached) {
          setHistory(JSON.parse(cached));
        }
        setLoading(false);
      }
    };

    fetchData();

    // WebSocket
    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    ws.onmessage = (event) => {
      const newEntry = JSON.parse(event.data);
      console.log("📡 New data received:", newEntry);

      setHistory((prev) => {
        const updated = [newEntry, ...prev];
        localStorage.setItem("sensorHistory", JSON.stringify(updated));
        return updated;
      });
    };

    ws.onerror = (err) => console.error("WebSocket error:", err);
    ws.onclose = () => console.log("❌ WebSocket disconnected");

    return () => {
      ws.close();
    };
  }, []);

  return (
    <section className="history-section" id="history">
      <h2>Alert & Sensor History</h2>
      {loading ? (
        <p>Loading...</p>
      ) : history.length === 0 ? (
        <p style={{ color: "red" }}>No data available.</p>
      ) : (
        <table className="history-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Temperature (°C)</th>
              <th>Smoke</th>
              <th>Flame</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, idx) => (
              <tr key={idx}>
                <td>{new Date(entry.timestamp).toLocaleString()}</td>
                <td>{entry.temperature}</td>
                <td>{entry.smoke}</td>
                <td>{entry.flame ? "Yes" : "No"}</td>
                <td style={{ color: entry.fireDetected ? "red" : "green" }}>
                  {entry.fireDetected ? "🔥 Fire Detected" : "✅ Normal"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default History;
