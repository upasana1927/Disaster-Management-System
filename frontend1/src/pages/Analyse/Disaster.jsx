import React, { useEffect, useState } from "react";
import axios from "axios";
import BackButton from "../../components/BackButton/BackButton";

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
  Legend
} from "recharts";

import "./Disaster.css";

const Disaster = () => {

  // =====================================================
  // STATES
  // =====================================================

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 MANUAL INPUT
  const [manualTweet, setManualTweet] = useState("");
  const [manualResult, setManualResult] = useState(null);

  // =====================================================
  // FETCH DATASET ANALYSIS
  // =====================================================

  useEffect(() => {

    axios
      .get("http://localhost:5001/analyze-disaster-map")

      .then((res) => {

        setData(res.data.results || []);

        setLoading(false);

      })

      .catch((err) => {

        console.log(err);

        setLoading(false);

      });

  }, []);

  // =====================================================
  // MANUAL ANALYSIS
  // =====================================================

  const analyzeManualTweet = async () => {

    if (!manualTweet.trim()) return;

    try {

      const res = await axios.post(

        "http://localhost:5001/manual-disaster-analysis",

        {
          tweet: manualTweet
        }
      );

      setManualResult(res.data);

    } catch (err) {

      console.log(err);

    }
  };

  // =====================================================
  // FILTER DATA
  // =====================================================

  const filteredData = data.filter(
    item =>
      item.location &&
      item.location.length > 2
  );

  // =====================================================
  // TOP LOCATIONS
  // =====================================================

  const locationCounts = {};

  filteredData.forEach((item) => {

    locationCounts[item.location] =
      (locationCounts[item.location] || 0) + 1;

  });

  const topLocations = Object.entries(locationCounts)

    .sort((a, b) => b[1] - a[1])

    .slice(0, 5);

  // =====================================================
  // BAR DATA
  // =====================================================

  const barData = topLocations.map(
    ([location, count]) => ({
      location,
      count
    })
  );

  // =====================================================
  // PIE DATA
  // =====================================================

  const disasterCounts = {};

  filteredData.forEach((item) => {

    disasterCounts[item.disaster] =
      (disasterCounts[item.disaster] || 0) + 1;

  });

  const pieData = Object.entries(disasterCounts).map(
    ([type, count]) => ({
      name: type,
      value: count
    })
  );

  // =====================================================
  // LOADING
  // =====================================================

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

  // =====================================================
  // MAIN UI
  // =====================================================

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

      {/* =====================================================
          MANUAL TWEET ANALYSIS
      ===================================================== */}

      <div className="dashboard-card">

        <h2>
          🧠 Manual Tweet Analysis
        </h2>

        <textarea

          placeholder="Enter disaster related tweet..."

          value={manualTweet}

          onChange={(e) =>
            setManualTweet(e.target.value)
          }

          className="manual-input"

        />

        <button

          onClick={analyzeManualTweet}

          className="analyze-btn"

        >
          Analyze Tweet
        </button>

        {manualResult && (

          <div className="manual-result">

            <h3>
              Prediction Result
            </h3>

            <p>
              <b>🌪️ Disaster:</b>
              {" "}
              {manualResult.disaster}
            </p>

            <p>
              <b>📍 Locations:</b>
              {" "}
              {manualResult.locations.join(", ")}
            </p>

            <p>
              <b>📝 Tweet:</b>
              {" "}
              {manualResult.tweet}
            </p>

          </div>

        )}

      </div>

      {/* =====================================================
          TOP LOCATIONS
      ===================================================== */}

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

      {/* =====================================================
          BAR CHART
      ===================================================== */}

      <div className="dashboard-card">

        <h2>
          📈 Top Locations Chart
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

            <Tooltip />

            <Bar
              dataKey="count"
              radius={[12, 12, 0, 0]}
            >

              {barData.map((entry, index) => (

                <Cell
                  key={`cell-${index}`}
                  fill={[
                    "#8b5cf6",
                    "#ec4899",
                    "#3b82f6",
                    "#14b8a6",
                    "#f59e0b"
                  ][index % 5]}
                />

              ))}

            </Bar>

          </BarChart>

        </div>

      </div>

      {/* =====================================================
          PIE CHART
      ===================================================== */}

      <div className="dashboard-card">

        <h2>
          🥧 Disaster Distribution
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
                    "#8b5cf6",
                    "#ec4899",
                    "#3b82f6",
                    "#14b8a6",
                    "#f59e0b",
                    "#ef4444"
                  ][index % 6]}
                />

              ))}

            </Pie>

            <Legend />

            <Tooltip />

          </PieChart>

        </div>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

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

      {/* =====================================================
          SAMPLE TWEETS
      ===================================================== */}

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