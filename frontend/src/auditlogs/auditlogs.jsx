import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { formatInTimeZone } from "date-fns-tz";
import "../auditlogs/auditlogs.css";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // Controls how many rows are currently visible
  const [visibleCount, setVisibleCount] = useState(15);
  const BATCH_SIZE = 12;

  const token = localStorage.getItem("access_token");

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:8000/audit_logs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error(
          "Failed to fetch audit logs:",
          res.status,
          res.statusText,
        );
        return;
      }

      const data = await res.json();
      setLogs(data);
      // Reset visible count when new data is loaded
      setVisibleCount(BATCH_SIZE);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const logDate = new Date(log.created_at);

    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.created_at.toLowerCase().includes(search.toLowerCase());

    let effectiveEnd = endDate;
    if (endDate) {
      effectiveEnd = new Date(endDate);
      effectiveEnd.setHours(23, 59, 59, 999);
    }

    const matchesDate =
      (!startDate || logDate >= startDate) &&
      (!effectiveEnd || logDate <= effectiveEnd);

    return matchesSearch && matchesDate;
  });

  // Reset visible count when filters change (so user starts fresh)
  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [search, startDate, endDate]);

  const handleShowMore = () => {
    setVisibleCount((prev) => prev + BATCH_SIZE);
  };

  const hasMore = filteredLogs.length > visibleCount;

  return (
    <div className="audit-logs-page">
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Search action or date..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "280px",
            padding: "0.5rem",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setDateRange(update)}
            isClearable={true}
            placeholderText="Select date range"
            dateFormat="MMM d, yyyy"
            maxDate={new Date()}
            showPopperArrow={false}
            className="custom-datepicker-input"
            wrapperClassName="custom-datepicker-wrapper"
          />
        </div>

        {(search || startDate || endDate) && (
          <button
            onClick={() => {
              setSearch("");
              setDateRange([null, null]);
            }}
            style={{
              padding: "0.5rem 1rem",
              background: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th>ID</th>
            <th>Username</th>
            <th>Action</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.length === 0 ? (
            <tr>
              <td
                colSpan="4"
                style={{ textAlign: "center", padding: "2.5rem" }}
              >
                No logs match your filters.
              </td>
            </tr>
          ) : (
            <>
              {filteredLogs.slice(0, visibleCount).map((log) => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.name}</td>
                  <td>{log.action}</td>
                  <td>
                    {formatInTimeZone(
                      log.created_at, // can be string or Date
                      "Asia/Manila",
                      "MMM d, yyyy | h:mm:ss a | zzz", // e.g. Mar 19, 2026 9:45:00 PM PHT
                    )}
                  </td>{" "}
                </tr>
              ))}

              {hasMore && (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "1.2rem",
                      backgroundColor: "#f9f9f9",
                    }}
                  >
                    <button
                      onClick={handleShowMore}
                      style={{
                        padding: "0.6rem 1.5rem",
                        backgroundColor: "#000000",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        fontWeight: "500",
                      }}
                    >
                      Show More ({visibleCount} of {filteredLogs.length} shown)
                    </button>
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogs;
