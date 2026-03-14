import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";

import { Bar } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const Inventorychart = () => {

  // Example inventory data
  const items = [
    { name: "Item 1", stock: 80, max: 100 },
    { name: "Item 2", stock: 40, max: 100 },
    { name: "Item 3", stock: 65, max: 100 },
    { name: "Item 4", stock: 20, max: 100 },
    { name: "Item 5", stock: 55, max: 100 },
    { name: "Item 6", stock: 80, max: 100 },
    { name: "Item 7", stock: 40, max: 100 },
    { name: "Item 8", stock: 65, max: 100 },
    { name: "Item 9", stock: 20, max: 100 }
  ];

  const labels = items.map(item => item.name);

  const stockData = items.map(item => item.stock);

  // color indicator
  const colors = items.map(item =>
    item.stock < item.max * 0.5
      ? "rgb(186, 0, 0)"   // red
      : "rgb(0, 39, 72)"   // green
  );

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Available Stock",
        data: stockData,
        backgroundColor: colors
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div style={{ width: "100%", margin: "auto" }}>
      <Bar data={data} options={options} />

      <div style={{ marginTop: "10px" }}>
        <span style={{ color: "green", marginRight: "15px" }}>
          ● Normal Stock
        </span>
        <span style={{ color: "red" }}>
          ● Low Stock (&lt; 50%)
        </span>
      </div>
    </div>
  );
};

export default Inventorychart;