// backend/controllers/publicController.js
// Public (no login) numbers for the landing page. Returns counts only, no private data.
// NOTE: adjust the model file names/paths if yours differ.
const City = require("../models/City");
const Board = require("../models/Board");
const Impression = require("../models/Impression");

exports.getPublicStats = async (req, res) => {
  try {
    const [cities, boards, totals] = await Promise.all([
      City.countDocuments(),
      Board.countDocuments({ status: "active" }),
      Impression.aggregate([
        {
          $group: {
            _id: null,
            people: { $sum: "$people_count" },
            vehicles: { $sum: "$vehicle_count" },
          },
        },
      ]),
    ]);

    const t = totals[0] || { people: 0, vehicles: 0 };
    res.json({ cities, boards, people: t.people, vehicles: t.vehicles });
  } catch (err) {
    console.error("Public stats error:", err);
    res.status(500).json({ message: "Could not load stats" });
  }
};
