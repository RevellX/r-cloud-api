const express = require("express");
const { authorize } = require("../utils/functions");
const { userHasPermission } = require("../controllers/Auth");
const {
  getExpense,
  getExpenses,
  addExpense,
  deleteExpense,
  editExpense,
  getGroups,
  addGroup,
  editGroup,
} = require("../controllers/Finance");
const router = express.Router();

/*
    Get all the expenses from given group and in given date span.
    Logged user has to be member of the group

*/
router.get(
  "/expense/:expenseId",
  authorize,
  userHasPermission("finance.list"),
  getExpense
);

/*
    Get all the expenses from given group and in given date span.
    Logged user has to be member of the group.

    (required):
        - groupId: From which group do you want to see the expenses
    (optional): ex.: GET: /expenses/1209-ad...19?dateMin="2024-01-01"&dateMax="2024-01-31"
        - dateMin: Olders date. Default value: first day of the current month.
        - dateMax: Newest date. Default value: today's date
*/
router.get(
  "/expenses/:groupId",
  authorize,
  userHasPermission("finance.list"),
  getExpenses
);

/*
    Add new expense to the given group. 
    User has to be member of the group.

    request body:
    {
        title: Name of the expense. (eg. Fuel, Groceries, Clothes)
        amount: Float number. Amount of money spent or gained. Negative means expense. Positive means income. (eg. 10.00, 2.54, -25.00)
        date: Date of the expense/income.
    }
*/
router.post(
  "/expense/:groupId",
  authorize,
  userHasPermission("finance.add"),
  addExpense
);

/* 
    Edit existing expense.
    User has to be owner of the expense

    request body: at least one has to present
    {
        title: Name of the expense. (eg. Fuel, Groceries, Clothes)
        amount: Float number. Amount of money spent or gained. Negative means expense. Positive means income. (eg. 10.00, 2.54, -25.00)
        date: Date of the expense/income.
        groupId: UUID of the FinanceGroup
    }
*/
router.patch(
  "/expense/:expenseId",
  authorize,
  userHasPermission("finance.edit"),
  editExpense
);

/*
    Delete existing expense.
    User has to be owner of the expense.
*/
router.delete(
  "/expense/:expenseId",
  authorize,
  userHasPermission("finance.delete"),
  deleteExpense
);

/**
    Get finance groups that logged user is member of
 */
router.get(
  "/expense-groups",
  authorize,
  userHasPermission("finance.list"),
  getGroups
);

/**
 * 
 * Add new expense group. Logged user will be the only member.
 * 
 *  request body:
 *  {
        title: Name of the expense group. (eg. Main, Entertainment, Groceries)
    }
 */
router.post(
  "/expense-group",
  authorize,
  userHasPermission("finance.manageGroups"),
  addGroup
);

/**
 *
 * Edit expense group.
 *
 * request body:
 * {
 *    title: New name of the expense group.
 * }
 *
 */
router.patch(
  "/expense-group/:groupId",
  authorize,
  userHasPermission("finance.manageGroups"),
  editGroup
);

/**
 *
 * Remove the expense group. Logged user must be the owner.
 *
 */
router.delete(
  "/expense-group/:groupId",
  authorize,
  userHasPermission("finance.manageGroups")
);

module.exports = router;
