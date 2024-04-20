const express = require("express");
const { getChats, getMessages } = require("../controllers/Messages");
const { authorize } = require("../utils/functions");
const { userHasPermission } = require("../controllers/Auth");
const router = express.Router();

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

module.exports = router;
