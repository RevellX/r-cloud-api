const sequelize = require("../config/database");
const { QueryTypes, Op } = require("sequelize");
const Message = require("../models/Message");
const User = require("../models/User");
const { isUUIDCorrect } = require("../utils/functions");

const isMessageCorrect = (msg) => {
  if (typeof msg !== "string") return false;
  if (msg.length < 1) return false;

  return true;
};

const getUser = (req, res) => {
  const userId = req.params["userId"];

  if (!isUUIDCorrect(userId))
    return res
      .status(400)
      .json({ message: "Something is wrong with given UUID" });

  User.findByPk(userId)
    .then((user) => {
      if (!user)
        return res
          .status(404)
          .send({ message: "Unable to find user" });

      return res.json(user);
    })
    .catch((err) => {
      return res.status(500).json({ message: "Unable to get user" });
    });
};

const getUsers = (req, res) => {
  const { user_id: loggedUser } = req.tokenPayload;

  User.findAll({
    attributes: ["id", "username"],
    where: {
      [Op.not]: {
        id: loggedUser,
      },
    },
  })
    .then((users) => {
      return res.json(users);
    })
    .catch((err) => {
      return res.status(500).json({ message: "Unable to get users" });
    });
};

const getChats = (req, res) => {
  const { user_id: loggedUser } = req.tokenPayload;

  // Stack overflow says that sequelize doesn't have good UNION support and I can't figure out how to do this without it (UNION), so that's raw query time
  const sql =
    "(SELECT messages.receiverId as chatId, messages.sentAt FROM messages WHERE messages.senderId=:loggedUser ORDER BY messages.sentAt ASC) UNION (SELECT messages.senderId as chatId, messages.sentAt FROM messages WHERE messages.receiverId=:loggedUser ORDER BY messages.sentAt ASC) ORDER BY sentAt DESC";

  let chatsArray = [];

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
      chatsArray = chats;

      return User.findAll({
        attributes: ["id", "username"],
        where: { id: chats.map((chat) => chat.chatId) },
      });
    })
    .then((response) => {
      const chatsArrayWithNames = chatsArray.map((chat) => {
        const user = response.find((user) => user.id === chat.chatId);

        if (user)
          return {
            ...chat,
            username: user.username,
          };
      });

      const returnValue = chatsArrayWithNames.filter((chat) => chat);

      return res.json(returnValue);
    })
    .catch((err) => {
      console.log("Error while fetching messages chats", err);
      return res
        .status(400)
        .json({ message: "Something went wrong" });
    });
};

const getMessages = (req, res) => {
  const { user_id: loggedUser } = req.tokenPayload;
  const selectedChat = req.params["chatId"];

  // This query could easily be made with sequelize query builder
  // But it doesn't have any user input
  const sql =
    "SELECT messages.id, messages.receiverId, messages.senderId, messages.value, messages.sentAt FROM messages WHERE (messages.receiverId = :loggedUser AND messages.senderId = :selectedChat) OR (messages.receiverId = :selectedChat AND messages.senderId = :loggedUser) ORDER BY messages.sentAt DESC LIMIT 20";
  sequelize
    .query(sql, {
      replacements: { loggedUser, selectedChat },
      type: QueryTypes.SELECT,
    })
    .then((response) => {
      return res.json(response);
    })
    .catch((err) => {
      console.log("Some error whilte fetching chat messages", err);
      return res
        .status(400)
        .json({ message: "Something went wrong" });
    });
};

const sendMessage = (req, res) => {
  const { user_id: senderId } = req.tokenPayload;
  const receiverId = req.params["chatId"];
  const { value } = req.body;

  if (!isMessageCorrect(value))
    return res
      .status(400)
      .json({ message: "Something is wrong with message value" });

  Message.create({
    value,
    senderId,
    receiverId,
  })
    .then((msg) => {
      return res.json(msg);
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json({
        message: "Something went wrong while sending message",
      });
    });
};

module.exports = {
  getUser,
  getUsers,
  getChats,
  getMessages,
  sendMessage,
};
