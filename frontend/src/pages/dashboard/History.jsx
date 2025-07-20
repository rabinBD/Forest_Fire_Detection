import React, { useEffect, useState } from "react";
import "../../styles/history.css";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/sensors/data")
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch history", err);
        setLoading(false);
      });
  }, []);

  return (
    <section className="history-section" id="history">
      <h2>Alert & Sensor History</h2>
      {loading ? (
        <p>Loading...</p>
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
            {history.length > 0 ? (
              history.map((entry, idx) => (
                <tr key={idx}>
                  <td>{new Date(entry.timestamp).toLocaleString()}</td>
                  <td>{entry.temperature}</td>
                  <td>{entry.humidity}</td>
                  <td>{entry.smoke}</td>
                  <td style={{ color: entry.fireDetected ? "red" : "green" }}>
                    {entry.fireDetected ? "🔥 Fire Detected" : "✅ Normal"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default History;
