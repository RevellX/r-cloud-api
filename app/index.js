const express = require("express");
const app = express();
const port = 5000;
const db = require("./config/database");
const cors = require("cors");

const {
  clearUploadsDirectory,
  sha256,
} = require("./utils/functions");

const FileModel = require("./models/File");
const UserModel = require("./models/User");
const DutyModel = require("./models/Duty");
const DutyExcludedDayModel = require("./models/DutyExcludedDay");

const initApp = async () => {
  return new Promise(async (resolve, reject) => {
    console.log("Starting the API");

    try {
      console.log("Clearing the uploads directory");
      await clearUploadsDirectory();

      console.log("Connecting to the database");
      await db.authenticate();
      console.log("Connection successfull!");

      // console.log("Syncing database models"); // { force: true} <- be carefull with that
      // await FileModel.sync({ force: true });
      // await UserModel.sync({ alter: true });
      // await DutyModel.sync({ force: true });
      // await DutyExcludedDayModel.sync({ force: true });

      UserModel.hasMany(DutyModel);
      DutyModel.belongsTo(UserModel);

      app.all("/", (req, res) =>
        res.json({ message: "Backend is working..." })
      );

      app.use(
        cors({
          origin: "*",
        })
      );

      app.use(express.json());
      // app.use("/files", express.static(__dirname + "/../public"));

      app.use("/api", require("./routes/Auth"));
      app.use("/api", require("./routes/File"));
      app.use("/api", require("./routes/Duty"));

      app.listen(port, () => {
        console.log("App started on port " + port);
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
};

const doTestingStuff = async () => {};

initApp()
  .then(() => {
    // doTestingStuff();
  })
  .catch((err) => console.log(err));
