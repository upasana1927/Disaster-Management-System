const axios = require("axios");

exports.getDisasterMapData = async (req, res) => {
  try {

    const response = await axios.get(
      "http://127.0.0.1:5001/analyze-disaster-map"
    );

    res.json(response.data);

  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ error: "Disaster ML error" });
  }
};