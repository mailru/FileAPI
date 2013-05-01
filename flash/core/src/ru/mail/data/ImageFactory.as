package ru.mail.data
{
	import by.blooddy.crypto.Base64;
	
	import flash.display.BitmapData;
	import flash.events.EventDispatcher;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	import flash.net.URLRequest;
	import flash.utils.ByteArray;
	
	import ru.mail.commands.DecodeBytesToBitmapCommand;
	import ru.mail.commands.LoadFileCommand;
	import ru.mail.commands.ResizeFileCommand;
	import ru.mail.commands.graphicloader.SimpleGraphicLoader;
	import ru.mail.commands.graphicloader.events.GraphicLoaderCompleteEvent;
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.data.vo.FileVO;
	import ru.mail.data.vo.IFileVO;
	import ru.mail.data.vo.ImageTransformVO;
	import ru.mail.data.vo.OverlayVO;
	import ru.mail.events.DecodeBytesToBitmapCompleteEvent;
	import ru.mail.events.ImageTransformCompleteEvent;
	import ru.mail.utils.ExifReader2;
	import ru.mail.utils.LoggerJS;

	/**
	 * Produces images from file's source
	 * 
	 * If file is not loaded, load it
	 * and create transformed image
	 *  
	 * @author v.demidov
	 * 
	 */	
	public class ImageFactory extends EventDispatcher implements IImageFactory 
	{
		private var file:IFileVO;

		private var loadCommand:LoadFileCommand;

		private var isFileLoaded:Boolean = false;
		private var isOverlayLoaded:Boolean = false;

		public function ImageFactory(target:IFileVO)
		{
			if (!target) {
				throw new Error("{ImageFactory} - init: target is null");
			}

			file = target;
		}

		public function createImage(imageTransform:ImageTransformVO):void {
			isFileLoaded = false;
			isOverlayLoaded = false;

			if (!file.fileData) {
				// first load file
				if( file is FileVO) {
					var loadFileCommand:LoadFileCommand = (file as FileVO).loadCommand? (file as FileVO).loadCommand as LoadFileCommand : new LoadFileCommand(file as FileVO);

					loadFileCommand.addEventListener(ImageTransformCompleteEvent.TYPE, function(event:ImageTransformCompleteEvent):void{
						event.currentTarget.removeEventListener(event.type, arguments.callee);
						trace ("loadCommand complete", event.isSuccess);
						LoggerJS.log('ImageFactory loadFile complete, success '+ event.isSuccess);
						loadCommand = null;
						if(event.isSuccess) {
							onLoadImageAndOverlay(true, imageTransform);
						}
						else {
							complete( false, event.data, event.error );
						}
					});
					LoggerJS.log('ImageFactory loadFile');
					if (!(file as FileVO).loadCommand)
						loadFileCommand.execute();
					(file as FileVO).loadCommand = loadFileCommand;
				}
			}
			else {
				onLoadImageAndOverlay(true, imageTransform);
			}

			// check overlay
			if ( imageTransform && imageTransform.overlay ) {
				// todo: wait for all overlay images to load and then proceed
				var overlayLoadCounter:int = 0;
				var overlay:OverlayVO;
				
				for (var i:uint = 0; i < imageTransform.overlay.length; i++) {
					overlay = imageTransform.overlay[i];
					overlayLoadCounter++;
					
					LoggerJS.log('overlay.src : '+overlay.src);
					if ( overlay.src.match(/^data:/) ) {
						// base64 string, just encode it to image
						var bytes:ByteArray = Base64.decode(overlay.src);
						// ByteArray to BitmapData
						var decodeCommand:DecodeBytesToBitmapCommand = new DecodeBytesToBitmapCommand( bytes );
						decodeCommand.addEventListener(DecodeBytesToBitmapCompleteEvent.TYPE, function(event:DecodeBytesToBitmapCompleteEvent):void {
							event.currentTarget.removeEventListener(event.type, arguments.callee);
							trace ("bitmap created, isSuccess", event.isSuccess);
							if (event.isSuccess) {
								overlay.imageData = new BitmapData( event.decodedBitmap.width, event.decodedBitmap.height );
								overlay.imageData.copyPixels( event.decodedBitmap.bitmapData
									, new Rectangle( 0, 0, event.decodedBitmap.width, event.decodedBitmap.height ), new Point( 0, 0 ));
								event.decodedBitmap.bitmapData.dispose();
							}
							else {
								LoggerJS.log('load overlay base64 error: '+event.error);
							}
							
							if (--overlayLoadCounter < 1){
								onLoadImageAndOverlay(false, imageTransform);
							}
						});
						decodeCommand.execute();
						
					}
					else {
						// load image from url
						// 1. load bytes
						var loadOverlayLoader:SimpleGraphicLoader = new SimpleGraphicLoader(10);
						loadOverlayLoader.addEventListener(GraphicLoaderCompleteEvent.TYPE, function(event:GraphicLoaderCompleteEvent):void {
							event.currentTarget.removeEventListener(event.type, arguments.callee);
							LoggerJS.log('ImageFactory load overlay image, success: '+event.isSuccess);
							if (event.isSuccess && event.content != null) {
								overlay.imageData = new BitmapData( event.content.width, event.content.height );
								overlay.imageData.copyPixels( event.content.bitmapData
									, new Rectangle( 0, 0, event.content.width, event.content.height ), new Point( 0, 0 ));
								event.content.bitmapData.dispose();
								LoggerJS.log('ImageFactory load overlay image success, overlay image: w='+overlay.imageData.width+', h='+overlay.imageData.height);
							} else {
								LoggerJS.log('ImageFactory load overlay image error: '+event.error);
							}
							if (--overlayLoadCounter < 1){
								onLoadImageAndOverlay(false, imageTransform);
							}
						});
						LoggerJS.log('ImageFactory load overlay image, src = '+overlay.src);
						loadOverlayLoader.loadGraphic(new URLRequest(overlay.src));
						// 2. bitmapData
					}
				}
				
				if (overlayLoadCounter < 1) 
					onLoadImageAndOverlay(false, imageTransform);
			} else {
				LoggerJS.log('ImageFactory no overlay provided');
				onLoadImageAndOverlay(false, imageTransform);
			}
		}

		public function readExif():Object {
			if (!file.fileData) {
				return null;
			}

			var exif:Object = {};
			try {
				var exifReader:ExifReader2 = new ExifReader2();
				exifReader.processData(file.fileData);
				if ( exifReader.hasKey("Orientation") ) {
					// more info about orientation
					// http://sylvana.net/jpegcrop/exif_orientation.html
					var orientation:uint = uint(exifReader.getValue("Orientation"));

					exif["Orientation"] = orientation;
				}

			} catch (e:Error) {
				trace ("read exif error: "+ e);
			}
			return exif;
		}

		private function onLoadImageAndOverlay(isFile:Boolean, imageTransform:ImageTransformVO):void
		{
			if (isFile)
				isFileLoaded = true;
			else 
				isOverlayLoaded = true;
			
			if (isFileLoaded && isOverlayLoaded) {
				checkImageData(imageTransform);
			}
		}

		/**
		 * 1/2 Check if imageData has been loaded 
		 * @param imageTransform
		 * 
		 */		
		private function checkImageData(imageTransform:ImageTransformVO):void 
		{
			if (!file.imageData) {
				// init image
				var decodeCommand:DecodeBytesToBitmapCommand = new DecodeBytesToBitmapCommand( file.fileData );
				decodeCommand.addEventListener(DecodeBytesToBitmapCompleteEvent.TYPE, function(event:DecodeBytesToBitmapCompleteEvent):void {
					event.currentTarget.removeEventListener(event.type, arguments.callee);
					trace ("bitmap created, isSuccess", event.isSuccess);
					LoggerJS.log('ImageFactory bitmap created, success '+ event.isSuccess);
					if (event.isSuccess) {
						file.imageData = new BitmapData( event.decodedBitmap.width, event.decodedBitmap.height );
						file.imageData.copyPixels( event.decodedBitmap.bitmapData
							, new Rectangle( 0, 0, event.decodedBitmap.width, event.decodedBitmap.height ), new Point( 0, 0 ));
						event.decodedBitmap.bitmapData.dispose();

						createImageFromSource(imageTransform);
					}
					else {
						complete( false, null, event.error );
					}
				});
				LoggerJS.log('ImageFactory create Bitmap');
				decodeCommand.execute();
			}
			else {
				createImageFromSource(imageTransform);
			}
		}

		/**
		 * 2/2 transform original imagedata 
		 * @param imageTransform
		 * 
		 */		
		private function createImageFromSource(imageTransform:ImageTransformVO):void 
		{
			if (imageTransform == null) {
				// dispatch event with source
				complete(true, file.fileData);
			}
			else {
				// transform then dispatch
				var resizeCommand:ResizeFileCommand = new ResizeFileCommand(file, imageTransform);
				
				resizeCommand.addEventListener(ImageTransformCompleteEvent.TYPE, function(event:ImageTransformCompleteEvent):void {
					event.currentTarget.removeEventListener(event.type, arguments.callee);
					LoggerJS.log('ImageFactory resize complete, success '+ event.isSuccess);
					if (event.isSuccess) {
						complete(true, event.data);
					}
					else {
						complete(false, null, event.error);
					}
				});
				LoggerJS.log('ImageFactory resize');
				resizeCommand.execute();
			}
		}

		private function complete(isSuccess:Boolean, data:ByteArray, error:ErrorVO = null):void
		{
			trace ("imageFactory complete");
			dispatchEvent( new ImageTransformCompleteEvent( isSuccess, data, error ) );
		}
	}
}