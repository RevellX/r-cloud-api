const Duty = require("../models/Duty");
const User = require("../models/User");
const { Op } = require("sequelize");
const { isUUIDCorrect } = require("../utils/functions");

const getDuties = (req, res) => {
  const date = new Date();
  const todaysDate = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}`;

  Duty.findAll({
    attributes: ["id", "date"],
    include: {
      model: User,
      attributes: ["id", "username", "shortcut"],
    },
    limit: 20,
    where: { date: { [Op.gte]: todaysDate + " 00:00:00" } },
    order: [["date", "ASC"]],
  })
    .then((duties) => {
      return res.json(duties);
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(500)
        .json({ message: "Unable to fetch duties" });
    });
};

const swapDuties = (req, res) => {
  const { user_id } = req.tokenPayload; // Maybe for permissions check?
  const { dutyOne, dutyTwo } = req.body;

  if (!isUUIDCorrect(dutyOne) || !isUUIDCorrect(dutyTwo))
    return res
      .status(400)
      .json({ message: "Something is wrong with your body data" });

  Duty.findAll({
    attributes: ["id", "date", "userId"],
    where: {
      id: [dutyOne, dutyTwo],
    },
  })
    .then((duties) => {
      const [dutyOneB, dutyTwoB] = duties;
      const tempId = dutyOneB.userId;
      dutyOneB.userId = dutyTwoB.userId;
      dutyTwoB.userId = tempId;

      const savePromises = duties.map((duty) => duty.save());

      Promise.all(savePromises)
        .then(() => res.json({ message: "Duties swapped" }))
        .catch(() =>
          res.status(500).json({ message: "Unable to swap duties" })
        );
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(500)
        .json({ message: "Unable to swap duties" });
    });
};

const deleteDuty = (req, res, next) => {
  const { dutyId } = req.body;

  if (!isUUIDCorrect(dutyId))
    return res
      .status(400)
      .json({ message: "Something is wrong with your body data" });

  let deletedDutyDate;
  Duty.findByPk(dutyId, {
    attributes: ["id", "date", "userId"],
  })
    .then((duty) => {
      deletedDutyDate = duty.date;
      duty.destroy();
      return Duty.findAll({
        attributes: ["id", "date", "userId"],
        where: {
          date: { [Op.gt]: duty.date },
        },
        order: [["date", "ASC"]],
      });
    })
    .then((futureDuties) => {
      let tempDate;
      return Promise.all(
        futureDuties.map((duty) => {
          tempDate = duty.date;
          duty.date = deletedDutyDate;
          deletedDutyDate = tempDate;
          return duty.save();
        })
      );
    })
    .then(() => {
      res.json({ message: "OK" });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Unable to delete duty" });
    });
};

const insertDuty = (req, res, next) => {
  res.json({ message: "Inserting duty" });
};

module.exports = { getDuties, swapDuties, deleteDuty, insertDuty };
