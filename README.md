# FileAPI — a set of tools for working with files.

Support
 * Upload files: all browsers
 * Multiupload: all browsers that support HTML or flash
 * Working with Images: IE8+, FF, Chrome, Opera, Safari


## Example
```html
<span class="js-fileapi-wrapper" style="position: relative;">
	<input id="user-files" type="file" multiple />
</span>

<div id="preview-list">
</div>
```
```js
var input = document.getElementById('user-files');
var previewNode = document.getElementById('preview-list');

FileAPI.event.on(input, 'change', function (evt){
	var files = FileAPI.getFiles(evt.target); // or FileAPI.getFiles(evt)

	// filtering
	FileAPI.filterFiles(files, function (file, info){
		if( /image/.test(file.type) && info ){
			return	info.width >= 320 && info.height >= 240;
		}
		else {
			return	file.size > 128;
		}
	}, function (fileList, ignor){
		if( ignor.length ){
			// ...
		}

		if( !fileList.length ){
			// empty file list
			return;
		}


		// do preview
		var imageList = FileAPI.filter(fileList, function (file){ return /image/.test(file.type); });
		FileAPI.each(imageList, function (imageFile){
			FileAPI.Image(imageFile)
				.preview(100, 120)
				.get(function (err, image){
					if( err ){
						// ...
					}
					else {
						previewNode.appendChild(image);
					}
				})
			;
		});


		// upload on server
		var xhr = FileAPI.upload({
			url: '...',
			data: { foo: 'bar' },
			headers: { 'x-header': '...' },
			files: {
				files: FileAPI.filter(fileList, function (file){ return !/image/.test(file.type); }),
				pictures: imageList
			},
			imageTransform: {
				maxWidth:  1024,
				maxHeight: 768
			},
			fileprogress: function (evt){
				var percent = evt.loaded/evt.total*100;
				// ...
			},
			progress: function (evt){
				var percent = evt.loaded/evt.total*100;
				// ...
			},
			complete: function (err, xhr){
				// ...
			}
		});
	});
});
```


### API
* FileAPI.[getFiles](#getFiles)(`source:HTMLInput|Event`)`:Array`
* FileAPI.[getInfo](#getInfo)(`file:File`, `callback:Function`)
* FileAPI.[filterFiles](#filterFiles)(`files:Array`, `iterator:Function`, `complete:Function`)
* FileAPI.[readAsImage](#readAs)(`file:File`, `callback:function`)
* FileAPI.[readAsDataURL](#readAs)(`file:File`, `callback:function`)
* FileAPI.[readAsBinaryString](#readAs)(`file:File`, `callback:function`)
* FileAPI.[upload](#upload)(`options:Object`)`:XMLHttpRequest`


### Events
* FileAPI.event.on(`el:HTMLElement`, `eventType:String`, `fn:Function`)
* FileAPI.event.off(`el:HTMLElement`, `eventType:String`, `fn:Function`)
* FileAPI.event.one(`el:HTMLElement`, `eventType:String`, `fn:Function`)


### Utilities
* FileAPI.KB
* FileAPI.MB
* FileAPI.GB
* FileAPI.TB
* FileAPI.support.`html5:Boolean`
* FileAPI.support.`flash:Boolean`
* FileAPI.support.`canvas:Boolean`
* FileAPI.support.`dataURI:Boolean`
* FileAPI.each(`obj:Object|Array`, `fn:function`, `context:Mixed`)
* FileAPI.extend(`dst:Object`, `src:Object`)`:Object`
* FileAPI.filter(`list:Array`, `iterator:Function`)`:Array`
* FileAPI.isFile(`file:Mixed`)`:Boolean`
* FileAPI.toBinaryString(`val:Base64`)`:String`


### FileAPI.Images
* .crop(width[, height])
* .crop(x, y, width[, height])
* .resize(width[, height])
* .resize(width, height, `type:Enum(min,max,preview)`)
* .preview(width[, height])
* .rotate(deg)
* .get(`fn:Function`)



---------------------------------------


<a name="getFiles"></a>
### FileAPI.getFiles
```js
FileAPI.event.on('#my-file-1', 'change', onSelect);

// or jQuery
$('#my-file-2').on('change', onSelect);

function onSelect(evt){
	// (1) extract fileList from event (support dataTransfer)
	var files = FileAPI.getFiles(evt);

	// (2) or so
	var files = FileAPI.getFiles(evt.target);
}
```


<a name="getInfo"></a>
### FileAPI.getInfo
```js
FileAPI.addInfoReader(/^image/, function (file, callback){
	// http://www.nihilogic.dk/labs/exif/exif.js
	// http://www.nihilogic.dk/labs/binaryajax/binaryajax.js
	var Reader = new FileReader;
	Reader.onload = function (evt){
		var binaryString = evt.target.result;
		var oFile = new BinaryFile(binaryString, 0, file.size);
		var exif  = EXIF.readFromBinaryFile(oFile);
		callback(false, { 'exif': exif });
	};
	Reader.onerror = function (){
		callback(true);
	};
	Reader.readAsBinaryString(file);
});


FileAPI.getInfo(imageFile, function (err, info){
	if( !err ){
		switch( info.exif.Orientation ){
			// ...
		}
	}
});
```


<a name="filterFiles"></a>
### FileAPI.filterFiles
```js
FileAPI.filterFiles(files, function (file, info){
	if( /image/.test(file.type) && info ){
		return	info.width > 320 && info.height > 240;
	}
	return	file.size < 10 * FileAPI.MB;
}, function (result, ignor){
	// ...
});
```


<a name="readAs"></a>
### FileAPI.readAsImage, FileAPI.readAsDataURL (FileAPI.readAsBinaryString)
```js
FileAPI.readAsImage(file, function (evt){
	if( evt.type == 'load' ){
		var images = document.getElementById('images');
		images.appendChild(evt.result);
	}
	else {
		// ...
	}
});


FileAPI.readAsDataURL(file, function (evt){
	if( evt.type == 'load' ){
		// ...
	}
	else if( evt.type == 'progress' ){
		// ...
	}
	else {
		// ...
	}
});
```


<a name="upload"></a>
### FileAPI.upload
```js
var xhr = FileAPI.upload({
	url: '...',
	data: { foo: 'bar' },
	headers: { 'x-header': '...' },
	files: {
		'images': FileAPI.filter(files, function (file){ return /image/.test(file.type); })
	},
	imageTransform: {
		maxWidth: 1024,
		maxHeight: 768
	},
	upload: function (xhr, options){
		// start uploading
	},
	fileupload: function (xhr, options){
		// start file uploading
	},
	fileprogress: function (evt){
		// progress file uploading
		var filePercent = evt.loaded/evt.total*100;
	},
	filecomplete: function (err, xhr){
		if( !err ){
			var response = xhr.responseText;
		}
	},
	progress: function (evt){
		// total progress uploading
		var totalPercent = evt.loaded/evt.total*100;
	},
	complete: function (err, xhr){
		if( !err ){
			// Congratulations, the uploading was successful!
		}
	}
});
```



### File object (https://developer.mozilla.org/en/DOM/File)
```js
{
	name: 'fileName',
	type: 'mime-type',
	size: 'fileSize'
}
```


### XMLHttpRequest
```js
{
	status: Number,
	statusText: Number,
	readyState: Number,
	response: Blob,
	responseXML: XML,
	responseText: String,
	responseBody: String,
	getResponseHeader: function (name/**String*/)/**String*/{},
	getAllResponseHeaders: function ()/**Object*/{},
	abort: function (){}
}
```


### Cross-Domain upload-controller headers
```php
<?
	header('Access-Control-Allow-Methods: POST, OPTIONS');
	header('Access-Control-Allow-Headers: Origin, X-Requested-With'); // and other custom headers
	header('Access-Control-Allow-Origin: *'); // a comma-separated list of domains

	if( $_SERVER['REQUEST_METHOD'] == 'OPTIONS' ){
		exit;
	}

	if( $_SERVER['REQUEST_METHOD'] == 'POST' ){
		// ...
	}
?>
```


### iframe
#### POST-query
```
/controller.php
	?foo=bar
	&images=...
	&callback=...
```

#### POST-response
```php
<script type="text/javascript">
(function (ctx, jsonp){
	if( ctx && ctx[jsonp] ){
		ctx[jsonp](<?=$statusCode/*200 — OK*/?>, "<?=addslashes($statusText)?>", "<?=addslashes($response)?>");
	}
})(this.parent, '<?=$_POST['callback']?>');
</script>
```
