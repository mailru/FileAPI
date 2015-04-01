var express = require('express');
var busboy = require('connect-busboy');
var fileApi = require('./file-api');
var app = express();

app.use(express.static('.', {index: 'index.html'}));

app.use(function (req, res, next) {
  // Enable CORS for non static files
  var origin = req.get('Origin');
  if (origin) {
    res.set({
      'Access-Control-Allow-Origin':      origin,
      'Access-Control-Allow-Methods':     'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers':     'Origin, X-Requested-With, Content-Range, Content-Disposition, Content-Type',
      'Access-Control-Allow-Credentials': 'true'
    });
  }
  next();
});

var uploadPath = '/upload';

app.options(uploadPath, function (req, res) {
  res.end();
});

app.post(uploadPath, busboy({immediate: true}), fileApi(), function (req, res) {
  var jsonp = req.query.callback || null;
  res[jsonp ? 'jsonp' : 'json']({
    status:     200,
    statusText: 'OK',
    images:     req.body.images
  });
});

var server = app.listen(8000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Test server listening at http://%s:%s', host, port)
});
