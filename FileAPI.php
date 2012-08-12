<?php
	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
	header('Access-Control-Allow-Headers: Origin, X-Requested-With');


	if( $_SERVER['REQUEST_METHOD'] == 'OPTIONS' ){
		exit;
	}

	if( strtoupper($_SERVER['REQUEST_METHOD']) == 'POST' ){
		$files = array();
		foreach ($_FILES as $firstNameKey => $arFileDescriptions) {
			foreach ($arFileDescriptions as $fileDescriptionParam => $mixedValue) {
				rRestructuringFilesArray($files,
										 $firstNameKey,
										 $_FILES[$firstNameKey][$fileDescriptionParam],
										 $fileDescriptionParam);
			}
		}

		$images = array();
		fetchImages($files, $images);

		echo json_encode(array(
			  'images'	=> $images
			, 'data'	=> print_r(array(
							  '_REQUEST'	=> $_REQUEST
							, '_FILES'		=> $files
						), true)
		));
		exit;
	}


	// http://www.php.net/manual/ru/reserved.variables.files.php#106558
	function rRestructuringFilesArray(&$arrayForFill, $currentKey, $currentMixedValue, $fileDescriptionParam){
		if (is_array($currentMixedValue)) {
			foreach ($currentMixedValue as $nameKey => $mixedValue) {
				rRestructuringFilesArray($arrayForFill[$currentKey],
										 $nameKey,
										 $mixedValue,
										 $fileDescriptionParam);
			}
		} else {
			$arrayForFill[$currentKey][$fileDescriptionParam] = $currentMixedValue;
		}
	}

	function fetchImages($files, &$images){
		if( isset($files['tmp_name']) ){
			$filename	= $files['tmp_name'];
			list($mime)	= explode(';', mime_content_type($filename));

			if( strpos($mime, 'image') !== false ){
				$content	= file_get_contents($filename);
				$images[]	= 'data:'. $mime .';base64,'. base64_encode($content);
			}
		}
		else {
			foreach( $files as $file ){
				fetchImages($file, $images);
			}
		}
	}
?>
<!DOCTYPE html>
<html>
<head>

	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title>FileAPI :: TEST</title>

	<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>

	<script src="./canvas-to-blob.js" type="text/javascript"></script>
	<script src="./FileAPI.js" type="text/javascript"></script>
	<script src="./FileAPI.html5.js" type="text/javascript"></script>
	<script src="./FileAPI.XHR.js" type="text/javascript"></script>
	<script src="./FileAPI.Form.js" type="text/javascript"></script>
	<script src="./FileAPI.Image.js" type="text/javascript"></script>
	<script src="./FileAPI.Flash.js" type="text/javascript"></script>

</head>
<body>
	<div id="__FileAPI__" style="position: absolute; left: 0; top: 0; width: 1px; height: 1px; background: rgba(255,0,0,.4); z-index: 20000;"></div>

	<form id="MyForm">
		<div>one: <span style="position: relative"><input value="" type="file" name="one" /></span></div>
		<div>multiple: <span style="position: relative"><input value="" type="file" name="multiple" multiple="multiple" /></span></div>
	</form>

	<div id="Preview" style="margin: 10px; padding: 10px; border: 1px solid red;"></div>
	<div id="Log" style="margin: 10px; padding: 10px; border: 1px solid green;"></div>

	<script type="text/javascript">
		$(':file').on('change', function (evt){
			var input = evt.target, files = FileAPI.getFiles(evt);

			console.log('onChange:', files);

			FileAPI.getFiles(files, function (file, info){
				// filter function
				if( /image/.test(file.type) && info ){
					return	info.width > 100 || info.height > 100;
				}
				else {
					return	file.size > 512;
				}
			}, function (files, deleted){
				// result function
				console.log(files, deleted);

				FileAPI.each(files, function (file){
					if( /image/.test(file.type) ){
						// Create preview
						console.log('Create preview')

						FileAPI.Image(file)
							.preview(120)
							.get(function (err, image){
								$(image)
									.prependTo('#Preview')
									.css({ opacity: 0 })
									.animate({ opacity: 1 }, 'fast')
								;
							})
						;
					}
				});


				/* Upload file */
				var xhr = FileAPI.upload({
					url: 'FileAPI.php',
					data: {
						  num: 10
						, str: "foo"
					},
					files: {
						  photos: FileAPI.filter(files, function (file){ return /image/.test(file.type); })
						, other: FileAPI.filter(files, function (file){ return !/image/.test(file.type); })
					},
					imageOriginal: false,
					imageTransform: {
						  maxWidth: 320
						, maxHeight: 240
					},
					_imageTransform: {
						'max1024': {
							// resize by max Side
							  maxWidth: 1024
							, maxHeight: 800
						},
						'1000x1000': {
							// resize image
							  width: 1000
							, height: 1000
						},
						'min800': {
							  minWidth: 800
							, minHeight: 600
						},
						'preview': {
							// create preview
							  width: 100
							, height: 100
							, preview: true

						},
						'custom': function (image, transform){
							if( image.width > 500 ){
								transform
									.crop(500, 500)
									.resize(225)
									.rotate(90)
								;
							}
						}
					},
					beforeupload: function (){ console.log('beforeupload:', arguments) },
					upload: function (){ console.log('upload:', arguments) },
					fileupload: function (){ console.log('fileupload:', arguments) },
					fileprogress: function (){ console.log('fileprogress:', arguments) },
					filecomplete: function (status, xhr){
						console.log('filecomplete:', arguments);
						var result = JSON.parse(xhr.responseText);
						FileAPI.each(result.images, function (dataURL){
							$(new Image)
								.attr('src', dataURL)
								.appendTo('body')
							;
						});
						document.getElementById('Log').innerHTML += '<pre style="font-size: 11px;">'+result.data+'</pre>';
					},

					progress: function (){ console.log('progress:', arguments) },
					complete: function (status, xhr){
						console.log('complete:', arguments);
					}
				});
				/**/
			});

			FileAPI.reset(input);
		});


		FileAPI.load('./html5.png', function (evt){
			if( evt.type == 'load' ){
				var file = evt.result;
				FileAPI.Image(file)
					.resize(100, true)
					.rotate(90)
					.get(function (err, image){
						$(image)
							.attr({ title: file.name +' ('+ file.type +', '+ file.size +')' })
							.appendTo('#Preview')
							.css({ opacity: 0 })
							.animate({ opacity: 1 }, 'fast')
						;
					})
				;
			}
		});
	</script>

</body>
</html>
