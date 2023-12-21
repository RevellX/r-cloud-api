const path = require("path");
const fs = require("fs/promises");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
// const db = require("../config/database");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const createToken = (user_id) => {
  const token = jwt.sign(
    { user_id: user_id },
    process.env.JWT_KEY_SECRET,
    {
      expiresIn: "24h",
    }
  );

  const date = new Date();
  date.setDate(date.getDate() + 1);
  const tokenExpire = date.getTime();

  return { token: token, expire: tokenExpire };
};

const checkToken = (token) => {
  try {
    result = jwt.verify(token, process.env.JWT_KEY_SECRET);
    return true;
  } catch (err) {
    return false;
  }
};

const parseJwt = (token) => {
  return JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  );
};

const authorize = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (checkToken(token)) {
    const payload = parseJwt(token);
    req.tokenPayload = payload;
    next();
  } else res.status(401).json({ message: "You are not authorized" });
};

const clearUploadsDirectory = async () => {
  const publicDir = path.join(__dirname, "..", "..", "uploads");

  const files = await fs.readdir(publicDir);

  const deletePromises = files.map(async (file) => {
    const elementToDelete = path.join(publicDir, file);
    console.log("Removing: ", elementToDelete);
    return fs.rm(elementToDelete, { recursive: true });
  });

  return Promise.all(deletePromises);
};

const sha256 = async (message) => {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
};

module.exports = {
  clearUploadsDirectory,
  createToken,
  checkToken,
  authorize,
  sha256,
};
