const express = require("express");
const {
  getDuties,
  swapDuties,
  deleteDuty,
} = require("../controllers/Duty");
const { authorize } = require("../utils/functions");
const router = express.Router();

router.get("/duties", getDuties);
router.patch("/duties", authorize, swapDuties);
router.delete("/duty", authorize, deleteDuty);

module.exports = router;
