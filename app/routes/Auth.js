const express = require("express");
const {
  authenticate,
  register,
  checkBody,
  checkUsernameIsUnique,
} = require("../controllers/Auth");
const router = express.Router();

router.post("/authenticate", checkBody, authenticate);
router.post("/register", checkBody, checkUsernameIsUnique, register);

module.exports = router;
