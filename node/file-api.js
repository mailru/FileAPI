var fs = require('fs');
var qs = require('qs');
var imageSize = require('image-size');

function convertToBase64(buffer, mimetype) {
	return 'data:' + mimetype + ';base64,' + buffer.toString('base64');
}

function fileApi() {
	return function (req, res, next) {
		var queryString = '';
		
		req.files = {};
		req.images = {};

		req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
			var buffersArray = [];

			file.on('data', function (data) {
				buffersArray.push(data);
			});

			file.on('end', function () {
				var bufferResult = Buffer.concat(buffersArray);
				var fileObj = {
					name: filename,
					type: mimetype,
					mime: mimetype,
					size: bufferResult.length,
					dataURL: convertToBase64(bufferResult, mimetype)
				};

				req.files[fieldname] = fileObj;

				if (mimetype.indexOf('image/') === 0) {
					fs.writeFileSync(filename, bufferResult);

					var size = imageSize(filename);

					fileObj.width = size.width;
					fileObj.height = size.height;

					req.images[fieldname] = fileObj;

					fs.unlinkSync(filename);
				}
			});
		});

		req.busboy.on('field', function (key, value) {
			queryString += encodeURIComponent(key) + '=' + encodeURIComponent(value) + '&';
		});

		req.busboy.on('finish', function () {
			req.body = qs.parse(queryString);

			next();
		});
	};
}

module.exports = fileApi;
