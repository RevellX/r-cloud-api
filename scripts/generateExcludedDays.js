/* This script generates DB entries about holidays which are later used by others scripts to generate duties entries */

const DutyExcludedDay = require("../app/models/DutyExcludedDay");

const EXCLUDED_DAYS = [
  "2024-01-01",
  "2024-01-06",
  "2024-03-31",
  "2024-04-01",
  "2024-05-01",
  "2024-05-03",
  "2024-05-19",
  "2024-05-30",
  "2024-08-15",
  "2024-11-01",
  "2024-11-11",
  "2024-12-25",
  "2024-12-26",
];

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
