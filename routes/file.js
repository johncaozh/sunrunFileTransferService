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
  var withPresignedUrl = req.query.withPresignedUrl === "true" || req.query.withPresignedUrl === "True";
  var expires = Number(req.query.expires);
  
  if (expires < 0 || expires > 7 * 24 * 60 * 60) {
    api.attachData2Response(400, "expires不合法", null, res);
    next();
    return;
  }

  upload(req, res, async function (err) {
    if (err) {
      api.attachData2Response(500, "上传失败", err, res);
      next();
    } else {
      var data = {
        size: req.file.size, 
      };
      data.md5 = await s3.getFileMd5(req.file.path);
      var existed = await s3.checkObjectExist(data.md5);
      if (!existed) {
        await s3.uploadObject(req.file.path, data.md5, mimeType || req.file.mimetype);
      }
      if (withPresignedUrl) {
        data.presignedUrl = await s3.getObjectPresignedUrl(data.md5, expires);
      }

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
    var localPath = path.resolve(fileDir, uuid.v4());
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