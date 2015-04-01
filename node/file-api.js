
function convertToBase64(buffer, mimetype) {
  return 'data:' + mimetype + ';base64,' + buffer.toString('base64');
}

function fileApi() {
  return function (req, res, next) {
    req.body = req.body || {};
    req.body.images = {};

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
      var buffersArray = [];

      file.on('data', function (data) {
        buffersArray.push(data);
      });

      file.on('end', function () {
        var bufferResult = Buffer.concat(buffersArray);
        req.body.images[fieldname] = {
          dataURL: convertToBase64(bufferResult, mimetype),
          mime: mimetype,
          size: bufferResult.length
        };
      });
    });

    req.busboy.on('finish', function () {
      next();
    });
  };
}

module.exports = fileApi;
