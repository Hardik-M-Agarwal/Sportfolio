const mongoose = require("mongoose");

const playerStatSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    playerName: {
      type: String,
      required: true,
      trim: true,
    },
    sport: {
      type: String,
      required: true,
      enum: ["cricket", "football", "badminton", "kabaddi", "basketball", "volleyball"],
    },
    stats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

playerStatSchema.index({ matchId: 1, teamId: 1, playerName: 1 }, { unique: true });

const PlayerStat = mongoose.model("PlayerStat", playerStatSchema);
module.exports = PlayerStat;