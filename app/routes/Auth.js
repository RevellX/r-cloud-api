const express = require("express");
const {
  authenticate,
  register,
  checkBody,
  checkUsernameIsUnique,
  swapUsers,
  checkUserPermission,
  getUser,
  updateToken,
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
router.get("/user", authorize, getUser);
router.get("/updateToken", authorize, updateToken);

module.exports = router;
