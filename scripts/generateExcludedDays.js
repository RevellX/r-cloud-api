/* This script generates DB entries about holidays which are later used by others scripts to generate duties entries */

const DutyExcludedDay = require("../app/models/DutyExcludedDay");

const EXCLUDED_DAYS = ["2023-12-25", "2023-12-26", "2023-12-27"];

const run = async () => {
  const createObjects = EXCLUDED_DAYS.map((excludedDay) => {
    return {
      date: excludedDay,
    };
  });
  try {
    DutyExcludedDay.sync({ force: true }).then(() =>
      DutyExcludedDay.bulkCreate(createObjects)
        .then((result) =>
          console.log(
            `Created ${result.length} excluded days entries`
          )
        )
        .catch((err) => {
          console.log(
            "There was an error while creating excluded days entries"
          );
          throw new Error(err);
        })
    );
  } catch (err) {
    console.log(err);
  }
};

run();
