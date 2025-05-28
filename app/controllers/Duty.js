const Duty = require("../models/Duty");
const User = require("../models/User");
const { Op, where } = require("sequelize");
const DutyExcludedDay = require("../models/DutyExcludedDay");
const DutyUser = require("../models/DutyUser");
const { consoleLog } = require("../utils/functions");

const isDateCorrect = (date) => {
  // Sketchy solution, but I couldn't get the RegExp to work properly
  // I guess we just have to live with that
  if (date && typeof date === "string" && date.length === 10)
    return true;
  return false;
};

const isNameCorrect = (name) => {
  if (!name) {
    throw new Error("Name is required");
  } else if (typeof name !== "string") {
    throw new Error("Name must be a string");
  } else if (name.length === 0 || name.length > 32) {
    throw new Error(
      "Name cannot be empty and must be 32 characters or less"
    );
  }

  return true;
};

const isShortcutCorrect = (shortcut) => {
  if (!shortcut) {
    throw new Error("Shortcut is required");
  } else if (typeof shortcut !== "string") {
    throw new Error("Shortcut must be a string");
  } else if (shortcut.length === 0 || shortcut.length > 6) {
    throw new Error(
      "Shortcut cannot be empty and must by 6 characters or lesss"
    );
  }

  return true;
};

const isDutyEnabledCorrect = (isEnabled) => {
  if (!isEnabled && isEnabled !== false) {
    throw new Error("isDutyEnabled is required");
  } else if (typeof isEnabled !== "boolean") {
    throw new Error("isDutyEnabled must be a boolean");
  }

  return true;
};

const isUUIDCorrect = (uuid) => {
  if (!uuid) {
    throw new Error("UUID is required");
  } else if (typeof uuid !== "string") {
    throw new Error("UUID myst be a string");
  } else if (uuid.length !== 36) {
    throw new Error("UUID must be 36 characters long");
  }
  return true;
};

const createDateObjFromDate = (date) => {
  let fillYears = "00" + date.split("-")[0];
  let fillMonths = "00" + date.split("-")[1];
  let fillDays = "00" + date.split("-")[2];

  fillYears = fillYears.slice(-4);
  fillMonths = fillMonths.slice(-2);
  fillDays = fillDays.slice(-2);

  date = `${fillYears}-${fillMonths}-${fillDays}`;

  const returnValue = new Date(`${date}`);
  return returnValue;
};

const getUsers = (req, res) => {
  DutyUser.findAll({
    attributes: ["id", "name", "shortcut", "isDutyEnabled"],
  })
    .then((users) => {
      return res.json(users);
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ message: "Unable to fetch users" });
    });
};

const getUser = (req, res) => {
  const userId = req.params["dutyUserId"];

  DutyUser.findByPk(userId, {
    attributes: ["id", "name", "shortcut", "isDutyEnabled"],
  })
    .then((data) => {
      if (data) return res.json(data);
      else
        return res
          .status(404)
          .json({ message: "Unable to find user" });
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ message: "Unable to fetch user" });
    });
};

const createUser = (req, res) => {
  const { name, shortcut } = req.body;
  let { isDutyEnabled } = req.body;

  if (isDutyEnabled === undefined) isDutyEnabled = true;

  try {
    isNameCorrect(name);
    isShortcutCorrect(shortcut);
    isDutyEnabledCorrect(isDutyEnabled);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  DutyUser.create({
    name,
    shortcut,
    isDutyEnabled,
  })
    .then((data) => {
      return res.json({
        message: "Created new user",
        dutyUserId: data.id,
      });
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ message: "Failed to create new user" });
    });
};

const editUser = (req, res) => {
  const { name, shortcut, isDutyEnabled } = req.body;
  const userId = req.params["dutyUserId"];

  try {
    isUUIDCorrect(userId);
    if (name) isNameCorrect(name);
    if (shortcut) isShortcutCorrect(shortcut);
    if (isDutyEnabled !== undefined)
      isDutyEnabledCorrect(isDutyEnabled);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  DutyUser.findByPk(userId)
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .json({ message: "Unable to find user" });
      } else {
        if (name) user.name = name;
        if (shortcut) user.shortcut = shortcut;
        if (isDutyEnabled !== undefined)
          user.isDutyEnabled = isDutyEnabled;

        return user.save();
      }
    })
    .then((user) => {
      if (user) return res.json({ message: "User edited" });
    })
    .catch((err) => {
      consoleLog(err);
      return res.status(500).json({ message: "Failed to edit user" });
    });
};

const deleteUser = (req, res) => {
  const userId = req.params["dutyUserId"];

  try {
    isUUIDCorrect(userId);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  DutyUser.findByPk(userId)
    .then((user) => {
      if (!user) {
        res.status(404).json({ message: "Unable to find user" });
      } else {
        return user.destroy();
      }
    })
    .then((user) => {
      if (user) return res.json({ message: "User deleted" });
    })
    .catch((err) => {
      return res
        .status(500)
        .json({ message: "Failed to delete user" });
    });
};

const getDuties = (req, res) => {
  const date = new Date();
  date.setDate(date.getDate() - date.getDay() + 1);
  const todaysDate = createDateObjFromDate(
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  );

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);

  Promise.all([
    DutyExcludedDay.findAll({
      attributes: ["id", "date"],
      limit: 10,
      where: {
        [Op.and]: [
          { date: { [Op.gte]: todaysDate } },
          { date: { [Op.lte]: futureDate } },
        ],
      },
      order: [["date", "ASC"]],
    }),
    Duty.findAll({
      attributes: ["id", "date"],
      include: {
        model: DutyUser,
        attributes: ["id", "name", "shortcut"],
      },
      limit: 10,
      where: { date: { [Op.gte]: todaysDate } },
      order: [["date", "ASC"]],
    }),
  ])
    .then((values) => {
      const duties = [...values[0], ...values[1]].sort((a, b) => {
        const aDateObj = createDateObjFromDate(a.date);
        const bDateObj = createDateObjFromDate(b.date);
        if (aDateObj > bDateObj) return 1;
        else if (bDateObj > aDateObj) return -1;
        return 0;
      });
      return res.json(duties);
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(500)
        .json({ message: "Unable to fetch duties" });
    });
};

const getDuty = (req, res) => {
  const dutyDate = req.params["dutyDate"];

  if (!isDateCorrect(dutyDate))
    return res
      .status(400)
      .json({ message: "Something is wrong with your date" });

  DutyExcludedDay.findOne({
    attributes: ["id", "date"],
    where: { date: dutyDate },
  }).then((exDay) => {
    if (exDay) {
      return res.json(exDay);
    } else {
      Duty.findOne({
        attributes: ["id", "date"],
        include: {
          model: DutyUser,
          attributes: ["id", "name", "shortcut"],
        },
        where: { date: dutyDate },
      })
        .then((duty) => {
          if (duty) {
            return res.json(duty);
          } else {
            return res
              .status(404)
              .json({ message: "Unable to find duty" });
          }
        })
        .catch((err) => {
          console.log(err);
          return res
            .status(500)
            .json({ message: "Unable to fetch duty" });
        });
    }
  });
};

const swapDuties = (req, res) => {
  const { userId } = req.body;
  const dutyDate = req.params["dutyDate"];

  if (!isDateCorrect(dutyDate))
    return res
      .status(400)
      .json({ message: "Something is wrong with your date" });

  consoleLog(dutyDate);

  // Find duty by date and destroy if it exists
  Duty.findOne({ where: { date: dutyDate } })
    .then((duty) => {
      if (duty) {
        return duty.destroy();
      }
    })
    .then((d) => {
      if (!userId) return res.json({ message: "OK" });
    });

  // If userId is given. Create new duty
  if (userId) {
    if (!isUUIDCorrect(userId)) {
      return res
        .status(400)
        .json({ message: "Something is wrong with your userId" });
    }

    // Create new duty with given date and userId
    DutyUser.findByPk(userId).then((dutyUser) => {
      if (!dutyUser) {
        return res
          .status(404)
          .json({ message: "Couldn't find user with given id" });
      } else {
        Duty.create({
          date: dutyDate,
          dutyUserId: userId,
        })
          .then(() => {
            return res.json({ message: "OK" });
          })
          .catch((err) => {
            return res.status(500).json({
              message: "Something went wrong while creating new duty",
            });
          });
      }
    });
  }

  // Duty there HAS to be in format: "YYYY-MM-DD", if it's not => 400 BAD REQUEST
  //  Find duty by date and delete it, no matter what.

  // Check DATE

  // userId is optional, if it's there is HAS to be UUID;
  //  check if userId actually exists, if it exists simply create new duty with given UUID and DATE.
  // That's it.
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  editUser,
  deleteUser,
  getDuties,
  getDuty,
  swapDuties,
};
