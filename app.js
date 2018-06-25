var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var s3 = require("./utilities/s3");
var app = express();
var router_file = require('./routes/file');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({
  limit: '1000mb'
}));
app.use(bodyParser.urlencoded({
  extended: false,
  limit: '1000mb'
}));

app.use('/api/v1', router_file);

//生成特定格式的响应
app.use(function (req, res, next) {
  if (res.code != 200 && res != 302)
    console.log(`url:${req.url},error:${res.msg}`)

  if (res.code == 302) {
    resData = {
      location: res.data
    }
    res.redirect(res.data);
  } else {
    var resData = {
      code: res.code,
      msg: res.msg,
      data: res.data
    };
    res.status(res.code).json(resData);
  }
});

app.use((err, req, res, next) => {
  console.log(`url:${req.url},method:${req.method},error:${err.message}`);
  var resData = {
    code: err.status || 500,
    msg: err.message,
    data: err.data
  }

  res.status(err.status || 500).json(resData);
});

var server = app.listen(3000, async function () {
  await s3.init();
});