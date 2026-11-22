// backend/routes/publicRoutes.js
// Routes that need NO JWT. Keep this file small and read-only.
const express = require("express");
const router = express.Router();
const { getPublicStats } = require("../controllers/publicController");

router.get("/stats", getPublicStats); // GET /api/public/stats

module.exports = router;

// ---- Add this to backend/server.js (with your other app.use lines) ----
// app.use("/api/public", require("./routes/publicRoutes"));
// Also make sure CORS is enabled so React (localhost:3000) can call the API:
//   const cors = require("cors");  app.use(cors());
