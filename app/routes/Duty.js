const express = require("express");
const {
  getDuties,
  getDuty,
  swapDuties,
  deleteDuty,
  insertDuty,
  getUsers,
  toggleUser,
  getUser,
  createUser,
  editUser,
  deleteUser,
} = require("../controllers/Duty");
const { authorize } = require("../utils/functions");
const { userHasPermission } = require("../controllers/Auth");
const router = express.Router();

/**
 * Just get available duties and planned holidays
 */
router.get("/duties", getDuties);

/**
 * Get duty by dutyDate
 *
 * {
 *  "dutyDate": date of duty
 * }
 */
router.get("/duty/:dutyDate", getDuty);

/* 

  Edit dutyUser of a duty

  dutyDate is always required.
  UserId is optional. If its there, that user will be placed and that date. It it's not there, that duty will be deleted.

  {
    "dutyDate": date of a duty
    "userId": UUID of dutyUser
  }
*/
router.patch(
  "/duty/:dutyDate",
  authorize,
  userHasPermission("duties.swap"),
  swapDuties
);

/**
 * Get duty enabled users
 */
router.get("/dutyUsers", getUsers);

/**
 * Get duty enabled user
 */
router.get("/dutyUser/:dutyUserId", getUser);

/**
 * Register new user
 *
 * body: {
 *  name: (string) Display name of the newly created user
 *  shortcut: (shortcut) Id used by bureau to send dispatch requests (DPD thing...)
 * }
 *
 */
router.post(
  "/dutyUser",
  authorize,
  userHasPermission("duties.manageUsers"),
  createUser
);

/**
 * Edit already existing user
 */
router.patch(
  "/dutyUser/:dutyUserId",
  authorize,
  userHasPermission("duties.manageUsers"),
  editUser
);

/**
 * Delete user
 */
router.delete(
  "/dutyUser/:dutyUserId",
  authorize,
  userHasPermission("duties.manageUsers"),
  deleteUser
);

module.exports = router;
