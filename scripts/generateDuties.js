/* This script generates DB entries with duties based on excluded days, enabled users and already existing duties */
/* It's recommended to run this script daily */
const Duty = require("../app/models/Duty");
const { Op } = require("sequelize");
const DutyExcludedDay = require("../app/models/DutyExcludedDay");
const User = require("../app/models/User");

// Minimal number of ongoing duties to even allow this script to run
const MINIMAL_DUTIES_COUNT = 10;

// IMPORTANT CAVEAT WHICH WILL LEAD TO SOME BUGS IN THE FUTURE
User.hasMany(Duty); // Those two lines HAVE to be moved outside this file
Duty.belongsTo(User); // Hyper - Ultra - Mega - Important
// If you are reading this, I probably forgot about it

const createDateFromDateObj = (date) => {
  const returnValue = `${date.getFullYear()}-${
    date.getMonth() + 1
  }-${date.getDate()}`;
  return returnValue;
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
const createDateFromMysqlDate = (date) => {
  const dateObj = createDateObjFromDate(date);
  const returnValue = createDateFromDateObj(dateObj);
  return returnValue;
};

const run = async () =>
  new Promise(async (resolve, reject) => {
    // Today's date in format: "YYYY-MM-DD" - hours, minutes, seconds are "00"
    const TODAYS_DATE = createDateFromDateObj(new Date());
    console.log("Today's date: ", TODAYS_DATE);

    // Array of duties which happen today or in the future
    const ONGOING_DUTIES = await Duty.findAll({
      where: {
        date: { [Op.gte]: createDateObjFromDate(TODAYS_DATE) },
      },
      order: [["date", "ASC"]],
      include: User,
    });
    console.log(
      `Found ${ONGOING_DUTIES.length} of ${MINIMAL_DUTIES_COUNT} required duties`
    );

    // Is there enough ongoing duties already?
    if (ONGOING_DUTIES.length >= MINIMAL_DUTIES_COUNT) {
      reject("There are enough ongoing duties already");
      return;
    }

    // Array of excluded duties dates - holidays ...
    const EXCLUDED_DAYS = await DutyExcludedDay.findAll({
      where: {
        date: { [Op.gte]: createDateObjFromDate(TODAYS_DATE) },
      },
      order: [["date", "ASC"]],
    });
    console.log(
      `Found ${EXCLUDED_DAYS.length} excluded duties dates`
    );
    // ... and a helper function
    const isExcluded = (dateObj) => {
      const foundDay = EXCLUDED_DAYS.find((excludedDay) => {
        const a = createDateFromMysqlDate(excludedDay.date);
        const b = createDateFromDateObj(dateObj);
        return a === b;
      });
      if (foundDay || [6, 0].includes(dateObj.getDay())) return true;
      return false;
    };

    // Array of duty-enabled users
    const ENABLED_USERS = await User.findAll({
      attributes: {
        excluded: ["password"],
      },
      where: {
        isDutyEnabled: true,
      },
      order: [["order", "ASC"]],
    });
    console.log(`Found ${ENABLED_USERS.length} duty enabled users`);

    // Now here comes the more complicated part:

    // String date of the first duty to be created. Every next will be greater by one day.
    // If there are no duties, set it to TODAYS_DATE, otherwise get latest duty date and add one day.
    let DUTY_DATE;
    const advanceDutyDate = () => {
      const dateObj = createDateObjFromDate(DUTY_DATE);
      do {
        dateObj.setDate(dateObj.getDate() + 1);
      } while (isExcluded(dateObj));
      return (DUTY_DATE = createDateFromDateObj(dateObj));
    };
    if (ONGOING_DUTIES.length > 0) {
      DUTY_DATE = createDateFromMysqlDate(
        ONGOING_DUTIES[ONGOING_DUTIES.length - 1].date
      );
      advanceDutyDate();
    } else {
      DUTY_DATE = TODAYS_DATE;
      if (isExcluded(createDateObjFromDate(DUTY_DATE)))
        advanceDutyDate();
    }

    // Index of ENABLED_USERS to start with generating new duties. Every next will be greater by one, unless it hits max value, then 0.
    // If there are no duties, set it to 0, otherwise get latest duty user, find that index in ENABLED_USERS and add 1, which MAY hit max value, then 0;
    // ... and a helper functions
    let USER_INDEX;
    const advanceUserIndex = () => {
      USER_INDEX =
        USER_INDEX >= ENABLED_USERS.length - 1 ? 0 : USER_INDEX + 1;
      return USER_INDEX;
    };
    const getNextUserIndex = () => {
      USER_INDEX = ENABLED_USERS.findIndex((user) => {
        return (
          ONGOING_DUTIES[ONGOING_DUTIES.length - 1].userId === user.id
        );
      });
      return advanceUserIndex();
    };
    USER_INDEX = ONGOING_DUTIES.length > 0 ? getNextUserIndex() : 0;

    // Now comes the juicy parts, where everything comes together

    // Number of duties to create
    const CREATE_DUTIES_COUNT =
      MINIMAL_DUTIES_COUNT - ONGOING_DUTIES.length;
    console.log(`Attempting to create ${CREATE_DUTIES_COUNT} duties`);
    const DUTIES_OBJ = [];
    for (let i = 0; i < CREATE_DUTIES_COUNT; i++) {
      DUTIES_OBJ.push({
        date: createDateObjFromDate(DUTY_DATE),
        userId: ENABLED_USERS[USER_INDEX].id,
      });
      advanceDutyDate();
      advanceUserIndex();
    }
    Duty.bulkCreate(DUTIES_OBJ)
      .then((res) => resolve(`Created ${res.length} new duties`))
      .catch((err) => reject(err));
  });

console.log("Started script: generateDuties");
run()
  .then((result) => console.log(result))
  .catch((err) => console.log("Err: ", err));
