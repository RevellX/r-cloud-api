const FileModel = require("../models/File");
const path = require("path");
const fsp = require("fs/promises");
const fs = require("fs");
const { v4 } = require("uuid");
const multer = require("multer");

const FILES_DIRECTORY = path.join(__dirname, "..", "..", "public");
const UPLOAD_DIRECTORY = path.join(__dirname, "..", "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const timeNow = new Date().getTime();
    const fileName = `${timeNow}_${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1 * 1000 * 1000 * 10 }, // max 10MB
  fileFilter: function (req, file, cb) {
    // Set the filetypes, it is optional
    var filetypes = /jpeg|jpg|png|mp4/;
    var mimetype = filetypes.test(file.mimetype);

    var extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(
      "Error: File upload only supports the " +
        "following filetypes - " +
        filetypes
    );
  },
  // mypic is the name of file attribute
}).single("file");

const uploadFile = (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      // Multer Error
      return res.status(400).json({ message: err.message });
    } else if (err) {
      // Some other error
      return res
        .status(400)
        .json({
          message: err.message
            ? err.message
            : "Some other error accured",
        });
    } else {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const file = req.file;
      file.newname = v4();
      const lvOneDir = path.join(FILES_DIRECTORY, file.newname[0]);
      const lvTwoDir = path.join(lvOneDir, file.newname[1]);
      const fileNameSplit = file.originalname.split(".");
      if (fileNameSplit.length > 0)
        file.extension = fileNameSplit[fileNameSplit.length - 1];
      const sourceFile = path.join(UPLOAD_DIRECTORY, file.filename);
      const targetFile = path.join(
        FILES_DIRECTORY,
        file.newname[0],
        file.newname[1],
        file.extension ? `${file.newname}.${file.extension}` : ""
      );

      try {
        await fsp.mkdir(lvTwoDir, { recursive: true });
        await fsp.copyFile(sourceFile, targetFile);
        await fsp.unlink(sourceFile);
      } catch (err) {
        return res
          .status(500)
          .json({ message: "Failed to save uploaded file" });
      }

      return res.json({ message: "File uploaded" });
    }
  });
};

const getFile = async (req, res) => {
  const { download } = req.query;
  const id = req.params["fileId"];

  const file = await FileModel.findOne({
    attributes: ["id", "fileName", "originalName", "extension"],
    where: {
      id: id,
    },
  });

  const fileName = file.fileName;

  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "public",
    fileName[0],
    fileName[1],
    fileName + ".mp4"
  );

  const readStream = fs.createReadStream(filePath);
  res.set("Content-Type", "video/mp4");
  // res.set("Content-Length", "100000000");
  if (download)
    res.set(
      "Content-Disposition",
      'attachment; filename="example.mp4"'
    );
  readStream.pipe(res);
  // return res.json({ message: `Getting file: ${filePath}` });
};

const getFiles = (req, res) => {
  FileModel.findAll({
    attributes: ["id", "fileName", "originalName", "extension"],
  })
    .then((result) => {
      return res.json(result);
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(500)
        .json({ message: "Unable to fetch files" });
    });
};

module.exports = {
  upload,
  uploadFile,
  getFile,
  getFiles,
};
