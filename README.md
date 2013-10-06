<a name="install" data-name="Installation"></a>
## Installation, testing, assembling
`npm install fileapi`<br/>
`cd fileapi`<br/>
`npm install`<br/>
`grunt`


---


<a name="FileAPI"></a>
## FileAPI
A set of javascript tools for working with files.


<a name="FileAPI.setup"></a>
### Setup
Connecting the library to your project.
If you need a CORS, then edit the `crossdomain.xml` and put it in the root of remote domain.

```html
	<script>
		window.FileAPI = {
			  debug: false   // debug mode, see Console
			, cors: true     // if used CORS
			, staticPath: '/js/FileAPI/dist/' // path to '*.swf'
		};
	</script>
	<script src="/js/FileAPI/dist/FileAPI.min.js"></script>

	<!-- OR -->

	<script>
		window.FileAPI = { /* options */ };
		require(['FileAPI'], function (FileAPI){
			// ...
		});
	</script>
```

---


<a name="FileAPI.getFiles"></a>
### getFiles(input`:HTMLInputElement|Event|$.Event`)`:Array`
Get files from `input` element or `event` object, also support `jQuery`.

* input — `HTMLInputElement`, `change` and `drop` event, `jQuery` collection or `jQuery.Event`

```js
var el = document.getElement('my-input');
FileAPI.event.on(el, function (evt/**Event*/){
	// Get files from input
	var files = FileAPI.getFiles(el);

	// or event
	var files = FileAPI.getFiles(evt);
});
```

---


<a name="FileAPI.getInfo"></a>
### getInfo(file`:Object`, callback`:Function`)`:void`
Get info of file (see also: FileAPI.addInfoReader).

* file — file object (https://developer.mozilla.org/en-US/docs/DOM/File)
* callback — function, called after collected info of file

```js
// Get info of image file (FileAPI.exif.js included)
FileAPI.getInfo(file, function (err/**String*/, info/**Object*/){
	if( !err ){
		console.log(info); // { width: 800, height: 600, exif: {..} }
	}
});

// Get info of mp3 file (FileAPI.id3.js included)
FileAPI.getInfo(file, function (err/**String*/, info/**Object*/){
	if( !err ){
		console.log(info); // { title: "...", album: "...", artists: "...", ... }
	}
});
```

---

<a name="FileAPI.filterFiles"></a>
### filterFiles(files`:Array`, filter`:Function`, callback`:Function`)`:void`
Filtering the list of files, with additional information about files.
See also: FileAPI.getInfo and FileAPI.addInfoReader.

* files — original list of files
* filter — function, takes two arguments: `file` — the file itself, `info` — additional information.
* callback — function: `list` — files that match the condition, `other` — all the rest.

```js
// Get list of file
var files = FileAPI.getFiles(input);

// Filter the List
FileAPI.filterFiles(files, function (file/**Object*/, info/**Object*/){
	if( /^image/.test(file.type) && info ){
		return	info.width > 320 && info.height > 240;
	} else {
		return	file.size < 20 * FileAPI.MB;
	}
}, function (list/**Array*/, other/**Array*/){
	if( list.length ){
		// ..
	}
});
```

---

<a name="FileAPI.getDropFiles"></a>
### getDropFiles(evt`:Event|$.Event`, callback`:Function`)`:void`
Get a list of files, including directories.

* evt — `drop` event
* callback — function, takes one argument, a list of files

```js
FileAPI.event.on(document, 'drop', function (evt/**Event*/){
	evt.preventDefault();

	// Get a list of files
	FileAPI.getDropFiles(evt, function (files/**Array*/){
		// ...
	});
});
```

---

<a name="FileAPI.upload"></a>
### upload(opts`:Object`)`:XmlHttpRequest`
Uploading files to the server. Returns XHR-like object.
It is important to remember to correctly worked flash-transport server response body must not be empty,
for example, you can pass, just text "ok".

* opts — options object, see [Upload options](#options)

```js
var el = document.getElementById('my-input');
FileAPI.event.on(el, 'change', function (evt/**Event*/){
	var files = FileAPI.getFiles(evt);
	var xhr = FileAPI.upload({
		url: 'http://rubaxa.org/FileAPI/server/ctrl.php',
		files: { file: files[0] },
		complete: function (err, xhr){
			if( !err ){
				var result = xhr.responseText;
				// ...
			}
		}
	});
});
```

---

<a name="FileAPI.addInfoReader"></a>
### addInfoReader(mime`:RegExp`, handler`:Function`)`:void`
Adds a handler for the collection of information about a file.
See also: FileAPI.getInfo and FileAPI.filterFiles.

* mime — pattern of mime-type
* handler — takes two arguments: `file` object and `complete` function callback

```js
FileAPI.addInfoReader(/^image/, function (file/**File*/, callback/**Function*/){
	// http://www.nihilogic.dk/labs/exif/exif.js
	// http://www.nihilogic.dk/labs/binaryajax/binaryajax.js
	FileAPI.readAsBinaryString(file, function (evt/**Object*/){
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

---

<a name="FileAPI.readAsDataURL"></a>
### readAsDataURL(file`:Object`, callback`:Function`)`:void`
Reading the contents of the specified `File` as `dataURL`.

* file — file object
* callback — function, receives a result

```js
FileAPI.readAsDataURL(file, function (evt/**Object*/){
	if( evt.type == 'load' ){
		// Success
	 	var dataURL = evt.result;
	} else if( evt.type =='progress' ){
		var pr = evt.loaded/evt.total * 100;
	} else {
		// Error
	}
})
```

---

<a name="FileAPI.readAsBinaryString"></a>
### readAsBinaryString(file`:Object`, callback`:Function`)`:void`
Reading the contents of the specified `File` as `BinaryString`.

* file — file object
* callback — function, receives a result

```js
FileAPI.readAsBinaryString(file, function (evt/**Object*/){
	if( evt.type == 'load' ){
		// Success
	 	var binaryString = evt.result;
	} else if( evt.type =='progress' ){
		var pr = evt.loaded/evt.total * 100;
	} else {
		// Error
	}
})
```

---

<a name="FileAPI.readAsArrayBuffer"></a>
### readAsBinaryString(file`:Object`, callback`:Function`)`:void`
Reading the contents of the specified `File` as `ArrayBuffer`.

* file — file object
* callback — function, receives a result

```js
FileAPI.readAsArrayBuffer(file, function (evt/**Object*/){
	if( evt.type == 'load' ){
		// Success
	 	var arrayBuffer = evt.result;
	} else if( evt.type =='progress' ){
		var pr = evt.loaded/evt.total * 100;
	} else {
		// Error
	}
})
```

---

<a name="FileAPI.readAsText"></a>
### readAsText(file`:Object`, callback`:Function`)`:void`
Reading the contents of the specified `File` as `text`.

* file — file object
* callback — function, receives a result

```js
FileAPI.readAsText(file, function (evt/**Object*/){
	if( evt.type == 'load' ){
		// Success
	 	var text = evt.result;
	} else if( evt.type =='progress' ){
		var pr = evt.loaded/evt.total * 100;
	} else {
		// Error
	}
})
```

---

<a name="FileAPI.readAsText-encoding"></a>
### readAsText(file`:Object`, encoding`:String`, callback`:Function`)`:void`
Reading the contents of the specified `File` as `text`.

* encoding — a string indicating the encoding to use for the returned data. By default, UTF-8.

```js
FileAPI.readAsText(file, "utf-8", function (evt/**Object*/){
	if( evt.type == 'load' ){
		// Success
	 	var text = evt.result;
	} else if( evt.type =='progress' ){
		var pr = evt.loaded/evt.total * 100;
	} else {
		// Error
	}
})
```

---


<a name="options" data-name="Upload options"></a>
## Upload options

<a name="options.url"></a>
### url`:String`
A string containing the URL to which the request is sent.

---

<a name="options.data"></a>
### data`:Object`
Additional post data to be sent along with the file uploads.

```js
var xhr = FileAPI.upload({
	url: '...',
	data: { 'session-id': 123 },
	files: { ... },
});
```

---

<a name="options.headers"></a>
### headers`:Object`
Additional request headers, HTML5 only.

```js
var xhr = FileAPI.upload({
	url: '...',
	headers: { 'x-upload': 'fileapi' },
	files: { .. },
});
```

---

<a name="options.chunkSize"></a>
### chunkSize`:Number`
Chunk size in bytes, HTML5 only.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { images: fileList },
	chunkSize: 0.5 * FileAPI.MB
});
```

---

<a name="options.chunkUploadRetry"></a>
### chunkUploadRetry`:Number`
Number of retries during upload chunks, HTML5 only.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { images: fileList },
	chunkSize: 0.5 * FileAPI.MB,
	chunkUploadRetry: 3
});
```

--

<a name="options.imageTransform"></a>
### imageTransform`:Object`
Rules of changes the original image on the client.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { image: imageFiles },
	// Changes the original image
	imageTransform: {
		// resize by max side
		maxWidth: 800,
		maxHeight: 600,
		// Add watermark
		overlay: [{ x: 10, y: 10, src: '/i/watemark.png', rel: FileAPI.Image.RIGHT_BOTTOM }]
	}
});
```

--

<a name="options.imageTransform-multi"></a>
### imageTransform`:Object`
Rules of image transformation on the client, for more images.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { image: imageFiles },
	imageTransform: {
		// resize by max side
		'huge': { maxWidth: 800, maxHeight: 600 },
		// crop & resize
		'medium': { width: 320, height: 240, preview: true },
		// crop & resize + watemark
		'small': {
			width: 100, height: 100,
			// Add watermark
			overlay: [{ x: 5, y: 5, src: '/i/watemark.png', rel: FileAPI.Image.RIGHT_BOTTOM }]
		}
	}
});
```

--

<a name="options.imageTransform-jpeg"></a>
### imageTransform`:Object`
Convert all images to jpeg or png.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { image: imageFiles },
	imageTransform: {
		type: 'image/jpeg',
		quality: 0.86 // jpeg quality
	}
});
```


<a name="options.imageOriginal"></a>
### imageOriginal`:Boolean`
Sent to the server the original image or not, if defined imageTransform option.

--

<a name="options.imageAutoOrientation"></a>
### imageAutoOrientation`:Boolean`
Auto-rotate images on the basis of EXIF.

--

<a name="options.prepare"></a>
### prepare`:Function`
Prepare options upload for a particular file.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	prepare: function (file/**Object*/, options/**Object*/){
		options.data.secret = utils.getSecretKey(file.name);
	}
});
```

--

<a name="options.upload"></a>
### upload`:Function`
Start uploading.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	upload: function (xhr/**Object*/, options/**Object*/){
		// ...
	}
});
```

--

<a name="options.fileupload"></a>
### fileupload`:Function`
Start file uploading.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	uploadfile: function (file/**Object*/, xhr/**Object*/, options/**Object*/){
		// ...
	}
});
```

--

<a name="options.progress"></a>
### progress`:Function`
Callback for upload progress events.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	progress: function (evt/**Object*/, file/**Object*/, xhr/**Object*/, options/**Object*/){
		var pr = evt.loaded/evt.total * 100;
	}
});
```

--

<a name="options.fileprogress"></a>
### fileprogress`:Function`
Callback for upload file progress events.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	fileprogress: function (evt/**Object*/, file/**Object*/, xhr/**Object*/, options/**Object*/){
		var pr = evt.loaded/evt.total * 100;
	}
});
```

--

<a name="options.complete"></a>
### complete`:Function`
Callback for end upload requests.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	complete: function (err/**String*/, xhr/**Object*/, file/**Object/, options/**Object*/){
		if( !err ){
			// All files successfully uploaded.
		}
	}
});
```

--

<a name="options.filecomplete"></a>
### filecomplete`:Function`
Callback for end upload requests.

```js
var xhr = FileAPI.upload({
	url: '...',
	files: { .. }
	filecomplete: function (err/**String*/, xhr/**Object*/, file/**Object/, options/**Object*/){
		if( !err ){
			// File successfully uploaded
			var result = xhr.responseText;
		}
	}
});
```

---

<a name="File"></a>
## File object

<a name="File.name"></a>
### name
The name of the file referenced by the File object.

<a name="File.type"></a>
### type
The type (MIME type) of the file referenced by the File object.

<a name="File.size"></a>
### size
The size (in bytes) of the file referenced by the File object.


---


<a name="FileAPI.event"></a>
## FileAPI.event

<a name="FileAPI.event.on"></a>
### on(el`:HTMLElement`, events`:String`, handler`:Function`)`:void`
Attach an event handler function.

* el — DOM element
* events — one or more space-separated event types.
* handler — A function to execute when the event is triggered.

---

<a name="FileAPI.event.off"></a>
### off(el`:HTMLElement`, events`:String`, handler`:Function`)`:void`
Remove an event handler.

* el — DOM element
* events — one or more space-separated event types.
* handler — a handler function previously attached for the event(s).

---

<a name="FileAPI.event.one"></a>
### one(el`:HTMLElement`, events`:String`, handler`:Function`)`:void`
Attach an event handler function. The handler is executed at most once.

* el — DOM element
* events — one or more space-separated event types.
* handler — a function to execute when the event is triggered.

---

<a name="FileAPI.event.dnd"></a>
### dnd(el`:HTMLElement`, hover`:Function`, handler`:Function`)`:void`
Attach an drag and drop event handler function.

* el — drop zone
* hover — `dragenter` and `dragleave` listener
* handler — `drop` event handler.

```js
var el = document.getElementById('dropzone');
FileAPI.event.dnd(el, function (over){
	el.style.backgroundColor = over ? '#f60': '';
}, function (files){
	if( files.length ){
		// Upload their.
	}
});

// or jQuery
$('#dropzone').dnd(hoverFn, dropFn);
```

---

<a name="FileAPI.event.dnd.off"></a>
### dnd.off(el`:HTMLElement`, hover`:Function`, handler`:Function`)`:void`
Remove an drag and drop event handler function.

* el — drop zone
* hover — `dragenter` and `dragleave` listener
* handler — `drop` event handler.

```js
// Native
FileAPI.event.dnd.off(el, hoverFn, dropFn);

// jQuery
$('#dropzone').dndoff(hoverFn, dropFn);
```

--

<a name="FileAPI.Image"></a>
## FileAPI.Image
Class for working with images

### constructor(file`:Object`)`:void`
The constructor takes a single argument, the `File` object.

* file — the `File` object

```js
FileAPI.Image(imageFile).get(function (err/**String*/, img/**HTMLElement*/){
	if( !err ){
		document.body.appendChild( img );
	}
});
```

---

### crop(width`:Number`, height`:Number`)`:FileAPI.Image`
Crop image by width and height.

* width — new image width
* height — new image height

```js
FileAPI.Image(imageFile)
	.crop(640, 480)
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

### crop(x`:Number`, y`:Number`, width`:Number`, height`:Number`)`:FileAPI.Image`
Crop image by x, y, width and height.

* x — offset from the top corner
* y — offset from the left corner

```js
FileAPI.Image(imageFile)
	.crop(100, 50, 320, 240)
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

### resize(width`:Number`, height`:Number`[, type`:String`])`:FileAPI.Image`
Resize image.

* width — new image width
* height — new image height
* type — enum: `min`, `max`, `preview`. By default `undefined`.

```js
FileAPI.Image(imageFile)
	.resize(320, 240)
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;

// Resize image on by max side.
FileAPI.Image(imageFile)
	.resize(320, 240, 'max')
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

### preview(width`:Number`[, height`:Number`])`:FileAPI.Image`
Crop and resize image.

* width — new image width
* height — new image height

```js
FileAPI.Image(imageFile)
	.preview(100, 100)
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

### rotate(deg`:Number`)`:FileAPI.Image`
Rotate image.

* deg — rotation angle in degrees

```js
FileAPI.Image(imageFile)
	.rotate(90)
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

### filter(callback`:Function`)`:FileAPI.Image`
Apply filter function. Only `HTML5`.

* callback — takes two arguments, `canvas` element and `done` method.

```js
FileAPI.Image(imageFile)
	.filter(function (canvas/**HTMLCanvasElement*/, doneFn/**Function*/){
		// bla-bla-lba
		doneFn();
	})
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```


---

### filter(name`:String`)`:FileAPI.Image`
Uses [CamanJS](http://camanjs.com/), include it before FileAPI library.

* name — CamanJS filter name (custom or preset)

```js
Caman.Filter.register("my-funky-filter", function () {
	// http://camanjs.com/guides/#Extending
});

FileAPI.Image(imageFile)
	.filter("my-funky-filter") // or .filter("vintage")
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

### overlay(images`:Array`)`:FileAPI.Image`
Add overlay images, eg: watermark.

* images — array of overlays

```js
FileAPI.Image(imageFile)
	.overlay([
		// Left corner.
		{ x: 10, y: 10, w: 100, h: 10, src: '/i/watermark.png' },

		// Right bottom corner.
		{ x: 10, y: 10, src: '/i/watermark.png', rel: FileAPI.Image.RIGHT_BOTTOM }
	])
	.get(function (err/**String*/, img/**HTMLElement*/){

	})
;
```

---

### get(fn`:Function`)`:FileAPI.Image`
Get the final image.

* fn — complete callback

---


<a name="const" data-name="Сonst"></a>
## Сonstants

<a name="FileAPI.KB"></a>
### FileAPI.KB`:Number`
1024 bytes

<a name="FileAPI.MB"></a>
### FileAPI.MB`:Number`
1048576 bytes

<a name="FileAPI.GB"></a>
### FileAPI.GB`:Number`
1073741824 bytes

<a name="FileAPI.TB"></a>
### FileAPI.TB`:Number`
1.0995116e+12 bytes

---

<a name="FileAPI.utils"></a>
## Utils

<a name="FileAPI.each"></a>
### FileAPI.each(obj`:Object|Array`, callback`:Function`[, thisObject`:Mixed`])`:void`
Iterate over a object or array, executing a function for each matched element.

* obj — array or object
* callback — a function to execute for each element.
* thisObject — object to use as `this` when executing `callback`.

--

<a name="FileAPI.extend"></a>
### FileAPI.extend(dst`:Object`, src`:Object`)`:Object`
Merge the contents of two objects together into the first object.

* dst — an object that will receive the new properties
* src — an object containing additional properties to merge in.

--

<a name="FileAPI.filter"></a>
### FileAPI.filter(array`:Array`, callback`:Function`[, thisObject`:Mixed`)`:Object`
Creates a new array with all elements that pass the test implemented by the provided function.

* array — original Array
* callback — Function to test each element of the array.
* thisObject — object to use as `this` when executing `callback`.

---

<a name="support"><a/>
## Support
<ul>
	<li>Multiupload: all browsers that support HTML5 or Flash</li>
	<li>Drag'n'Drop upload: files (HTML5) & directories (Chrome 21+)</li>
	<li>Chunked file upload (HTML5)</li>
	<li>Upload one file: all browsers</li>
	<li>
		Working with Images: IE6+, FF 3.6+, Chrome 10+, Opera 11.1+, Safari 5.4+
		<ul>
			<li>crop, resize, preview & rotate (HTML5 or Flash)</li>
			<li>auto orientation by exif (HTML5, if include FileAPI.exif.js or Flash)</li>
		</ul>
	</li>
</ul>

<a name="FileAPI.support.html5"></a>
### FileAPI.support.html5`:Boolean`
HTML5 borwser support

<a name="FileAPI.support.cors"></a>
### FileAPI.support.cors`:Boolean`
This cross-origin resource sharing is used to enable cross-site HTTP requests.

<a name="FileAPI.support.dnd"></a>
### FileAPI.support.dnd`:Boolean`
Drag'n'drop events support.

<a name="FileAPI.support.flash"></a>
### FileAPI.support.flash`:Boolean`
Availability Flash plugin.

<a name="FileAPI.support.canvas"></a>
### FileAPI.support.canvas`:Boolean`
Canvas support.

<a name="FileAPI.support.dataURI"></a>
### FileAPI.support.dataURI`:Boolean`
Support dataURI as src for image.

<a name="FileAPI.support.chunked"></a>
### FileAPI.support.chunked`:Boolean`
Support chuncked upload.

---

<a name="flash"></a>
## Flash

<a name="flash.settings"></a>
### Settings
Flash settings.
It is advisable to place flash on the same server where the files will be uploaded.

```html
<script>
	var FileAPI = {
	 	// @default: "./dist/"
		staticPath: '/js/',

		 // @default: FileAPI.staticPath + "FileAPI.flash.swf"
		flashUrl: '/statics/FileAPI.flash.swf',

		// @default: FileAPI.staticPath + "FileAPI.flash.image.swf"
		flashImageUrl: '/statics/FileAPI.flash.image.swf'
	};
</script>
<script src="/js/FileAPI.min.js"></script>
```

---

<a name="crossdomain.xml"></a>
### crossdomain.xml
Necessarily make this file on the server.
Do not forget to replace `youdomain.com` on the name of your domain.

```xml
<?xml version="1.0"?>
<!DOCTYPE cross-domain-policy SYSTEM "http://www.adobe.com/xml/dtds/cross-domain-policy.dtd">
<cross-domain-policy>
	<site-control permitted-cross-domain-policies="all"/>
	<allow-access-from domain="youdomain.com" secure="false"/>
	<allow-access-from domain="*.youdomain.com" secure="false"/>
	<allow-http-request-headers-from domain="*" headers="*" secure="false"/>
</cross-domain-policy>
```

---

<a name="flash.request"></a>
### request
The following sample HTTP POST request is sent from Flash Player to a server-side script if no parameters are specified:

```xml
POST /server/ctrl.php HTTP/1.1
Accept: text/*
Content-Type: multipart/form-data;
boundary=----------Ij5ae0ae0KM7GI3KM7
User-Agent: Shockwave Flash
Host: www.youdomain.com
Content-Length: 421
Connection: Keep-Alive
Cache-Control: no-cache

------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7
Content-Disposition: form-data; name="Filename"

MyFile.jpg
------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7
Content-Disposition: form-data; name="Filedata"; filename="MyFile.jpg"
Content-Type: application/octet-stream

[[..FILE_DATA_HERE..]]
------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7
Content-Disposition: form-data; name="Upload"

Submit Query
------------Ij5GI3GI3ei4GI3ei4KM7GI3KM7KM7--
```

---

<a name="server"></a>
## Server settings

<a name="server.CORS"></a>
### CORS
Enable CORS.

```php
<?
	// Permitted types of request
    header('Access-Control-Allow-Methods: POST, OPTIONS');

    // Describe custom headers
    header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Range, Content-Disposition, Content-Type');

    // A comma-separated list of domains
    header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);

	// Allow cookie
	header('Access-Control-Allow-Credentials: true');

    if( $_SERVER['REQUEST_METHOD'] == 'OPTIONS' ){
        exit;
    }

    if( $_SERVER['REQUEST_METHOD'] == 'POST' ){
        // ...
    }
```

---

<a name="server.chunked"></a>
### Chunked file upload
Client and server communicate to each other using the following HTTP headers and status codes.<br/>
Client explicitly sets the following headers:<br/>
<ul>
	<li>Content-Range: bytes &lt;start-offset&gt;-&lt;end-offset&gt;/&lt;total&gt;</li>
	<li>Content-Disposition: attachment; filename=&lt;file-name&gt;</li>
</ul>
Any other headers are set by a target browser and are not used by client. Library does not provide any facilities to track a file uniqueness across requests, it's left on developer's consideration.<br/>
Response codes:
<ul>
	<li>200 - last chunk is uploaded</li>
	<li>201 - chunk is successfully saved</li>
	<li>416 - range is not acceptable error, recoverable</li>
	<li>500 - server error, recoverable</li>
</ul>
For recoverable errors server tries to resend chunk `chunkUploadRetry` times then fails.<br/
Response headers:
<ul>
	<li>X-Last-Known-Byte: int, library tries to resend chunk from the given offset. Applicable to response codes 200 and 416</li>
</ul>
All the other codes - fatal error, user's involvement is recommend.

---

<a name="buttons.examples"></a>
## Buttons examples

<a name="buttons.examples.base"></a>
### Base
Simple input[type="file"]

```html
<span class="js-fileapi-wrapper" style="position: relative; display: inline-block;">
    <input name="files" type="file" multiple/>
</span>
```

---

<a name="buttons.examples.button"></a>
### Button
Stylized button.

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
    .upload-btn input {
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
    <input name="files" type="file" multiple />
</div>
```


---


<a name="buttons.examples.link"></a>
### Link
Button like link.

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

    .upload-link input {
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
    <input name="photo" type="file" accept="image/*" />
</a>
```


---


<a name="Changelog"></a>
## Changelog

### 2.0.0
<ul>
	<li>+ FileAPI.Camera (HTML5 and Flash fallback)</li>
	<li>+ jquery.fileapi.js, see <a href="http://rubaxa.github.io/jquery.fileapi/">demo</a></li>
	<li>+ npm support</li>
	<li>+ grunt support</li>
	<li>+ requirejs support</li>
	<li>+ [#80](https://https://github.com/mailru/FileAPI/issues/80): FileAPI.Image.fn.overlay</li>
 	<li>`imageTransform` — now supports: `crop`, `type`, `quality` and `overlay` properties.</li>
	<li>Improved the documentation</li>
	<li>[#121](https://github.com/mailru/FileAPI/issues/121): + FileAPI.`postNameConcat:Function(name, idx)`</li>
	<li>[#116](https://github.com/mailru/FileAPI/issues/116): + `cache:false` option for FileAPI.upload</li>
</ul>


### 1.2.6
<ul>
	<li>[#91](https://github.com/mailru/FileAPI/issues/91): replace `new Image` to `FileAPI.newImage`</li>
	<li>+ FileAPI.withCredentials: true</li>
	<li>[#90](https://github.com/mailru/FileAPI/issues/90): Fixed `progress` event</li>
	<li>[#105](https://github.com/mailru/FileAPI/issues/105): Fixed `image/jpg` -> `image/jpeg`</li>
	<li>[#108](https://github.com/mailru/FileAPI/issues/108): Check width/height before resize by type(min/max)</li>
</ul>


### 1.2.5
<ul>
	<li>[#86](https://github.com/mailru/FileAPI/issues/86): Smarter upload recovery</li>
	<li>[#87](https://github.com/mailru/FileAPI/issues/87): Fixed upload files into browsers that do not support FormData</li>
	<li>Fixed support "accept" attribute for Flash.</li>
	<li>Fixed detection of HTML5 support for FireFox 3.6</li>
	<li> + FileAPI.html5 option, default "true"</li>
</ul>


### 1.2.4
<ul>
	<li>Fixed auto orientation image by EXIF (Flash)</li>
	<li>Fixed image dimensions after rotate (Flash)</li>
	<li>[#82](https://github.com/mailru/FileAPI/issues/82): "undefined" data-fields cause exceptions</li>
	<li>[#83](https://github.com/mailru/FileAPI/issues/83): Allow requests without files</li>
	<li>[#84](https://github.com/mailru/FileAPI/pull/84): Fixed connection abort when waiting for connection recovery</li>
</ul>


### 1.2.3
<ul>
	<li>[#77](https://github.com/mailru/FileAPI/pull/77): Fixed flash.abort(), [#75](https://github.com/mailru/FileAPI/issues/75)</li>
	<li>- `FileAPI.addMime`</li>
	<li>+ `FileAPI.accept` — fallback for flash.</li>
</ul>


### 1.2.2
<ul>
	<li>[#67](https://github.com/mailru/FileAPI/pull/67): Added correct httpStatus for upload fail, [#62](https://github.com/mailru/FileAPI/pull/68)</li>
	<li>[#68](https://github.com/mailru/FileAPI/pull/68) Added "Content-Type" for chunked upload, [#65](https://github.com/mailru/FileAPI/pull/65)</li>
	<li>[#69](https://github.com/mailru/FileAPI/issues/69): Fixed network down recovery</li>
	<li>Fixed progress event, [#66](https://github.com/mailru/FileAPI/issues/66)</li>
	<li>Increase flash stage size, [#73](https://github.com/mailru/FileAPI/pull/73)</li>
	<li>- array index from POST-param "name", [#72](https://github.com/mailru/FileAPI/issues/72)</li>
	<li>- dependency on FileAPI.Image for FileAPI.Flash</li>
</ul>


### 1.2.1
<ul>
	<li>[#64](https://github.com/mailru/FileAPI/issues/64): Bufixed for [#63](https://github.com/mailru/FileAPI/issues/63)</li>
</ul>


### 1.2.0
<ul>
	<li>[#57](https://github.com/mailru/FileAPI/issues/57): Chunked file upload</li>
</ul>


### 1.1.0
<ul>
	<li>[#54](https://github.com/mailru/FileAPI/issues/54): added `FileAPI.flashUrl` and `FileAPI.flashImageUrl`</li>
</ul>


### 1.0.1
<ul>
	<li>[#51](https://github.com/mailru/FileAPI/issues/51): remove circular references from `file-objects` (Flash transport)</li>
	<li>added `changelog`</li>
</ul>


### 1.0.0
<ul>
	<li>first release</li>
</ul>
