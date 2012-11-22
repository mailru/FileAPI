# FileAPI — a set of tools for working with files.


<p align="center">
 ~~~  <a href="http://mailru.github.com/FileAPI/">DEMO</a>  ~~~
</p>


## Support
 * Multiupload: all browsers that support HTML5 or [Flash](#flash-settings)
 * Drag'n'Drop upload: files (HTML5) & directories (Chrome 21+)
 * Upload one file: all browsers
 * Working with Images: IE6+, FF 3.6+, Chrome 10+, Opera 11.1+, Safari 5.4+
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
			imageAutoOrientation: true,
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
* FileAPI.each(`obj:Object|Array`, `fn:function`, `context:Mixed`)
* FileAPI.extend(`dst:Object`, `src:Object`)`:Object`
* FileAPI.filter(`list:Array`, `iterator:Function`)`:Array`
* FileAPI.isFile(`file:Mixed`)`:Boolean`
* FileAPI.toBinaryString(`str:Base64`)`:String`


<a name="flash-settings"></a>
### Flash settings
```html
	<script>var FileAPI = { staticPath = '/js/' };</script>
	<script src="/js/FileAPI.min.js"></script>
```


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
	el.style.background = ever ? 'red' : '':
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
	imageTransform: {
		maxWidth: 1024,
		maxHeight: 768
	},
	imageAutoOrientation: true,
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


----



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
		font-size: 50px;
	}
</style>
<a href="#" class="upload-link js-fileapi-wrapper">
	<span class="upload-link__txt">Upload photo</span>
	<input class="upload-link__inp" name="photo" type="file" accept=".jpg,.jpeg,.gif" />
</a>
```
