const mongoose = require("mongoose");

const prizeDistributionSchema = new mongoose.Schema({
  winner:   { type: Number, default: 50 },
  runnerUp: { type: Number, default: 30 },
  third:    { type: Number, default: 10 },
  special:  { type: Number, default: 10 },
}, { _id: false });

const prizeStructureSchema = new mongoose.Schema({
  percentage:   { type: Number, required: true, min: 0, max: 100 },
  distribution: { type: prizeDistributionSchema, default: () => ({}) },
}, { _id: false });

const venueSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  city:     { type: String, required: true, trim: true },
  capacity: { type: Number, default: 0 },  // ← added
}, { _id: false });

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tournament name is required"],
      trim: true,
    },
    sport: {
      type: String,
      required: [true, "Sport is required"],
      enum: ["cricket", "football", "badminton", "kabaddi", "basketball", "volleyball"],
    },
    format: {
      type: String,
      required: [true, "Format is required"],
      enum: ["knockout", "league", "league+knockout"],
    },
    organiserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tournamentCode: {
      type: String,
      unique: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "registration", "ongoing", "completed"],
      default: "upcoming",
    },
    venue:                 { type: venueSchema, required: true },
    startDate:             { type: Date, required: true },
    endDate:               { type: Date, required: true },
    registrationStartDate: { type: Date, required: true },
    registrationEndDate:   { type: Date, required: true },
    maxTeams: {
      type: Number,
      required: true,
      min: 2,
    },
    entryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    prizeStructure:   { type: prizeStructureSchema, required: true },
    sponsorshipTiers: {
      type: [String],
      enum: ["platinum", "gold", "silver", "bronze"],
      default: ["gold", "silver", "bronze"],
    },
    sportConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

tournamentSchema.pre("save", async function () {
  if (!this.tournamentCode) {
    let code;
    let exists = true;
    while (exists) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await mongoose.model("Tournament").findOne({ tournamentCode: code });
    }
    this.tournamentCode = code;
  }
});

const Tournament = mongoose.model("Tournament", tournamentSchema);
module.exports = Tournament;