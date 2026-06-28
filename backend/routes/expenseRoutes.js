const express = require('express');
const {
  createExpense,
  getExpensesByTournament,
  getMyExpenses,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect, authorise } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorise('organiser'));

router.post('/',                              createExpense);
router.get('/my',                             getMyExpenses);
router.get('/tournament/:tournamentId',       getExpensesByTournament);
router.put('/:id',                            updateExpense);
router.delete('/:id',                         deleteExpense);

module.exports = router;