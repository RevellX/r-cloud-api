const FileModel = require("../models/File");
const path = require("path");
const fsp = require("fs/promises");
const fs = require("fs");
const { v4 } = require("uuid");

const FILES_DIRECTORY = path.join(__dirname, "..", "..", "public");
const UPLOAD_DIRECTORY = path.join(__dirname, "..", "..", "uploads");

const handleFileUpload = async (file = undefined) => {
  file.newname = v4();
  const lvOneDir = path.join(FILES_DIRECTORY, file.newname[0]);
  const lvTwoDir = path.join(lvOneDir, file.newname[1]);
  const fileNameSplit = file.originalname.split(".");
  if (fileNameSplit.length > 0)
    file.extension = fileNameSplit[fileNameSplit.length - 1];

  return new Promise((resolve, reject) => {
    try {
      // Make directory for the file
      fsp.mkdir(lvTwoDir, { recursive: true }).then(() => {
        const sourceFile = path.join(UPLOAD_DIRECTORY, file.filename);
        const targetFile = path.join(
          FILES_DIRECTORY,
          file.newname[0],
          file.newname[1],
          `${file.newname}.${file.extension}`
        );
        // Copy files to the vault
        fsp.copyFile(sourceFile, targetFile).then(
          // Remove the uploaded from file from temp directory
          fsp.unlink(sourceFile)
        );
        // Create a database entry
        FileModel.create({
          fileName: file.newname,
          originalName: file.originalname,
          extension: file.extension,
          size: file.size,
        }).then(resolve("File uploaded"));
      });
    } catch (err) {
      reject(err);
    }
  });
};

const uploadFile = (req, res) => {
  // console.log("File received: ", req.file);
  handleFileUpload(req.file)
    .then((result) => {
      res.json({ message: "File uploaded" });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Could not upload the file" });
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
  uploadFile,
  getFile,
  getFiles,
};
