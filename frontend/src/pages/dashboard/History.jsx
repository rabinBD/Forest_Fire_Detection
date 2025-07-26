
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
      const res = await fetch(`http://localhost:8080/api/sensors/getSensorHistory?limit=${limit}&page=${sensorPage}`);
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
      const res = await fetch(`http://localhost:8080/api/sensors/getDetectData?limit=${limit}&page=${firePage}`);
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
      <h2>Sensor History <button style={{marginLeft:8}} onClick={fetchSensorHistory}>Refresh</button></h2>
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
            <th>Smoke</th>
            <th>Flame</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {[...sensorHistory].slice(0, 10).reverse().map((entry, idx) => (
            <tr key={idx}>
              <td>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "N/A"}</td>
              <td>{entry.temperature ?? "N/A"}</td>
              <td>{entry.smoke ?? "N/A"}</td>
              <td>{entry.flame ? "Yes" : "No"}</td>
              <td style={{ color: entry.fireDetected ? "red" : "green" }}>
                {entry.fireDetected ? "🔥 Fire Detected" : "✅ Normal"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
          <div className="pagination">
            <button disabled={sensorPage === 1} onClick={() => setSensorPage(sensorPage - 1)}>Prev</button>
            <span>Page {sensorPage} of {sensorTotalPages}</span>
            <button disabled={sensorPage === sensorTotalPages} onClick={() => setSensorPage(sensorPage + 1)}>Next</button>
          </div>
        </>
      )}

      <h2> Fire Detection Events <button style={{marginLeft:8}} onClick={fetchFireHistory}>Refresh</button></h2>
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
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {[...fireHistory].slice(0, 5).reverse().map((entry, idx) => (
            <tr key={idx}>
              <td>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "N/A"}</td>
              <td>
                {entry.imageUrl ? (
                  <img src={entry.imageUrl} alt="Fire Event" style={{ width: 150, borderRadius: 4 }} />
                ) : "N/A"}
              </td>
              <td>{`Location ${idx % 2 === 0 ? 1 : 2}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
          <div className="pagination">
            <button disabled={firePage === 1} onClick={() => setFirePage(firePage - 1)}>Prev</button>
            <span>Page {firePage} of {fireTotalPages}</span>
            <button disabled={firePage === fireTotalPages} onClick={() => setFirePage(firePage + 1)}>Next</button>
          </div>
        </>
      )}
    </section>
  );
}

export default History;
