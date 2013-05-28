# FileAPI — a set of tools for working with files.


<p align="center">
 ~~~  <a href="http://mailru.github.com/FileAPI/">DEMO</a>
 ~~~  <a href="http://mailru.github.com/FileAPI/example.userpic.html">user pic</a>
 ~~~
</p>


## Support
 * Multiupload: all browsers that support HTML5 or [Flash](#flash-settings)
 * Drag'n'Drop upload: files (HTML5) & directories (Chrome 21+)
 * [Chunked](#chunked) file upload (HTML5)
 * Upload one file: all browsers
 * Working with [Images](#images): IE6+, FF 3.6+, Chrome 10+, Opera 11.1+, Safari 5.4+
    + crop, resize, preview & rotate (HTML5 or Flash)
    + auto orientation by exif (HTML5, if include FileAPI.exif.js or Flash)




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

// Drag'n'Drop
FileAPI.event.dnd(previewNode, function (over){
	$(this).css('background', over ? 'red' : '');
}, function (files){
	// ..
});



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
			data: { foo: 'bar' }, // POST-data (iframe, flash, html5)
			headers: { 'x-header': '...' }, // request headers (html5)
			files: {
				files: FileAPI.filter(fileList, function (file){ return !/image/.test(file.type); }),
				pictures: imageList
			},
			imageTransform: {
				maxWidth:  1024,
				maxHeight: 768
			},
			imageAutoOrientation: true,
			fileprogress: function (evt){   // (flash, html5)
				var percent = evt.loaded/evt.total*100;
				// ...
			},
			progress: function (evt){    // (flash, html5)
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

### HTML structure (templates)
 * [Default](#html-default)
 * [Button](#html-button)
 * [Link](#html-link)


### API
* FileAPI.[getFiles](#getFiles)(`source:HTMLInput|Event`)`:Array`
* FileAPI.[getDropFiles](#getDropFiles)(`files:Array`, `callback:Function`)
* FileAPI.[filterFiles](#filterFiles)(`files:Array`, `iterator:Function`, `complete:Function`)
* FileAPI.[upload](#upload)(`options:Object`)`:XMLHttpRequest`
* FileAPI.[getInfo](#getInfo)(`file:File`, `callback:Function`)
* FileAPI.[readAsImage](#readAs)(`file:File`, `callback:function`)
* FileAPI.[readAsDataURL](#readAs)(`file:File`, `callback:function`)
* FileAPI.[readAsBinaryString](#readAs)(`file:File`, `callback:function`)
* FileAPI.[readAsArrayBuffer](#readAs)(`file:File`, `callback:function`)
* FileAPI.[readAsText](#readAs)(`file:File`, `callback:function`)
* FileAPI.[readAsText](#readAs)(`file:File`, `encoding:String`, `callback:function`)


### Events
* FileAPI.event.on(`el:HTMLElement`, `eventType:String`, `fn:Function`)
* FileAPI.event.off(`el:HTMLElement`, `eventType:String`, `fn:Function`)
* FileAPI.event.one(`el:HTMLElement`, `eventType:String`, `fn:Function`)
* FileAPI.event.dnd(`el:HTMLElement`, `onHover:Function`, `onDrop:Function`)
* jQuery('#el').dnd(onHover, onDrop)


<a name="images"></a>
### FileAPI.Image
* .crop(width[, height])
* .crop(x, y, width[, height])
* .resize(width[, height])
* .resize(width, height, `type:Enum(min,max,preview)`)
* .preview(width[, height])
* .rotate(deg)
* .get(`fn:Function`)



### Utils
* FileAPI.KB
* FileAPI.MB
* FileAPI.GB
* FileAPI.TB
* FileAPI.support.`html5:Boolean`
* FileAPI.support.`cors:Boolean`
* FileAPI.support.`dnd:Boolean`
* FileAPI.support.`flash:Boolean`
* FileAPI.support.`canvas:Boolean`
* FileAPI.support.`dataURI:Boolean`
* FileAPI.support.`chunked:Boolean`
* FileAPI.each(`obj:Object|Array`, `fn:function`, `context:Mixed`)
* FileAPI.extend(`dst:Object`, `src:Object`)`:Object`
* FileAPI.filter(`list:Array`, `iterator:Function`)`:Array`
* FileAPI.isFile(`file:Mixed`)`:Boolean`
* FileAPI.toBinaryString(`str:Base64`)`:String`



---------------------------------------


<a name="getFiles"></a>
### FileAPI.getFiles
```js
FileAPI.event.on('#my-file-1', 'change', onSelect);

// or jQuery
$('#my-file-2').on('change', onSelect);

function onSelect(evt/**Event*/){
	// (1) extract fileList from event
	var files = FileAPI.getFiles(evt);

	// (2) or so
	var files = FileAPI.getFiles(evt.target);
}
```


<a name="getDropFiles"></a>
### FileAPI.getDropFiles
```js
function onDrop(evt){
	FileAPI.getDropFiles(evt, function (files){
		if( files.length ){
			// ...
		}
	});
}

// OR

var el = document.getElementById('el');
FileAPI.event.dnd(el, function (over/**Boolean*/, evt/**Event*/){
	el.style.background = over ? 'red' : '';
}, function (files/**Array*/, evt/**Event*/){
	// ...
});
```


<a name="getInfo"></a>
### FileAPI.getInfo
```js
FileAPI.getInfo(imageFile/**File*/, function (err/**Boolean*/, info/**Object*/){
	if( !err ){
		switch( info.exif.Orientation ){
			// ...
		}
	}
});

// ...

FileAPI.addInfoReader(/^image/, function (file/**File*/, callback/**Function*/){
	// http://www.nihilogic.dk/labs/exif/exif.js
	// http://www.nihilogic.dk/labs/binaryajax/binaryajax.js
	FileAPI.readAsBinaryString(file, function (evt){
		if( evt.type == 'load' ){
			var binaryString = evt.result;
			var oFile = new BinaryFile(binaryString, 0, file.size);
			var exif  = EXIF.readFromBinaryFile(oFile);
			callback(false, { 'exif': exif || {} });
		}
		else if( evt.type == 'error' ){
			callback('read_as_binary_string');
		}
		else if( evt.type == 'progress' ){
			// ...
		}
	});
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
		// success
		var result = evt.result;
	}
	else if( evt.type == 'progress' ){
		var pr = evt.loaded/evt.total * 100;
	}
	else {
		// error
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
		images: FileAPI.filter(files, function (file){ return /image/.test(file.type); }),
		customFile: { file: 'generate.txt', blob: customFileBlob }
	},

	chunkSize: 0, // or chunk size in bytes, eg: FileAPI.MB*.5 (html5)
	chunkUploadRetry: 0, // number of retries during upload chunks (html5)

	imageTransform: {
		maxWidth: 1024,
		maxHeight: 768
	},
	imageAutoOrientation: true,
	prepare: function (file, options){
		// prepare options for current file
		options.data.filename = file.name;
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


<a href="imageTransform"></a>
### imageTransform
 * width`:Number`
 * height`:Number`
 * preview`:Boolean`
 * maxWidth`:Number`
 * maxHeight`:Number`
 * rotate`:Number`
```js
FileAPI.upload({
	// ..
	imageOriginal: false, // don't send original on server

	imageTransform: {
		// (1) Resize to 120x200
		resize: { width: 120, height: 200 }

		// (2) create preview 320x240
		thumb:  { width: 320, height: 240, preview: true }

		// (3) Resize by max side
		max:    { maxWidth: 800, maxHeight: 600 }

		// (4) Custom resize
		custom: function (info, transform){
			return transform
					.crop(100, 100, 300, 200)
					.resize(100, 50)
				;
		}
	}
});
```


<a name="imageAutoOrientation"></a>
### imageAutoOrientation
```js
// (1) all images
FileAPI.upload({
 	// ..
	imageAutoOrientation: true
});

// (2) or so
FileAPI.upload({
	// ..
	imageAutoOrientation: true,
	imageTransform: { width: .., height: .. }
});

// (3) or so
FileAPI.upload({
	// ..
	imageTransform: { rotate: 'auto' }
});

// (4) only "800x600", original not modified
FileAPI.upload({
	// ..
	imageTransform: {
		"800x600": { width: 800, height: 600, rotate: 'auto' }
	}
});
```


-----


<a name="flash-settings"></a>
### Flash settings
```html
	<script>
		var FileAPI = {
			// @required
			  staticPath: '/js/' // @default: "./"

			// @optional
			, flashUrl: '/js/FileAPI.flash.swf' // @default: FileAPI.staticPath + "FileAPI.flash.swf"
			, flashImageUrl: '/js/FileAPI.flash.image.swf' // @default: FileAPI.staticPath + "FileAPI.flash.image.swf"
		};
	</script>
	<script src="/js/FileAPI.min.js"></script>
```

#### Flash-request ([FileReference](http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/net/FileReference.html))
The following sample HTTP POST request is sent from Flash Player to a server-side script if no parameters are specified:
```
  POST /handler.cfm HTTP/1.1
  Accept: text/*
  Content-Type: multipart/form-data;
  boundary=----------Ij5ae0ae0KM7GI3KM7
  User-Agent: Shockwave Flash
  Host: www.example.com
  Content-Length: 421
  Connection: Keep-Alive
  Cache-Control: no-cache

  ------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7
  Content-Disposition: form-data; name="Filename"

  MyFile.jpg
  ------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7
  Content-Disposition: form-data; name="Filedata"; filename="MyFile.jpg"
  Content-Type: application/octet-stream

  FileDataHere
  ------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7
  Content-Disposition: form-data; name="Upload"

  Submit Query
  ------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7--
```



-----



<a name="chunked"></a>
### Chunked file upload (html5)
```js
FileAPI.upload({
	  url: '...'
	, files: fileList
	, chunkSize: .5 * FileAPI.MB // 512KB
	, chunkUploadRetry: 1
	, complete: function (err, xhr){}
});
```

Client and server communicate to each other using the following HTTP headers and status codes.

Client explicitly sets the following headers:
* [Content-Range](http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.16): bytes \<start-offset\>-\<end-offset\>/\<total\>
* [Content-Disposition](http://www.w3.org/Protocols/rfc2616/rfc2616-sec19.html#sec19.5.1): attachment; filename=\<file-name\>

Any other headers are set by a target browser and are not used by client.
Library does not provide any facilities to track a file uniqueness across requests, it's left on developer's consideration.

Client recognizes the following response codes:
* 200, 201 - chunk is successfully saved
* 416, 500 - recoverable error, library tries to resend chunk 'chunkUploadRetry' times then fails

All the other codes - fatal error, user's involvement is recommend.


-----



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
	header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Range, Content-Disposition, Content-Type'); // and other custom headers
	header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']); // a comma-separated list of domains

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
})(this.parent, "<?=htmlspecialchars($_POST['callback'])?>");
</script>
```



---



### HTML structure (templates)

<a name="html-default"></a>
### Default
```html
<span class="js-fileapi-wrapper" style="position: relative; display: inline-block;">
	<input name="files" type="file" multiple />
</span>
```


<a name="html-button"></a>
### Button
```html
<style>
.upload-btn {
	width: 130px;
	height: 25px;
	overflow: hidden;
	position: relative;
	border: 3px solid #06c;
	border-radius: 5px;
	background: #0cf;

}
	.upload-btn:hover {
		background: #09f;
	}
	.upload-btn__txt {
		z-index: 1;
		position: relative;
		color: #fff;
		font-size: 18px;
		font-family: "Helvetica Neue";
		line-height: 24px;
		text-align: center;
		text-shadow: 0 1px 1px #000;
	}
	.upload-btn__inp {
	 	top: -10px;
		right: -40px;
		z-index: 2;
		position: absolute;
		cursor: pointer;
		opacity: 0;
		filter: alpha(opacity=0);
		font-size: 50px;
	}
</style>
<div class="upload-btn js-fileapi-wrapper">
	<div class="upload-btn__txt">Upload files</div>
	<input class="upload-btn__inp" name="files" type="file" multiple />
</div>
```


<a name="html-link"></a>
### Link
```html
<style>
.upload-link {
	color: #36c;
	display: inline-block;
	*zoom: 1;
	*display: inline;
	overflow: hidden;
	position: relative;
	padding-bottom: 2px;
	text-decoration: none;
}
	.upload-link__txt {
		z-index: 1;
		position: relative;
		border-bottom: 1px dotted #36c;
	}
		.upload-link:hover .upload-link__txt {
			color: #f00;
			border-bottom-color: #f00;
		}

	.upload-link__inp {
		top: -10px;
		right: -40px;
		z-index: 2;
		position: absolute;
		cursor: pointer;
		opacity: 0;
		filter: alpha(opacity=0);
		font-size: 50px;
	}
</style>
<a class="upload-link js-fileapi-wrapper">
	<span class="upload-link__txt">Upload photo</span>
	<input class="upload-link__inp" name="photo" type="file" accept=".jpg,.jpeg,.gif" />
</a>
```


---


## Changelog
 * [#90](https://github.com/mailru/FileAPI/issues/90): Fixed `progress` event


### 1.2.5
 * [#86](https://github.com/mailru/FileAPI/issues/86): Smarter upload recovery
 * [#87](https://github.com/mailru/FileAPI/issues/87): Fixed upload files into browsers that do not support FormData
 * Fixed support "accept" attribute for Flash.
 * Fixed detection of HTML5 support for FireFox 3.6
 * + FileAPI.html5 option, default "true"


### 1.2.4
 * Fixed auto orientation image by EXIF (Flash)
 * Fixed image dimensions after rotate (Flash)
 * [#82](https://github.com/mailru/FileAPI/issues/82): "undefined" data-fields cause exceptions
 * [#83](https://github.com/mailru/FileAPI/issues/83): Allow requests without files
 * [#84](https://github.com/mailru/FileAPI/pull/84): Fixed connection abort when waiting for connection recovery


### 1.2.3
 * [#77](https://github.com/mailru/FileAPI/pull/77): Fixed flash.abort(), [#75](https://github.com/mailru/FileAPI/issues/75)
 * - `FileAPI.addMime`
 * + `FileAPI.accept` — fallback for flash.


### 1.2.2
 * [#67](https://github.com/mailru/FileAPI/pull/67): Added correct httpStatus for upload fail, [#62](https://github.com/mailru/FileAPI/pull/68)
 * [#68](https://github.com/mailru/FileAPI/pull/68) Added "Content-Type" for chunked upload, [#65](https://github.com/mailru/FileAPI/pull/65)
 * [#69](https://github.com/mailru/FileAPI/issues/69): Fixed network down recovery
 * Fixed progress event, [#66](https://github.com/mailru/FileAPI/issues/66)
 * Increase flash stage size, [#73](https://github.com/mailru/FileAPI/pull/73)
 * - array index from POST-param "name", [#72](https://github.com/mailru/FileAPI/issues/72)
 * - dependency on FileAPI.Image for FileAPI.Flash


### 1.2.1
 * [#64](https://github.com/mailru/FileAPI/issues/64): Bufixed for [#63](https://github.com/mailru/FileAPI/issues/63)



### 1.2.0
 * [#57](https://github.com/mailru/FileAPI/issues/57): Chunked file upload


### 1.1.0
 * [#54](https://github.com/mailru/FileAPI/issues/54): added `FileAPI.flashUrl` and `FileAPI.flashImageUrl`


### 1.0.1
 * [#51](https://github.com/mailru/FileAPI/issues/51): remove circular references from `file-objects` (Flash transport)
 * added `changelog`


### 1.0.0
 * first release
