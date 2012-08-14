# FileAPI — a set of tools for working with files.


## Example
```html
<span style="position: relative;">
	<input id="user-files" type="file" multiple />
</span>

<div id="preview-list">
</div>
```
```js
var userFiles = document.getElementById('user-files');
var previewList = document.getElementById('preview-list');

FileAPI.event.on(userFiles, 'change', function (evt){
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
						previewList.appendChild(image);
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
			complete: function (status, xhr){
				// ...
			}
		});
	});
});
```


### API
* FileAPI.getFiles(`source:HTMLInput|Event`)`:Array`
* FileAPI.getFileInfo(`file:File`, `callback:function`)
* FileAPI.readAsImage(`file:File`, `callback:function`)
* FileAPI.readAsDataURL(`file:File`, `callback:function`)
* FileAPI.readAsBinaryString(`file:File`, `callback:function`)


### Utilities
* FileAPI.support.html5:Boolean
* FileAPI.event.on(`el:HTMLElement`, `eventType:String`, `fn:Function`)
* FileAPI.event.off(`el:HTMLElement`, `eventType:String`, `fn:Function`)
* FileAPI.event.one(`el:HTMLElement`, `eventType:String`, `fn:Function`)
* FileAPI.each(`obj:Object|Array`, `fn:function`, `context:Mixed`)
* FileAPI.extend(`dst:Object`, `src:Object`)`:Object`
* FileAPI.getFiles(`input:HTMLInputElement`)`:Array`


* FileAPI.`canvas:Boolean`
* FileAPI.isFile(`file:Mixed`)`:Boolean`
* FileAPI.toImage(`elem:Image|Canvas`)`:Image`
* FileAPI.toDataURL(`elem:Image|Canvas`)`:String`
* FileAPI.toBinaryString(`val:String|Image|Canvas`)`:String`
* FileAPI.upload(`options:Object`)`:TransportObject`
* FileAPI.load(`url:String`, `fn:Function`)`:XMLHttpRequest`
* FileAPI.reset(`input:Element`)`:CloneInputElement`
* FileAPI.crop(`elem:Image|Canvas`, `sx:Number`, `sy:Number`, `width:Number`, `height:Number`)`:Canvas`
* FileAPI.rotate(`elem:Image|Canvas`, `deg:Number`)`:Canvas`
* FileAPI.resize(`elem:Image|Canvas`, `width:Number`, `height:Number`)`:Canvas`
* FileAPI.resizeByMax(`elem:Image|Canvas`, `max:Number`)`:Canvas`



### File object (https://developer.mozilla.org/en/DOM/File)
```js
{
	name: 'fileName',
	type: 'mime-type',
	size: 'fileSize'
}
```


### Event object
```js
{
	type:   'abort|error|progress|load',
	result: '...',
	lengthComputable: Boolean,
	loaded: Number,
	total: Number
}
```


### Event object (FileAPI.load)
```js
{
	type:   'error|progress|load',
	result: {
		name: String,
		type: String,
		size: Number,
		dataURL: String
	},
	lengthComputable: Boolean,
	loaded: Number,
	total: Number
}
```


### TransportObject
```js
{
	status: Number,
	statusText: Number,
	readyState: Number,
	response: Blob,
	responseXML: XML,
	responseText: String,
	responseBody: String,
	getResponseHeader: function (name/*:String*/)/*:String*/{},
	getAllResponseHeaders: function ()/*:Object*/{},
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
 __HEADERS[key]=value
&foo=bar
&num=1234
&input=...
&callback=...
```

#### POST-response
```php
<script type="text/javascript">
(function (ctx, name){
	if( ctx && ctx[name] ){
		ctx[name](<?=$statusCode/*200 — OK*/?>, <?=$resultOrStatusText?>);
	}
})(this.parent, <?=$_POST['callback']?>);
</script>
```
