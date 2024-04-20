const sequelize = require("../config/database");
const { QueryTypes } = require("sequelize");
const Message = require("../models/Message");

const getChats = (req, res) => {
  const { user_id: loggedUser } = req.tokenPayload;

  // Stack overflow says that sequelize doesn't have good UNION support and I can't figure out how to do this without it, so that's raw query time
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
      return res.json(chats);
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
  const sql =
    "SELECT messages.id, messages.receiverId, messages.senderId, messages.value, messages.sentAt FROM messages WHERE (messages.receiverId = :loggedUser AND messages.senderId = :selectedChat) OR (messages.receiverId = :selectedChat AND messages.senderId = :loggedUser) ORDER BY messages.sentAt DESC";
  sequelize
    .query(sql, {
      replacements: { loggedUser, selectedChat },
      type: QueryTypes.SELECT,
    })
    .then((response) => {
      console.log(response);
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
  const { value, receiverId } = req.body;

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
  getChats,
  getMessages,
  sendMessage,
};
