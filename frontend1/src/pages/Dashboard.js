import React, {
  useEffect,
  useState
} from "react";

import axios from "axios";

import BackButton from "../components/BackButton/BackButton";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer
} from "recharts";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";

import "./Dashboard.css";

// =====================================================
// LEAFLET FIX
// =====================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// =====================================================
// MARKERS
// =====================================================

const disasterMarkers = {

  Flood:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",

  Fire:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",

  Cyclone:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",

  Heatwave:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",

  Other:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png"
};

// =====================================================
// COLORS
// =====================================================

const disasterColors = {

  Flood: "#3498db",

  Fire: "#ff4d4d",

  Cyclone: "#8e44ad",

  Heatwave: "#f39c12",

  Other: "#7f8c8d",

  Disaster: "#ff4d4d",

  NonDisaster: "#2ecc71"
};



// =====================================================
// COMPONENT
// =====================================================

function Dashboard() {

  const [disasterData, setDisasterData] =
    useState([]);

  const [priorityStats, setPriorityStats] =
    useState([]);

  const [needsStats, setNeedsStats] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchDashboard = async () => {

    try {

      setLoading(true);

     const res = await axios.get(
  "http://localhost:5001/disaster-data"
);
      // =========================================
      // REMOVE DUPLICATES
      // =========================================

      const uniqueData = [
        ...new Map(
          (res.data.disaster || []).map(
            item => [item.tweet, item]
          )
        ).values()
      ];

      setDisasterData(uniqueData);

      // =========================================
      // PRIORITY CHART
      // =========================================

      const priorityChart =
        Object.entries(
          res.data.priority || {}
        ).map(([level, value]) => ({
          level,
          value
        }));

      setPriorityStats(priorityChart);

      // =========================================
      // NEEDS
      // =========================================
      // FORMAT:
      // [{ name: "Food", count: 5 }]

      setNeedsStats(
        res.data.needs || []
      );

      setError("");

      setLoading(false);

    } catch (err) {

      console.log("Dashboard Error:", err);

      setError(
        "Failed to load dashboard"
      );

      setLoading(false);
    }
  };

  // =====================================================
  // AUTO REFRESH
  // =====================================================

  useEffect(() => {

    fetchDashboard();

    

  }, []);

  // =====================================================
  // DISASTER COUNTS
  // =====================================================

  const disasterCounts = {};

  disasterData.forEach(item => {

    if (item.disaster) {

      disasterCounts[item.disaster] =
        (disasterCounts[item.disaster] || 0) + 1;
    }

  });

  const disasterTypes =
    Object.entries(disasterCounts)

      .map(([name, value]) => ({
        name,
        value
      }));

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="loading-container">

        <div className="loader"></div>

        <h2>
          Loading Live Dashboard...
        </h2>

      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (

      <div className="loading-container">

        <h2>
          {error}
        </h2>

      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="dashboard-container">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div className="dashboard-header">
        

        <BackButton />

        <div>

          <h1 className="dashboard-title">
            Live Disaster Dashboard
          </h1>

          <p className="dashboard-subtitle">
            Real-time AI Disaster Monitoring
          </p>

        </div>
        <button
    className="refresh-btn"
    onClick={fetchDashboard}
  >
    Refresh Dashboard
  </button>

      </div>

      {/* ========================================= */}
      {/* STATS */}
      {/* ========================================= */}

      <div className="stats-grid">

        <div className="stats-card glow-red">

          <h3>
            Total Reports
          </h3>

          <p>
            {disasterData.length}
          </p>

        </div>

        <div className="stats-card glow-orange">

          <h3>
            High Priority
          </h3>

          <p>

            {
              priorityStats.find(
                p => p.level === "HIGH"
              )?.value || 0
            }

          </p>

        </div>

        <div className="stats-card glow-blue">

          <h3>
            Human Needs
          </h3>

          <p>
            {needsStats.length}
          </p>

        </div>

      </div>

      {/* ========================================= */}
      {/* CHARTS */}
      {/* ========================================= */}

      <div className="charts-grid">

        {/* ===================================== */}
        {/* DISASTER TYPES */}
        {/* ===================================== */}

        <div className="chart-box">

          <h3>
            Disaster Types
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <PieChart>

              <Pie
                data={disasterTypes}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >

                {
                  disasterTypes.map(
                    (d, i) => (

                      <Cell
                        key={i}

                        fill={
                          disasterColors[d.name]
                          || "#888"
                        }
                      />

                    )
                  )
                }

              </Pie>

              <Tooltip />

              <Legend />

            </PieChart>

          </ResponsiveContainer>

        </div>

        {/* ===================================== */}
        {/* PRIORITY */}
        {/* ===================================== */}

        <div className="chart-box">

          <h3>
            Priority Levels
          </h3>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart data={priorityStats}>

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="level" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="value"
                fill="#ff4d4d"
                radius={[8, 8, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        {/* ===================================== */}
        {/* HUMAN NEEDS */}
        {/* ===================================== */}

        <div className="chart-box">

          <h3>
            Humanitarian Needs Count
          </h3>

          <div className="needs-wrapper">

            {
              needsStats.map((need, i) => (

                <div
                  key={i}
                  className="need-pill"
                >

                  <span>
                    {need.name}
                  </span>

                  <strong>
                    {need.count}
                  </strong>

                </div>

              ))
            }

          </div>

        </div>

        {/* ===================================== */}
        {/* LIVE NEWS */}
        {/* ===================================== */}

        <div className="chart-box news-box">

          <h3>
            Live News
          </h3>

          <div className="news-wrapper">

            {
              disasterData.map((d, i) => (

                <div
                  key={i}
                  className="news-card"
                >

                  <span className="news-tag">
                    {d.disaster}
                  </span>

                  <p>
                    {d.tweet}
                  </p>

                </div>

              ))
            }

          </div>

        </div>

      </div>

   {/* ========================================= */}
{/* MAP */}
{/* ========================================= */}

<div className="map-box">

  <h3>
    Live Disaster Map
  </h3>

  <div className="map-container">

    <MapContainer
      center={[20.5937, 78.9629]}
      zoom={5}
      style={{
        height: "100%",
        width: "100%"
      }}
    >

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      {
        disasterData.map((d, i) => {

          const icon = new L.Icon({

            iconUrl:
              disasterMarkers[d.disaster]
              || disasterMarkers.Other,

            iconSize: [25, 41],

            iconAnchor: [12, 41],

            popupAnchor: [1, -34],

            shadowUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

            shadowSize: [41, 41]
          });

          return (

            <Marker
              key={i}
              position={[
                d.lat || 20.5937,
                d.lng || 78.9629
              ]}
              icon={icon}
            >

              <Popup>

                <div
                  style={{
                    minWidth: "220px"
                  }}
                >

                  <h3
                    style={{
                      margin: 0,
                      marginBottom: "10px",
                      color: "#111827"
                    }}
                  >
                    {d.location}
                  </h3>

                  <strong>
                    Disaster:
                  </strong>

                  {" "}
                  {d.disaster}

                  <br />
                  <br />

                  <strong>
                    Priority:
                  </strong>

                  {" "}
                  {d.priority}

                  <br />
                  <br />

                  <div
                    style={{
                      fontSize: "14px",
                      lineHeight: "1.6"
                    }}
                  >
                    {d.tweet}
                  </div>

                </div>

              </Popup>

            </Marker>
          );
        })
      }

    </MapContainer>

  </div>

</div>

    </div>
  );
}

export default Dashboard;