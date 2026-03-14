import { useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

const SalesChart = () => {

  const [view, setView] = useState("day");

  // Example data
  const salesData = {
    day: {
      labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
      data: [120,190,300,250,400,500,350]
    },

    month: {
      labels: ["Week 1","Week 2","Week 3","Week 4"],
      data: [1200,1500,1800,2100]
    },

    year: {
      labels: [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec"
      ],
      data: [5000,7000,6500,8000,9000,10000,9500,11000,12000,13000,12500,15000]
    }
  };

  const data = {
    labels: salesData[view].labels,
    datasets: [
      {
        label: "Sales",
        data: salesData[view].data,
        borderColor: "rgb(54,162,235)",
        backgroundColor: "rgba(54,162,235,0.2)",
        tension: 0.4,
        fill: true
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" }
    }
  };

  return (
    <div style={{ width: "100%", margin: "auto" }}>
      <select
        value={view}
        onChange={(e) => setView(e.target.value)}
        style={{ width: "15%",backgroundColor: "black", color: "white" , marginBottom: "2px", padding: "5px", border: "0", borderRadius: "1rem" }}
      >
        <option value="day">Daily</option>
        <option value="month">Monthly</option>
        <option value="year">Yearly</option>
      </select>

      <Line data={data} options={options} />
    </div>
  );
};

export default SalesChart;