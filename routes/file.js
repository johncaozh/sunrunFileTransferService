var express = require("express");
var multer = require("multer");
var api = require("../utilities/api");
var env = require("../utilities/env");
var fs = require('fs');
var path = require('path');
var uuid = require('uuid');
var s3 = require("../utilities/s3.js");
var router = express.Router();
const fileDir = path.resolve("files");
var upload = multer({
  dest: fileDir
}).single('file');

// 单文件上传
router.post("/files", upload, function (req, res, next) {
  var mimeType = req.query.mimeType;

  upload(req, res, async function (err) {
    if (err) {
      api.attachData2Response(500, "上传失败", err, res);
      next();
    } else {
      var data = {
        size: req.file.size,
      };
      data.serverId = await s3.getFileMd5(req.file.path);
      var existed = await s3.checkObjectExist(data.serverId);
      if (!existed) {
        await s3.uploadObject(req.file.path, data.serverId, mimeType || req.file.mimetype);
      }

      data.link = s3.getLink(data.serverId);
      fs.unlinkSync(req.file.path);
      api.attachData2Response(200, "上传成功", data, res);
      next();
    }
  });
});

router.get("/files/:fileId", api.catchAsyncErrors(async function (req, res, next) {
  var fileId = req.params.fileId;
  var fileName = req.query.fileName;
  var existed = await s3.checkObjectExist(fileId);
  if (existed) {
    var stream = await s3.getObjectStream(fileId);
    res.attachment(fileName || fileId);
    stream.pipe(res);
  } else {
    api.attachData2Response(404, "文件不存在", {
      serverId: fileId
    }, res);
    next();
  }
}));

module.exports = router;