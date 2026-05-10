const express = require("express");
const router = express.Router();
const axios = require("axios");

// ✅ FLASK SERVER
const ML_BASE = "http://127.0.0.1:5001";

// =====================================================
// LIVE DASHBOARD ROUTE
// =====================================================

router.get("/", async (req, res) => {

  try {

    // ====================================
    // 🔥 FETCH LIVE DASHBOARD DATA
    // ====================================

    const response = await axios.get(
      `${ML_BASE}/disaster-data`
    );

    const data = response.data;

    // ====================================
    // ✅ FINAL RESPONSE
    // ====================================

    res.json({
      disaster: data.disaster || [],
      priority: data.priority || {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      needs: data.needs || []
    });

  } catch (err) {

    console.error(
      "Dashboard error:",
      err.message
    );

    res.status(500).json({
      error: "Dashboard error"
    });
  }
});

module.exports = router;