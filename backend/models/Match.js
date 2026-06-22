const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    team1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    team2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    round: {
      type: Number,
      required: true,
    },
    roundName: {
      type: String, // "Quarter Final", "Semi Final", "Final", "League Round 1" etc
    },
    matchNumber: {
      type: Number,
      required: true,
    },
    group: {
      type: String, // "A", "B" etc for league+knockout
    },
    matchDate: { type: Date },
    matchTime: { type: String },
    venue: { type: String },
    ground: { type: String },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed"],
      default: "scheduled",
    },
    result: {
      winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
      team1Score: { type: mongoose.Schema.Types.Mixed }, // flexible per sport
      team2Score: { type: mongoose.Schema.Types.Mixed },
      notes: { type: String },
    },
    scorerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Match = mongoose.model("Match", matchSchema);
module.exports = Match;