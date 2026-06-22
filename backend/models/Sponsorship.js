const mongoose = require("mongoose");

const sponsorshipSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    tier: {
      type: String,
      enum: ["platinum", "gold", "silver", "bronze"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    prizeContribution: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    logoUrl: { type: String },
    impactReport: {
      teamsReached: { type: Number, default: 0 },
      playersReached: { type: Number, default: 0 },
      matchesPlayed: { type: Number, default: 0 },
      estimatedAudience: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// one sponsor can only sponsor a tournament once per tier
sponsorshipSchema.index({ tournamentId: 1, sponsorId: 1, tier: 1 }, { unique: true });

const Sponsorship = mongoose.model("Sponsorship", sponsorshipSchema);
module.exports = Sponsorship;