const { Op } = require("sequelize");
const Expense = require("../models/Expense");
const ExpenseGroup = require("../models/ExpenseGroup");
const { isUUIDCorrect } = require("../utils/functions");
const User = require("../models/User");

const isTitleCorrect = (title) => {
  if (
    title &&
    typeof title === "string" &&
    title.length > 0 &&
    title.length < 255
  )
    return true;
  return false;
};

const isAmountCorrect = (amount) => {
  if (
    amount &&
    typeof amount === "number" &&
    amount > -100000 &&
    amount < 100000
  )
    return true;
  return false;
};

const isDateCorrect = (date) => {
  // Sketchy solution, but I couldn't get the RegExp to work properly
  // I guess we just have to live with that
  if (date && typeof date === "string" && date.length === 10)
    return true;
  return false;
};

const isMembersCorrect = (members) => {
  let isCorrect = true;
  const membersArray = members.split(";");
  for (let i = 0; i < membersArray.length; i++) {
    if (!isUUIDCorrect(membersArray[i])) {
      isCorrect = false;
      break;
    }
  }
  return isCorrect;
};

const getExpense = (req, res) => {
  const { user_id: userId } = req.tokenPayload;
  const expenseId = req.params["expenseId"];

  Expense.findByPk(expenseId)
    .then((expense) => {
      if (!expense)
        return res
          .status(404)
          .json({ message: "Unable to find expense" });
      if (expense.userId !== userId)
        return res
          .status(403)
          .json({ message: "No permission to this expense" });
      return res.json(expense);
    })
    .catch((err) => {
      return res
        .status(400)
        .json({ message: "Something went wrong" });
    });
};

const getExpenses = (req, res) => {
  const { user_id: userId } = req.tokenPayload;
  let { dateMin, dateMax } = req.query;
  const groupId = req.params["groupId"];

  if (!isUUIDCorrect(groupId)) {
    return res
      .status(500)
      .json({ message: "Something is wrong with your data" });
  }

  if (!isDateCorrect(dateMin)) dateMin = "2024-01-01";
  if (!isDateCorrect(dateMax)) dateMax = "2024-02-20";

  // Check if userId is member of groupId
  ExpenseGroup.findByPk(groupId)
    .then((group) => {
      if (group && group.members.includes(userId)) return true;
      res
        .status(403)
        .json({ message: "No permission to this group" });
      return false;
    })
    .then((ok) => {
      if (!ok) return false;
      // Get
      Expense.findAll({
        attributes: ["id", "title", "amount", "date"],
        where: {
          [Op.and]: [
            { date: { [Op.gte]: new Date(dateMin) } },
            { date: { [Op.lte]: new Date(dateMax) } },
          ],
          groupId: groupId,
        },
        order: [["date", "ASC"]],
        include: {
          model: User,
          attributes: ["id", "username"],
        },
      })
        .then((expenses) => {
          console.log(expenses);
          setTimeout(() => res.json(expenses), [600]);
          // return res.json(expenses);
        })
        .catch((err) => {
          return res
            .status(400)
            .json({ message: "Error while getting the expenses" });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).json({ message: "Something went wrong" });
    });
};

const addExpense = (req, res) => {
  const { user_id: userId } = req.tokenPayload;
  const groupId = req.params["groupId"];
  const { title, amount, date } = req.body;

  // Check title, amount, date, groupId
  if (
    !isTitleCorrect(title) ||
    !isAmountCorrect(amount) ||
    !isDateCorrect(date) ||
    !isUUIDCorrect(groupId)
  ) {
    return res
      .status(500)
      .json({ message: "Something is wrong with your data" });
  }

  // Check if userId is member of groupId
  ExpenseGroup.findByPk(groupId)
    .then((group) => {
      if (group && group.members.includes(userId)) return true;
      res
        .status(403)
        .json({ message: "No permission to this group" });
      return false;
    })
    .then((ok) => {
      if (!ok) return false;
      // Create
      Expense.create({
        title: title,
        amount: amount,
        date: new Date(date),
        userId: userId,
        groupId: groupId,
      })
        .then((expense) => res.json(expense))
        .catch((err) =>
          res
            .status(400)
            .json({ message: "Error while creating new expense" })
        );
    })
    .catch((err) => {
      res.status(400).json({ message: "Something went wrong" });
    });
};

const editExpense = async (req, res) => {
  const { user_id: userId } = req.tokenPayload;
  const expenseId = req.params["expenseId"];
  const { title, amount, date, groupId } = req.body;

  // Check title, amount, date, groupId
  if (
    !isTitleCorrect(title ?? "123") ||
    !isAmountCorrect(amount ?? 123) ||
    !isDateCorrect(date ?? "2024-01-01") ||
    !isUUIDCorrect(groupId ?? "43078e72-8e64-455d-8160-4a86899597c7")
  )
    return res
      .status(500)
      .json({ message: "Something is wrong with your data" });
  // If groupId: check if user can access this group
  if (groupId) {
    const group = await ExpenseGroup.findByPk(groupId);
    if (!group || !group.members.includes(userId))
      return res
        .status(403)
        .json({ message: "No permission to this group" });
  }
  // Check if userId is owner of expenseId
  Expense.findByPk(expenseId)
    .then((expense) => {
      if (expense && expense.userId === userId) return expense;
      res
        .status(403)
        .json({ message: "No permission to this expense" });
      return false;
    })
    .then((expense) => {
      if (!expense)
        return res
          .status(404)
          .json({ message: "Expense id not found" });
      // Update
      if (title) expense.title = title;
      if (amount) expense.amount = amount;
      if (date) expense.date = new Date(date);
      if (groupId) expense.groupId = groupId;

      return expense
        .save()
        .then((result) => res.json({ message: "Expense edited" }));
    })
    .catch((err) =>
      res.status(400).json({ message: "Something went wrong" })
    );
};

const deleteExpense = (req, res) => {
  const { user_id: userId } = req.tokenPayload;
  const expenseId = req.params["expenseId"];

  // Check if expenseId
  if (!isUUIDCorrect(expenseId))
    return res
      .status(500)
      .json({ message: "Something is wrong with your data" });

  // Check if userId is owner of expenseId
  Expense.findByPk(expenseId)
    .then((expense) => {
      if (expense.userId === userId) return expense;
      res
        .status(403)
        .json({ message: "No permission to this expense" });
      return false;
    })
    .then((expense) => {
      if (!expense) return false;
      // Delete
      return expense
        .destroy()
        .then((result) => res.json({ message: "Expense deleted" }));
    })
    .catch((err) =>
      res.status(400).json({ message: "Something went wrong" })
    );
};

const getGroups = (req, res) => {
  const { user_id: userId } = req.tokenPayload;
  ExpenseGroup.findAll({
    attributes: ["id", "title"],
    where: {
      members: { [Op.substring]: userId },
    },
    // include: {
    //   model: User,
    //   attributes: ["id", "username"],
    // },
  })
    .then((groups) => {
      return res.json(groups);
    })
    .catch((err) => {
      console.log("Bad request");
      return res
        .status(400)
        .json({ message: "Something went wrong" });
    });
};

const addGroup = (req, res) => {
  const { user_id: userId } = req.tokenPayload;
  const { title } = req.body;

  if (!isTitleCorrect(title))
    return res
      .status(500)
      .json({ message: "Something is wrong with your data" });

  ExpenseGroup.create({
    userId: userId,
    title: title,
    members: `${userId}`,
  })
    .then((group) => res.json(group))
    .catch((err) => {
      return res
        .status(400)
        .json({ message: "Something went wrong" });
    });
};

const editGroup = (req, res) => {
  const { user_id: userId } = req.tokenPayload;
  const groupId = req.params["groupId"];
  const { title, members } = req.body;

  if (
    !isTitleCorrect(title) ||
    !isUUIDCorrect(groupId) ||
    !isMembersCorrect(members)
  )
    return res
      .status(500)
      .json({ message: "Something is wrong with your data" });

  ExpenseGroup.findByPk(groupId)
    .then((group) => {
      if (group.userId === userId) return group;
      res
        .status(403)
        .json({ message: "No permission to this group" });
      return false;
    })
    .then((group) => {
      if (!group)
        return res
          .status(404)
          .json({ message: "Group id not found" });
      // Update
      if (title) group.title = title;
      if (members) group.members = members;

      return group
        .save()
        .then((result) => res.json({ message: "Group edited" }));
    })
    .catch((err) => {
      return res
        .status(400)
        .json({ message: "Something went wrong" });
    });
};

module.exports = {
  getExpense,
  getExpenses,
  addExpense,
  editExpense,
  deleteExpense,
  getGroups,
  addGroup,
  editGroup,
};
