const express = require("express");
const {
  getDuties,
  swapDuties,
  deleteDuty,
  insertDuty,
  getUsers,
  toggleUser,
} = require("../controllers/Duty");
const { authorize } = require("../utils/functions");
const { userHasPermission } = require("../controllers/Auth");
const router = express.Router();

router.get("/duties", getDuties);

/* 
  {
    "dutyOne": UUID of first duty
    "dutyTwo": UUID of second duty
  }
*/
router.patch(
  "/duties",
  authorize,
  userHasPermission("duties.swap"),
  swapDuties
);

/* 
  {
    "dutyId": UUID of duty where you want to insert
    "userId": UUID of user which you want to insert
  }

  New duty with "userId" will we inserted on the place of "dutyId"
  "dutyId" and all future duties will be moved one day forward
*/
router.post(
  "/duty",
  authorize,
  userHasPermission("duties.insert"),
  insertDuty
);

/* 
  {
    "dutyId": UUID of duty which you want to delete
  }

  "dutyId" will be deleted and all future duties will be moved one day backwards
*/
router.delete(
  "/duty",
  authorize,
  userHasPermission("duties.delete"),
  deleteDuty
);

/*
  Get duty enabled users
*/
router.get(
  "/dutyUsers",
  authorize,
  userHasPermission("duties.toggle"),
  getUsers
);

/*
  {
    "userId": UUID of user which you want to toggle "isDutyEnabled"
  }

*/
router.patch(
  "/dutyToggle/:userId",
  authorize,
  userHasPermission("duties.toggle"),
  toggleUser
);

module.exports = router;
