const mongoose = require("mongoose");

const outreachContactSchema = new mongoose.Schema(
  {
    organiserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactName: {
      type: String,
      trim: true,
    },
    businessType: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    // pitch details
    pitches: [
      {
        tournamentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Tournament",
        },
        tier: {
          type: String,
          enum: ["platinum", "gold", "silver", "bronze"],
        },
        status: {
          type: String,
          enum: ["not_contacted", "contacted", "interested", "converted", "rejected"],
          default: "not_contacted",
        },
        sentAt: { type: Date },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const OutreachContact = mongoose.model("OutreachContact", outreachContactSchema);
module.exports = OutreachContact;