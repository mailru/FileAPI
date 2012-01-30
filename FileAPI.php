<?php
	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
	header('Access-Control-Allow-Headers: Origin, X-Requested-With');


	if( $_SERVER['REQUEST_METHOD'] == 'OPTIONS' ){
		exit;
	}

	if( strtoupper($_SERVER['REQUEST_METHOD']) == 'POST' ){
		var_dump($_REQUEST);
		var_dump($_FILES);
		exit;
	}
?>
<!DOCTYPE html>
<html>
<head>

	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title>FileAPI :: tests</title>

	<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7/jquery.min.js" type="text/javascript"></script>
	<script src="./FileAPI.js" type="text/javascript"></script>
	<script src="./FileAPI.image.js" type="text/javascript"></script>
	<script src="./FileAPI.flash.js" type="text/javascript"></script>

</head>
<body>
	<div id="__FileAPI__"></div>

	<form id="MyForm">
		<div>one: <span style="position: relative"><input value="" type="file" name="one" /></span></div>
		<div>multiple: <span style="position: relative"><input value="" type="file" name="multiple" multiple="multiple" /></span></div>
	</form>

	<div id="Preview" style="margin: 10px; padding: 10px; border: 1px solid red;"></div>
	<div id="Log" style="margin: 10px; padding: 10px; border: 1px solid green;"></div>

	<script type="text/javascript">
		$('#MyForm input').change(function (){
			var input = this, files = this.files;

			$.each(files, function (i, file){
				FileAPI.readAsDataURL(file, function (evt){
					if( evt.type == 'load' ){
						var size = FileAPI.toBinaryString(evt.result).length;
						console[(file.size == size ? 'info' : 'error')]('FileAPI.readAsDataURL ... OK')
					} else {
						console.log('readAsDataURL:', evt.type);
					}
				});

				FileAPI.readAsBinaryString(file, function (evt){
					if( evt.type == 'load' ){
						console[(file.size == evt.result.length ? 'info' : 'error')]('FileAPI.readAsBinaryString ... OK')
					} else {
						console.log('readAsBinaryString:', evt.type);
					}
				});

				if( /image/.test(file.type) ) FileAPI.readAsImage(file, function (evt){
					if( evt.type == 'load' ){
						var canvas = evt.result; // ImageElement

						if( canvas.width > 400 && canvas.height > 400 ){
							canvas  = FileAPI.crop(canvas, 0, 0, 400, 400);
						}

						canvas  = FileAPI.resizeByMax(canvas, 300);
						canvas  = FileAPI.rotate(canvas, 90);

						$(canvas)
							.prependTo('#Preview')
							.css({ opacity: 0 })
							.animate({ opacity: 1 }, 'fast')
						;
					}
				});
			});

			/**/
			FileAPI.upload({
				url: 'FileAPI.php',
				data: {
				    'num': 10,
				    'str': "foo",
				    'input[]': input,
					'files[]': files
				},
				success: function (result){
					document.getElementById('Log').innerHTML = '<pre style="font-size: 11px;">'+result+'</pre>';
				}
			});
			/**/

			FileAPI.reset(input);
		});


		FileAPI.load('./html5.png', function (evt){
			if( evt.type == 'load' ){
				var file = evt.result;
				$(new Image)
					.attr({ src: file.dataURL, title: file.name +' ('+ file.type +', '+ file.size +')' })
					.appendTo('#Preview')
					.css({ opacity: 0 })
					.animate({ opacity: 1 }, 'fast')
				;
			}
		});


		if( !FileAPI.support ) FileAPI.onselect(function (files, node){

			FileAPI.each(files, function (file){

				if( /image/.test(file.type) ){
					FileAPI.readAsImage(file, function (evt){
						if( evt.type == 'load' ){
							var canvas = evt.result;
							$(canvas)
								.prependTo('#Preview')
								.css({ opacity: 0 })
								.animate({ opacity: 1 }, 'fast')
							;
						}
					});
				}

			});

		});
	</script>

</body>
</html>
