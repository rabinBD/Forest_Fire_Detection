
import React, { useEffect, useState } from "react";
import { getAuth, signInWithCustomToken } from "firebase/auth";


const Settings = () => {
  const [isSuppressed, setIsSuppressed] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const limit = 10;
  const [deleteDate, setDeleteDate] = useState("");
  const [deleteType, setDeleteType] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
  const initializeAuth = async () => {
    const auth = getAuth();
    const customToken = localStorage.getItem('firebaseCustomToken'); 
    if (customToken) {
      try {
        await signInWithCustomToken(auth, customToken);
        console.log("Successfully signed in with custom token.");
      } catch (error) {
        console.error("Custom token sign-in failed:", error);
      }
    }
  };
  initializeAuth();
}, []);

  useEffect(() => {
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
  }, []);

  const fetchLogs = async (page = logPage) => {
    try {
      const res = await fetch(`http://localhost:8080/api/notify/logs?limit=${limit}&page=${page}`);
      const result = await res.json();
      if (result.success) {
        setLogs(result.data);
        setLogTotalPages(result.totalPages);
      }
    } catch (err) {
      setLogs([]);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logPage]);

  const toggleSuppression = async () => {
    if (!isSuppressed) {
      await fetch('http://localhost:8080/api/notify/suppression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suppress: true })
      });
      setIsSuppressed(true);
      fetchLogs(1); // Refresh logs after action
      setLogPage(1);
    }
  };

  const resumeNotifications = async () => {
    setResumeLoading(true);
    await fetch('http://localhost:8080/api/notify/suppression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suppress: false })
    });
    setIsSuppressed(false);
    setResumeLoading(false);
    fetchLogs(1); // Refresh logs after action
    setLogPage(1);
  };

  return (
    <section id="settings">
      <h2>Settings</h2>
      <div style={{ margin: '20px 0', padding: '10px', background: '#f5f5f5', borderRadius: '8px', maxWidth: 400 }}>
        <p>
          Notifications are currently: <strong>{isSuppressed ? 'Paused for 24 hours' : 'Active'}</strong>
        </p>
        {!isSuppressed && (
          <button onClick={toggleSuppression} style={{ padding: '10px', marginTop: '10px' }}>
            Pause Notifications for 1 Day
          </button>
        )}
        {isSuppressed && (
          <button onClick={resumeNotifications} style={{ padding: '10px', marginTop: '10px' }} disabled={resumeLoading}>
            {resumeLoading ? 'Resuming...' : 'Resume Notifications Now'}
          </button>
        )}
      </div>



      {/* Modern Suppression Logs Card (Admin Only) */}
      <div style={{
        margin: '32px 0',
        padding: '24px',
        background: 'linear-gradient(90deg, #e3fcec 0%, #d1e7dd 100%)',
        borderRadius: 16,
        maxWidth: 800,
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
        border: '1px solid #b7e4c7',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h3 style={{ color: '#176a3a', fontWeight: 700, fontSize: 24, margin: 0 }}>Suppression Logs <span style={{ fontSize: 16, fontWeight: 400, color: '#176a3a' }}>(Admin Only)</span></h3>
          <button
            disabled={deleteLoading}
            style={{
              background: '#176a3a',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: 16,
              boxShadow: deleteLoading ? 'none' : '0 2px 8px rgba(23,106,58,0.12)',
              cursor: deleteLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              marginLeft: 12,
            }}
            onClick={async () => {
              if (!window.confirm('Delete ALL suppression logs? This cannot be undone.')) return;

              setDeleteLoading(true);
              setDeleteMessage("");

              try {
                const user = getAuth().currentUser;
                console.log("current user:", user);
                if (!user) {
                  setDeleteMessage("User not logged in.");
                  setDeleteLoading(false);
                  return;
                }


                const token = await user.getIdToken();

                const res = await fetch('http://localhost:8080/api/admin/delete-logs', {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  }
                });

                if (!res.ok) {
                  const errorData = await res.json();
                  console.error("Backend returned error:", errorData);
                  throw new Error(errorData.message || "Delete failed");
                }
                const result = await res.json();
                setDeleteMessage(result.success ? 'All suppression logs deleted.' : result.message || 'Delete failed.');
              } catch (err) {
                console.error("Delete error:", err);
                setDeleteMessage("Delete request failed." +err.message);
              }

              setDeleteLoading(false);
              fetchLogs(1);
              setLogPage(1);
            }}
          >{deleteLoading ? 'Deleting...' : 'Delete All Suppression Logs'}</button>
        </div>
        {deleteMessage && (
          <div style={{ color: deleteMessage.includes('deleted') ? '#176a3a' : '#d00000', background: '#fff', borderRadius: 6, padding: '8px 12px', marginBottom: 16, fontWeight: 500, boxShadow: '0 2px 8px rgba(23,106,58,0.07)' }}>
            {deleteMessage}
          </div>
        )}
        {logs.length === 0 ? (
          <p style={{ color: '#d00000', fontWeight: 500 }}>No logs found.</p>
        ) : (
          <>
            <table className="history-table" style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(23,106,58,0.07)' }}>
              <thead style={{ background: '#b7e4c7' }}>
                <tr>
                  <th style={{ color: '#176a3a', fontWeight: 700, fontSize: 16 }}>Time</th>
                  <th style={{ color: '#176a3a', fontWeight: 700, fontSize: 16 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}</td>
                    <td style={{ fontWeight: 500 }}>{log.action ?? "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination" style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button disabled={logPage === 1} onClick={() => setLogPage(logPage - 1)} style={{ background: '#fff', color: '#176a3a', border: '1px solid #b7e4c7', borderRadius: 4, padding: '6px 14px', fontWeight: 600, cursor: logPage === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
              <span style={{ fontWeight: 600, color: '#176a3a' }}>Page {logPage} of {logTotalPages}</span>
              <button disabled={logPage === logTotalPages} onClick={() => setLogPage(logPage + 1)} style={{ background: '#fff', color: '#176a3a', border: '1px solid #b7e4c7', borderRadius: 4, padding: '6px 14px', fontWeight: 600, cursor: logPage === logTotalPages ? 'not-allowed' : 'pointer' }}>Next</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
export default Settings;
