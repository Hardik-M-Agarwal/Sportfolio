const mongoose = require("mongoose");

const scorecardSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      unique: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    sport: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["not_started", "live", "completed"],
      default: "not_started",
    },
    // flexible score state per sport
    scoreState: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // who is scoring
    scorerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Scorecard = mongoose.model("Scorecard", scorecardSchema);
module.exports = Scorecard;