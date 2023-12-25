const express = require("express");
const {
  getDuties,
  swapDuties,
  deleteDuty,
  insertDuty,
} = require("../controllers/Duty");
const { authorize } = require("../utils/functions");
const { checkUserPermission } = require("../controllers/Auth");
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
  checkUserPermission("moderator"),
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
  checkUserPermission("moderator"),
  insertDuty
);

/* 
  {
    "dutyId": UUID of duty which you want to delete
  }

  "dutyId" will be deleted and all future duties witll be moved on day backwards
*/
router.delete(
  "/duty",
  authorize,
  checkUserPermission("moderator"),
  deleteDuty
);

module.exports = router;
