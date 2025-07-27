import React, { useEffect, useState } from "react";
import "../../styles/History.css";

function History() {
  const [sensorHistory, setSensorHistory] = useState([]);
  const [fireHistory, setFireHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sensorPage, setSensorPage] = useState(1);
  const [sensorTotalPages, setSensorTotalPages] = useState(1);
  const [firePage, setFirePage] = useState(1);
  const [fireTotalPages, setFireTotalPages] = useState(1);
  const limit = 10;

  // Manual refresh for sensor history
  const fetchSensorHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/sensors/getSensorHistory?limit=${limit}&page=${sensorPage}`
      );
      const result = await res.json();
      if (result.success) {
        setSensorHistory(result.data);
        setSensorTotalPages(result.totalPages);
      }
    } catch (err) {
      setSensorHistory([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSensorHistory();
  }, [sensorPage]);

  // Manual refresh for fire history
  const fetchFireHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/sensors/getDetectData?limit=${limit}&page=${firePage}`
      );
      const result = await res.json();
      if (result.success) {
        setFireHistory(result.data);
        setFireTotalPages(result.totalPages);
      }
    } catch (err) {
      setFireHistory([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchFireHistory();
  }, [firePage]);

  return (
    <section className="history-section" id="history">
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
        Sensor History{" "}
        <button
          style={{
            marginLeft: 8,
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            padding: "3px 7px",
            borderRadius: "4px",
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            transition: "background-color 0.3s ease",
          }}
          onClick={() => {
            fetchSensorHistory();
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.innerText = 'Sensor history refreshed!';
            document.body.appendChild(notification);
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 3000);
          }}
        >
          Refresh
        </button>
      </h2>
      {loading ? (
        <p>Loading...</p>
      ) : sensorHistory.length === 0 ? (
        <p style={{ color: "red" }}>No sensor data available.</p>
      ) : (
        <>
      <table className="history-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Temperature (°C)</th>
            <th>Gas</th>
            <th>Humidity (%)</th>
          </tr>
        </thead>
        <tbody>
          {[...sensorHistory]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10)
            .map((entry, idx) => (
              <tr key={idx}>
                <td>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "N/A"}</td>
                <td>{entry.temperature ?? "N/A"}</td>
                <td>{entry.gas ?? "N/A"}</td>
                <td>{entry.humidity ?? "N/A"}</td>
              </tr>
            ))}
        </tbody>
      </table>
          <div className="pagination">
            <button
              disabled={sensorPage === 1}
              onClick={() => setSensorPage(sensorPage - 1)}
            >
              Prev
            </button>
            <span>
              Page {sensorPage} of {sensorTotalPages}
            </span>
            <button
              disabled={sensorPage === sensorTotalPages}
              onClick={() => setSensorPage(sensorPage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}

      <div style={{ margin: '20px 0' }}></div>

      <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
        Fire Detection Events 
        <button
          style={{
             marginLeft: 8,
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            padding: "4px 8px",
            borderRadius: "4px",
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            transition: "background-color 0.3s ease",
          }}
          onClick={() => {
            fetchFireHistory();
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.innerText = 'Fire detection events refreshed!';
            document.body.appendChild(notification);
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 3000);
          }}
        >
          Refresh
        </button>
      </h2>
      {loading ? (
        <p>Loading...</p>
      ) : fireHistory.length === 0 ? (
        <p style={{ color: "red" }}>No fire events found.</p>
      ) : (
        <>
      <table className="history-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Image</th>
            <th>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {[...fireHistory]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5)
            .map((entry, idx) => (
              <tr key={idx}>
                <td>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "N/A"}</td>
                <td>
                  {entry.imageUrl ? (
                    <img src={entry.imageUrl} alt="Fire Event" style={{ width: 150, borderRadius: 4 }} />
                  ) : "N/A"}
                </td>
                <td style={{ color: entry.fireDetected ? "red" : "green" }}>
                  {entry.fireDetected ? "Fire" : "No Fire"}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
          <div className="pagination">
            <button
              disabled={firePage === 1}
              onClick={() => setFirePage(firePage - 1)}
            >
              Prev
            </button>
            <span>
              Page {firePage} of {fireTotalPages}
            </span>
            <button
              disabled={firePage === fireTotalPages}
              onClick={() => setFirePage(firePage + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </section>
  );
}

export default History;

