const express = require("express");
const app = express();
const port = 5001;
const { initSocketsIo } = require("./sockets/Sockets");
const db = require("./config/database");
const cors = require("cors");
const https = require("https");
const http = require("http");
const path = require("path");
const fs = require("fs");
require("dotenv");

const { Op, QueryTypes } = require("sequelize");

const {
  clearUploadsDirectory,
  sha256,
  consoleLog,
} = require("./utils/functions");

const FileModel = require("./models/File");
const UserModel = require("./models/User");
const DutyModel = require("./models/Duty");
const DutyExcludedDayModel = require("./models/DutyExcludedDay");
const ExpenseModel = require("./models/Expense");
const ExpenseGroupModel = require("./models/ExpenseGroup");
const MessageModel = require("./models/Message");
const DutyUserModel = require("./models/DutyUser");
const { where } = require("sequelize");
const { group } = require("console");
const sequelize = require("./config/database");
const { type } = require("os");
const User = require("./models/User");

const initApp = async () => {
  const options = {
    env: "DEVELOPMENT",
  };

  process.argv.map((arg) => {
    const opts = arg.split("=");
    if (opts.length !== 2) return;
    options[opts[0].toLowerCase()] = opts[1].toUpperCase();
  });

  return new Promise(async (resolve, reject) => {
    consoleLog("Starting the API");
    try {
      consoleLog("Clearing uploads directory");
      await clearUploadsDirectory();

      consoleLog("Connecting to the database");
      await db.authenticate();
      consoleLog("Connection successfull!");

      // Syncing database models
      // console.log("Syncing database models"); // { force: true} <- be carefull with that
      // await FileModel.sync({ force: true });
      await UserModel.sync({ alter: true });
      await DutyModel.sync({ force: true });
      // await DutyExcludedDayModel.sync({ force: true });
      // await ExpenseModel.sync({ alter: true });
      // await ExpenseGroupModel.sync({ alter: true });
      await MessageModel.sync({ force: true });
      await DutyUserModel.sync({ alter: true });

      // Relations between models
      DutyUserModel.hasMany(DutyModel);
      DutyModel.belongsTo(DutyUserModel);

      ExpenseGroupModel.hasMany(ExpenseModel);
      ExpenseModel.belongsTo(ExpenseGroupModel);

      UserModel.hasMany(ExpenseModel);
      ExpenseModel.belongsTo(UserModel);

      // Test route
      app.all("/", (req, res) =>
        res.json({ message: "Backend is working..." })
      );

      // CORS
      app.use(
        cors({
          origin: [
            "https://messages.revellx-engine.pl",
            "https://api-legacy.revellx-engine.pl",
          ],
        })
      );

      // Routes
      app.use(express.json());
      // app.use("/files", express.static(__dirname + "/../public"));

      app.use("/api", require("./routes/Auth"));
      app.use("/api", require("./routes/File"));
      app.use("/api", require("./routes/Duty"));
      app.use("/api", require("./routes/Finance"));
      app.use("/api", require("./routes/Messages"));

      // HTTP or HTTPS?
      let server;
      if (options.env === "PRODUCTION") {
        const privateKey = fs.readFileSync(process.env.SSL_PRIVATEKEY);
        const certificate = fs.readFileSync(process.env.SSL_CERTIFICATE);
        server = https.createServer(
          {
            key: privateKey,
            cert: certificate,
          },
          app
        );
      } else if (options.env === "DEVELOPMENT") server = http.createServer(app);
      else throw new Error("Incorrect env option");

      // Start sockets.io server
      initSocketsIo(server);

      // Start whole server
      server.listen(port, () => {
        consoleLog("App started on port " + port);
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
};

const doTestingStuff = async () => {
  // Create some fake duties
  await DutyUserModel.bulkCreate([
    { name: "Kamil", shortcut: "10Z" },
    { name: "Patryk", shortcut: "11Z" },
    { name: "Łukasz", shortcut: "12Z" },
    { name: "Wojtek", shortcut: "13Z" },
  ]);

  const users = await DutyUserModel.findAll({
    where: { isDutyEnabled: true },
  });

  const date = new Date();

  for (let i = 0; i < 10; i++) {
    function getRandomInt(max) {
      return Math.floor(Math.random() + max);
    }

    await DutyModel.create({
      date: date,
      dutyUserId: users[getRandomInt(users.length - 1)].id,
    });

    date.setDate(date.getDate() + 1);
  }
};

initApp()
  .then(() => {
    doTestingStuff();
  })
  .catch((err) => console.log(err));
