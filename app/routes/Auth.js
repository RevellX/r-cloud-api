const express = require("express");
const {
  authenticate,
  register,
  checkBody,
  checkUsernameIsUnique,
  swapUsers,
  checkUserPermission,
} = require("../controllers/Auth");
const { authorize } = require("../utils/functions");
const router = express.Router();

router.post("/authenticate", checkBody, authenticate);
router.post("/register", checkBody, checkUsernameIsUnique, register);
router.post(
  "/swap-users",
  authorize,
  checkUserPermission("admin"),
  swapUsers
);

module.exports = router;
