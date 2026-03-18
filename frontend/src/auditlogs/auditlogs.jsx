import React, { useEffect, useState } from "react";
import '../auditlogs/auditlogs.css'

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const token = localStorage.getItem("access_token");

  const fetchLogs = async () => {
    const res = await fetch("http://localhost:8000/audit_logs", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.created_at.includes(search)
  );

  return (
    <div className="audit-logs-page">
      <h2>Audit Logs</h2>
      <input
        type="text"
        placeholder="Search logs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: "10px", width: "300px" }}
      />
      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>User ID</th>
            <th>Action</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.user_id}</td>
              <td>{log.action}</td>
              <td>{new Date(log.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {filteredLogs.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogs;