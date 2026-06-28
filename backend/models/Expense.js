const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    organiserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['venue', 'officials', 'equipment', 'marketing', 'hospitality', 'awards', 'transport', 'miscellaneous'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

expenseSchema.index({ tournamentId: 1, createdAt: -1 });

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = Expense;