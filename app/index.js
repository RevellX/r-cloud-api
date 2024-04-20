const express = require("express");
const app = express();
const port = 5000;
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
} = require("./utils/functions");

const FileModel = require("./models/File");
const UserModel = require("./models/User");
const DutyModel = require("./models/Duty");
const DutyExcludedDayModel = require("./models/DutyExcludedDay");
const ExpenseModel = require("./models/Expense");
const ExpenseGroupModel = require("./models/ExpenseGroup");
const MessageModel = require("./models/Message");
const { where } = require("sequelize");
const { group } = require("console");
const sequelize = require("./config/database");
const { type } = require("os");

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
      // await ExpenseModel.sync({ alter: true });
      // await ExpenseGroupModel.sync({ alter: true });
      await MessageModel.sync({ force: true });

      // Relations between models
      UserModel.hasMany(DutyModel);
      DutyModel.belongsTo(UserModel);

      ExpenseGroupModel.hasMany(ExpenseModel);
      ExpenseModel.belongsTo(ExpenseGroupModel);

      UserModel.hasMany(ExpenseModel);
      ExpenseModel.belongsTo(UserModel);

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
      // app.use("/api", require("./routes/File"));
      app.use("/api", require("./routes/Duty"));
      app.use("/api", require("./routes/Finance"));
      app.use("/api", require("./routes/Messages"));

      let server;
      if (options.env === "PRODUCTION") {
        const privateKey = fs.readFileSync(
          process.env.SSL_PRIVATEKEY
        );
        const certificate = fs.readFileSync(
          process.env.SSL_CERTIFICATE
        );
        server = https.createServer(
          {
            key: privateKey,
            cert: certificate,
          },
          app
        );
      } else if (options.env === "DEVELOPMENT")
        server = http.createServer(app);
      else throw new Error("Incorrect env option");

      server.listen(port, () => {
        console.log("App started on port " + port);
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
};

const doTestingStuff = async () => {
  const messages = [
    ["Patryk", "Kuba", "Siema, co tam?"],
    ["Kuba", "Patryk", "No jest zajebiście, a u ciebie?"],
    ["Patryk", "Kuba", "Ogólnie to jest zajebioza"],
    ["Kuba", "Patryk", "To się bardzo cieszę"],
    //
    ["Kamil", "Patryk", "Eee... Idziesz na rower?"],
    ["Kamil", "Patryk", "Halo? Jesteś?"],
    //
    ["Patryk", "Mateusz", "Ty głupia kurwo, jedź po tego Fischera!"],
    //
    ["Kamil", "Kuba", "Był ktoś po Linerema?"],
    ["Kuba", "Kamil", "Nie wiem"],
    //
    // ["Kamil", "Alan", "Weź spierdalaj!"],
  ];

  const users = await UserModel.findAll();

  const ids_names_map = {};
  const names_ids_map = {};
  users.map((user) => {
    ids_names_map[user.username] = user.id;
    names_ids_map[user.id] = user.username;
  });

  // console.log(ids_names_map);
  // console.log(ids_names_map["Patryk"]);
  // console.log(ids_names_map[messages[0][0]]);
  // return;

  const displayChats = async () => {
    console.log("Displaying chats");

    // Get messages in Chat
    //   const loggedUser = "Patryk";
    //   const selectedUser = "Kuba";

    //   MessageModel.findAll({
    //     where: {
    //       [Op.or]: [
    //         {
    //           [Op.and]: [
    //             { senderId: loggedUser },
    //             { receiverId: selectedUser },
    //           ],
    //         },
    //         {
    //           [Op.and]: [
    //             { receiverId: loggedUser },
    //             { senderId: selectedUser },
    //           ],
    //         },
    //       ],
    //     },
    //     order: [["sentAt", "ASC"]],
    //   }).then((data) => data.map((d) => console.log(d.dataValues)));
    // };

    const loggedUser = ids_names_map["Patryk"];
    const selectedChat = ids_names_map["Kuba"];
    // Get Chats
    const sql =
      "(SELECT messages.receiverId as chatId, messages.sentAt FROM messages WHERE messages.senderId=:loggedUser ORDER BY messages.sentAt ASC) UNION (SELECT messages.senderId as chatId, messages.sentAt FROM messages WHERE messages.receiverId=:loggedUser ORDER BY messages.sentAt ASC) ORDER BY sentAt DESC";

    sequelize
      .query(sql, {
        replacements: { loggedUser },
        type: QueryTypes.SELECT,
      })
      .then((response) => {
        const ids = [];
        const chats = response.filter((chat) => {
          if (!ids.includes(chat.chatId)) {
            ids.push(chat.chatId);
            return true;
          }
          return false;
        });
        console.log(chats);
      })
      .catch((err) =>
        console.log("Some error while fetching chats", err)
      );

    // Get chat messages
    const sql_2 =
      "SELECT messages.id, messages.receiverId, messages.senderId, messages.value, messages.sentAt FROM messages WHERE (messages.receiverId = :loggedUser AND messages.senderId = :selectedChat) OR (messages.receiverId = :selectedChat AND messages.senderId = :loggedUser) ORDER BY messages.sentAt DESC";
    sequelize
      .query(sql_2, {
        replacements: { loggedUser, selectedChat },
        type: QueryTypes.SELECT,
      })
      .then((response) => {
        console.log(response);
      })
      .catch((err) =>
        console.log("Some error whilte fetching chat messages", err``)
      );

    // DEBUG
    // console.log(chats);
  };

  // DEV TEST
  let counter = 0;
  const sender = setInterval(() => {
    if (counter < messages.length) {
      console.log("Sending fake message");
      MessageModel.create({
        value: messages[counter][2],
        senderId: ids_names_map[messages[counter][0]],
        receiverId: ids_names_map[messages[counter][1]],
      });
    } else {
      clearInterval(sender);
      // displayChats();
    }
    counter++;
  }, 200);
};

initApp()
  .then(() => {
    doTestingStuff();
  })
  .catch((err) => console.log(err));
