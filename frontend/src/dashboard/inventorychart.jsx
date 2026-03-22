import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Inventorychart = () => {
  const [chartData, setChartData] = useState(null);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/dashboard/inventory-levels",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await response.json();

        // Process data for Chart.js
        setChartData({
          labels: data.map((item) => item.label),
          datasets: [
            {
              label: "Available Stock",
              data: data.map((item) => item.stock),
              backgroundColor: data.map((item) =>
                // Red if stock is exactly at or below the minimum threshold
                item.stock <= item.min_stock
                  ? "rgb(186, 0, 0)"
                  : "rgb(0, 39, 72)",
              ),
              borderRadius: 4, // Gives the bars a slightly professional rounded look
            },
          ],
        });
      } catch (err) {
        console.error("Error fetching inventory chart:", err);
      }
    };

    if (token) fetchChartData();
  }, [token]);

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allows the chart to fill the container
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  if (!chartData) return <p>Loading chart...</p>;

  return (
    <div className="bar">
      <Bar data={chartData} options={options} />

      <div style={{ marginTop: "10px", fontSize: "12px" }}>
        <span style={{ color: "rgb(0, 39, 72)", marginRight: "15px" }}>
          ● Normal Stock
        </span>
        <span style={{ color: "rgb(186, 0, 0)" }}>
          ● Low Stock (At or below Min)
        </span>
      </div>
    </div>
  );
};

export default Inventorychart;
