import React, { useEffect, useState } from "react";
import axios from "axios";
import BackButton from "../../components/BackButton/BackButton";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";

import "./Disaster.css";

const Disaster = () => {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    axios.get("http://localhost:5001/analyze-disaster-map")

      .then(res => {

        setData(res.data.results || []);
        setLoading(false);

      })

      .catch(err => {

        console.log(err);
        setLoading(false);

      });

  }, []);

  // Filter valid locations
  const filteredData = data.filter(
    item => item.location && item.location.length > 2
  );

  // Top locations
  const locationCounts = {};

  filteredData.forEach(item => {

    locationCounts[item.location] =
      (locationCounts[item.location] || 0) + 1;

  });

  const topLocations = Object.entries(locationCounts)

    .sort((a, b) => b[1] - a[1])

    .slice(0, 5);

  // Bar chart data
  const barData = topLocations.map(([location, count]) => ({
    location,
    count
  }));

  // Pie chart data
  const disasterCounts = {};

  filteredData.forEach(item => {

    disasterCounts[item.disaster] =
      (disasterCounts[item.disaster] || 0) + 1;

  });

  const pieData = Object.entries(disasterCounts).map(
    ([type, count]) => ({
      name: type,
      value: count
    })
  );

  if (loading) {

    return (

      <div className="loading-container">

        <BackButton />

        <h2>
          Loading disaster data...
        </h2>

      </div>
    );
  }

  return (

    <div className="disaster-container">

      {/* HEADER */}
      <div className="disaster-header">

        <BackButton />

        <h1 className="disaster-title">
          🌍 Disaster Analysis Dashboard
        </h1>

        <div className="header-space"></div>

      </div>

      {/* Top Locations */}
      <div className="dashboard-card">

        <h2>
          📍 Top Locations
        </h2>

        <ul className="location-list">

          {topLocations.map(([loc, count], index) => (

            <li key={index}>
              {loc} → {count} reports
            </li>

          ))}

        </ul>

      </div>

      {/* 📊 Bar Chart */}
<div className="dashboard-card">

  <h2>
    🔮📈 Top Locations
  </h2>

  <div className="chart-wrapper">

    <BarChart
      width={700}
      height={320}
      data={barData}
    >

      <CartesianGrid
        strokeDasharray="3 3"
        stroke="#ddd6fe"
      />

      <XAxis
        dataKey="location"
        tick={{ fill: "#6b7280" }}
      />

      <YAxis
        tick={{ fill: "#6b7280" }}
      />

      <Tooltip
        contentStyle={{
          borderRadius: "16px",
          border: "none",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          background: "rgba(255,255,255,0.95)"
        }}
      />

      <Bar
        dataKey="count"
        radius={[12,12,0,0]}
      >

        {barData.map((entry, index) => (

          <Cell
            key={`cell-${index}`}
            fill={[
              "#8b5cf6", // purple
              "#ec4899", // pink
              "#3b82f6", // blue
              "#14b8a6", // teal
              "#f59e0b"  // orange
            ][index % 5]}
          />

        ))}

      </Bar>

    </BarChart>

  </div>

</div>

      {/* 🥧 Pie Chart */}
      <div className="dashboard-card">

        <h2>
          🪄🥧 Disaster Distribution
        </h2>

        <div className="chart-wrapper">

          <PieChart width={450} height={320}>

            <Pie
  data={pieData}
  dataKey="value"
  nameKey="name"
  outerRadius={110}
  label
>

  {pieData.map((entry, index) => (

    <Cell
      key={`cell-${index}`}
      fill={[
        "#8b5cf6", // purple
        "#ec4899", // pink
        "#3b82f6", // blue
        "#14b8a6", // teal
        "#f59e0b", // orange
        "#ef4444"  // red
      ][index % 6]}
    />

  ))}

</Pie>

            <Legend />

            <Tooltip />

          </PieChart>

        </div>

      </div>

      {/* TABLE */}
      <div className="dashboard-card">

        <h2>
          🌪️ Location → Disaster
        </h2>

        <div className="table-wrapper">

          <table className="disaster-table">

            <thead>

              <tr>
                <th>Location</th>
                <th>Disaster</th>
              </tr>

            </thead>

            <tbody>

              {filteredData.slice(0, 50).map((item, index) => (

                <tr key={index}>

                  <td>{item.location}</td>

                  <td>{item.disaster}</td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* SAMPLE TWEETS */}
      <div className="dashboard-card">

        <h2>
          📄 Sample Predictions
        </h2>

        {filteredData.slice(0, 5).map((item, index) => (

          <div
            key={index}
            className="tweet-card"
          >

            <b>
              📍 {item.location}
            </b>

            <br />

            🌪️ {item.disaster}

            <br />

            📝 {item.tweet}

          </div>

        ))}

      </div>

    </div>
  );
};

export default Disaster;