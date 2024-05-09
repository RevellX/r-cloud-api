const express = require("express");
const {
  getChats,
  getMessages,
  sendMessage,
  getUsers,
  getUser,
} = require("../controllers/Messages");
const { authorize } = require("../utils/functions");
const { userHasPermission } = require("../controllers/Auth");
const router = express.Router();

/**
    Get user by id
*/
router.get(
  "/messages/user/:userId",
  authorize,
  userHasPermission("messages.chats"),
  getUser
);

/**
    Get list of users who can be messaged
*/
router.get(
  "/messages/users",
  authorize,
  userHasPermission("messages.chats"),
  getUsers
);

/*
    Get list of chats avaialble for logged user. Sent and received messages
 */
router.get(
  "/messages",
  authorize,
  userHasPermission("messages.chats"),
  getChats
);

/*
    {
        "chatId": UUID of messaging user
    }

    Get messages sent and received from selected user
*/
router.get(
  "/messages/:chatId",
  authorize,
  userHasPermission("messages.chats"),
  getMessages
);

/*
    {
        "chatId": UUID of messasing user,
        "value": Message content to be sent
    }
*/
router.post(
  "/messages/:chatId",
  authorize,
  userHasPermission("messages.chats"),
  sendMessage
);

module.exports = router;
