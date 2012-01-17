# FileAPI — a set of tools for working with files.

## Support
* full `FF 3.6+, Chrome 13+, Safari 6+, Opera 11.6+`
* iframe `all`

### Descriptions
* FileAPI.`support:Boolean`
* FileAPI.`canvas:Boolean`
* FileAPI.each(`obj:Object|Array`, `fn:function`, `context:Mixed`)
* FileAPI.extend(`dst:Object`, `src:Object`)`:Object`
* FileAPI.isFile(`file:Mixed`)`:Boolean`
* FileAPI.toImage(`elem:Image|Canvas`)`:Image`
* FileAPI.toDataURL(`elem:Image|Canvas`)`:String`
* FileAPI.toBinaryString(`val:String|Image|Canvas`)`:String`
* FileAPI.readAsImage(`file:File|Image|Canvas`, `callback:function`)
* FileAPI.readAsDataURL(`file:File|Image|Canvas`, `callback:function`)
* FileAPI.readAsBinaryString(`file:File|Image|Canvas`, `callback:function`)
* FileAPI.upload(`options:Object`)`:TransportObject`
* FileAPI.reset(`input:Element`)`:CloneInputElement`
* FileAPI.crop(`elem:Image|Canvas`, `sx:Number`, `sy:Number`, `width:Number`, `height:Number`)`:Canvas`
* FileAPI.rotate(`elem:Image|Canvas`, `deg:Number`)`:Canvas`
* FileAPI.resize(`elem:Image|Canvas`, `width:Number`, `height:Number`)`:Canvas`
* FileAPI.resizeByMax(`elem:Image|Canvas`, `max:Number`)`:Canvas`


### Examples
```js
document.getElementById('FileInputId').addEventListener('change', function (evt){
	var input   = evt.target;
	var files   = input.files;

	FileAPI.each(files, function (file){

		FileAPI.readAsDataURL(file, function (evt){
			if( evt.type == 'load' ){
				evt.result; // dataURL
			} else {
				// read error
			}
		});


		FileAPI.readAsBinaryString(file, function (evt){
			if( evt.type == 'load' ){
				evt.result; // BinaryString
			} else {
				// read error
			}
		});


		if( /image/.test(file.type) ){
			FileAPI.readAsImage(file, function (evt){
				if( evt.type == 'load' ){
					var image   = evt.result; // ImageElement
					var canvas  = FileAPI.resizeByMax(image, 300); // CanvasElement
					canvas      = FileAPI.rotate(canvas, 90);

					document.getElementById('PreviewImages').appendChild(canvas);
				} else {
					// error
				}
			});
		}
	});


	FileAPI.upload({
		url: '...', // upload url
		headers: { }, // custom headers
		data: {
			"foo": "bar",
			"num": 1234,
			"input": input,
			"files[]": files,
			"images[]": {
				name: "my-image-0.png",
				data: "...BinaryString..."
			},
			"images[]": {
				name: "my-image-1.png",
				data: document.getElementById('MyImageId')
			}
		},
		success: function (result/*:String*/){},
		error: function (status, xhr/*:TransportObject*/){},
		complete: function (xhr/*:TransportObject*/, statusText/*:String*/){}
	});
}, true);
```

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


### TransportObject
```js
{
	status: Number,
	statusText: Number,
	readyState: Number,
	response: Blob,
	responseXML: XML,
	responseText: String,
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
