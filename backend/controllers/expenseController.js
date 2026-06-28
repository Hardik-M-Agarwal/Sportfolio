const Expense = require('../models/Expense');
const Tournament = require('../models/Tournament');

// @POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const { tournamentId, category, description, amount, date } = req.body;

    // verify organiser owns this tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const expense = await Expense.create({
      tournamentId,
      organiserId: req.user.id,
      category,
      description,
      amount: Number(amount),
      date: date || new Date(),
    });

    res.status(201).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/expenses/tournament/:tournamentId
const getExpensesByTournament = async (req, res) => {
  try {
    const expenses = await Expense.find({
      tournamentId: req.params.tournamentId,
      organiserId:  req.user.id,
    }).sort({ date: -1 });

    // totals per category
    const categoryTotals = {};
    let totalExpenses = 0;

    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      totalExpenses += e.amount;
    });

    res.status(200).json({ success: true, expenses, totalExpenses, categoryTotals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/expenses/my  — all expenses across all tournaments
const getMyExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ organiserId: req.user.id })
      .populate('tournamentId', 'name sport status')
      .sort({ date: -1 });

    let totalExpenses = 0;
    const byTournament = {};
    const categoryTotals = {};

    expenses.forEach((e) => {
      totalExpenses += e.amount;

      const tid = e.tournamentId?._id?.toString();
      if (tid) {
        if (!byTournament[tid]) {
          byTournament[tid] = {
            tournament: e.tournamentId,
            total: 0,
            expenses: [],
          };
        }
        byTournament[tid].total += e.amount;
        byTournament[tid].expenses.push(e);
      }

      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    res.status(200).json({
      success: true,
      expenses,
      totalExpenses,
      byTournament: Object.values(byTournament),
      categoryTotals,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/expenses/:id
const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (expense.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { category, description, amount, date } = req.body;
    expense.category    = category    || expense.category;
    expense.description = description || expense.description;
    expense.amount      = amount !== undefined ? Number(amount) : expense.amount;
    expense.date        = date        || expense.date;

    await expense.save();
    res.status(200).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    if (expense.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await expense.deleteOne();
    res.status(200).json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createExpense,
  getExpensesByTournament,
  getMyExpenses,
  updateExpense,
  deleteExpense,
};