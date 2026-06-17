const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
}, { _id: false });

const teamSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    captainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teamName: {
      type: String,
      required: [true, "Team name is required"],
      trim: true,
    },
    players: {
      type: [playerSchema],
      validate: {
        validator: function (players) {
          return players.length >= 1;
        },
        message: "At least 1 player is required",
      },
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cash"],
      default: "pending",
    },
    paymentAmount: {
      type: Number,
      default: 0,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isWaitlisted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// one captain can only register one team per tournament
teamSchema.index({ tournamentId: 1, captainId: 1 }, { unique: true });

const Team = mongoose.model("Team", teamSchema);
module.exports = Team;