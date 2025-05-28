const express = require("express");
const router = express.Router();
const {
  getFile,
  uploadFile,
  getFiles,
  upload,
} = require("../controllers/File");
const { authorize } = require("../utils/functions");

router.post("/file", authorize, uploadFile);

router.get("/file-old/:fileId", authorize, getFile);
router.get("/files-old", authorize, getFiles);

module.exports = router;
