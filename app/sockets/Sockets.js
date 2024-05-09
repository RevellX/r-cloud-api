const { Server } = require("socket.io");
const {
  consoleLog,
  checkToken,
  parseJwt,
} = require("../utils/functions");

let io = undefined;
const authorizedUsers = {};
const authorizedSockets = {};

function authorizeHandler(socket) {
  return (value) => {
    if (checkToken(value.token)) {
      const payload = parseJwt(value.token);
      authorizedUsers[payload.user_id] = socket.id;
      authorizedSockets[socket.id] = payload.user_id;
      // consoleLog(
      //   `Authorized ${value.username} (${payload.user_id}) => ${socket.id}`
      // );
    } else {
      // consoleLog(
      //   `Authorizaion error ${value.username}: ${value.token}`
      // );
    }
  };
}

function unauthorizeHandler(socket) {
  return (value) => {
    delete authorizedUsers[authorizedSockets[socket.id]];
    delete authorizedSockets[socket.id];
  };
}

function sendMessageHandler(socket) {
  return (msg) => {
    // consoleLog(`Received: ${msg.value}`);
    io.to(authorizedUsers[msg.receiverId]).emit(
      "receiveMessage",
      msg
    );
  };
}

function getIo() {
  return io;
}

function initSocketsIo(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    socket.on("authorize", authorizeHandler(socket));
    socket.on("disconnect", unauthorizeHandler(socket));
    socket.on("sendMessage", sendMessageHandler(socket));
  });
}

module.exports = { initSocketsIo, getIo };
