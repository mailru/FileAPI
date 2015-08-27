var qs = require('qs');

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
					dataURL: convertToBase64(bufferResult, mimetype),
					mime: mimetype,
					size: bufferResult.length
				};

				req.files[fieldname] = fileObj;

				if (mimetype.indexOf('image/') === 0) {
					req.images[fieldname] = fileObj;
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
