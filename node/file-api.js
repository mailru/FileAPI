
function convertToBase64(buffer, mimetype) {
	return 'data:' + mimetype + ';base64,' + buffer.toString('base64');
}

function fileApi() {
	return function (req, res, next) {
		req.body = {};
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

		req.busboy.on('field', function (key, value, keyTruncated, valueTruncated) {
			req.body[key] = value;
			console.log(arguments);
		});

		req.busboy.on('finish', function () {
			next();
		});
	};
}

module.exports = fileApi;
