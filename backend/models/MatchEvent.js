const mongoose = require("mongoose");

const matchEventSchema = new mongoose.Schema(
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
    },
    eventType: {
      type: String,
      required: true,
      // cricket: ball, wicket, over_complete, innings_complete
      // football: goal, assist, yellow_card, red_card, half_time, full_time
      // badminton: point, set_complete, match_complete
      // kabaddi: raid_point, tackle_point, all_out, half_time
      // basketball: two_point, three_point, free_throw, foul, quarter_complete
      // volleyball: point, set_complete
    },
    playerName: { type: String },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // live score snapshot at time of event
    scoreSnapshot: {
      team1Score: mongoose.Schema.Types.Mixed,
      team2Score: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const MatchEvent = mongoose.model("MatchEvent", matchEventSchema);
module.exports = MatchEvent;