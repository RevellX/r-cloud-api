const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getFile,
  uploadFile,
  getFiles,
} = require("../controllers/File");
const { authorize } = require("../utils/functions");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const timeNow = new Date().getTime();
    const fileName = `${timeNow}_${file.originalname}`;
    cb(null, fileName);
  },
});
const upload = multer({ storage: storage });

router.get("/file/:fileId", authorize, getFile);
router.get("/files", authorize, getFiles);
router.post(
  "/file/upload",
  authorize,
  upload.single("file"),
  uploadFile
);

module.exports = router;
