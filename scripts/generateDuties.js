/* This script generates DB entries with duties based on excluded days, enabled users and already existing duties */
/* It's recommended to run this script daily */
const Duty = require("../app/models/Duty");
const { Op } = require("sequelize");
const DutyExcludedDay = require("../app/models/DutyExcludedDay");
const User = require("../app/models/User");

// Number of duties to create wne calling this script
const CREATE_DUTIES_COUNT = 5;

// Minimal number of ongoing duties to even allow this script to run
const MINIMAL_DUTIES_COUNT = 10;

const run = async () => {
  // IMPORTANT CAVEAT WHICH WILL LEAD TO SOME BUGS IN THE FUTURE
  User.hasMany(Duty); // Those two lines HAVE to be moved outside this file
  Duty.belongsTo(User); // Hyper - Ultra - Mega - Important
  // If you are reading this, I probably forgot about it

  // Today's date in format: "YYYY-MM-DD"
  const date = new Date(new Date().toDateString());
  const todaysDate = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}`;

  // Array of duties which happed today or in the future
  const activeDuties = await Duty.findAll({
    where: { date: { [Op.gte]: todaysDate + " 00:00:00" } },
    include: User,
  });

  // Decision to continue with the script or not
  if (activeDuties.length >= MINIMAL_DUTIES_COUNT) {
    console.log("There are enough ongoing duties");
    return;
  }

  try {
    // Array of excluded days - holidays
    const excludedDays = await DutyExcludedDay.findAll();

    // Helper functions
    const createDateFromDate = (date) =>
      `${date.getFullYear()}-${
        date.getMonth() + 1
      }-${date.getDate()}`;

    const isExcluded = (date) => {
      const foundDay = excludedDays.find((excludedDay) => {
        const a = excludedDay.date;
        const b = createDateFromDate(date);
        return a === b;
      });
      if (foundDay) return true;
      return false;
    };

    // Array of users that can be assigned to new duties
    const enabledUsers = await User.findAll({
      attributes: {
        excluded: ["password"],
      },
      where: {
        isDutyEnabled: true,
      },
      order: [["order", "ASC"]],
    });

    // At this i can't explain what is happenig, but it seems to be working as intended
    let startWithUsername;
    let startWithDate;
    // If there are any active duties...
    if (activeDuties.length > 0) {
      // Get the most future duty doer
      startWithUsername =
        activeDuties[activeDuties.length - 1].user.username;
      // Get the most future date and ...
      startWithDate = activeDuties[activeDuties.length - 1].date;
      // Make object from string
      startWithDate = new Date(startWithDate);
      // Add one day to the most future date
      startWithDate.setDate(startWithDate.getDate() + 1);
    } else {
      // If there are no active duties, start today with the first enabled user
      startWithDate = createDateFromDate(new Date());
      startWithUsername =
        enabledUsers[enabledUsers.length - 1].username;
    }

    // I'm probably misusing the 'new Date()', but it works so it stays for now
    const dutiesDates = [];
    const date = new Date(startWithDate);
    // Get the user order of the staring username
    let offset = enabledUsers.findIndex(
      (user) => user.username === startWithUsername
    );
    // And move it one forward
    offset++;
    // If it's out of bounds, reset
    if (offset >= enabledUsers.length) offset = 0;
    do {
      if (![6, 0].includes(date.getDay()) && !isExcluded(date)) {
        dutiesDates.push({
          date: new Date(date),
          userId:
            enabledUsers[
              (dutiesDates.length + offset) % enabledUsers.length
            ].id,
        });
      }
      date.setDate(date.getDate() + 1);
    } while (dutiesDates.length < CREATE_DUTIES_COUNT);
    await Duty.bulkCreate(dutiesDates)
      .then(() => console.log(dutiesDates.length + " Duties Created"))
      .catch((err) => console.log(err));
  } catch (err) {
    console.log(err);
  }
};

run();
