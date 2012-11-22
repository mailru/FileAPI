package ru.mail.data
{
	import flash.display.BitmapData;
	import flash.events.EventDispatcher;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	import flash.utils.ByteArray;
	
	import ru.mail.commands.DecodeBytesToBitmapCommand;
	import ru.mail.commands.LoadFileCommand;
	import ru.mail.commands.ResizeFileCommand;
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.data.vo.FileVO;
	import ru.mail.data.vo.IFileVO;
	import ru.mail.data.vo.ImageTransformVO;
	import ru.mail.events.DecodeBytesToBitmapCompleteEvent;
	import ru.mail.events.ImageTransformCompleteEvent;
	import ru.mail.utils.ExifReader2;

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
		
		public function ImageFactory(target:IFileVO)
		{
			if (!target) {
				throw new Error("{ImageFactory} - init: target is null");
			}
			
			file = target;
		}
		
		public function createImage(imageTransform:ImageTransformVO):void {
			if (!file.fileData) {
				// first load file
				if( file is FileVO) {
					var loadFileCommand:LoadFileCommand = (file as FileVO).loadCommand? (file as FileVO).loadCommand as LoadFileCommand : new LoadFileCommand(file as FileVO);
					
					loadFileCommand.addEventListener(ImageTransformCompleteEvent.TYPE, function(event:ImageTransformCompleteEvent):void{
						event.currentTarget.removeEventListener(event.type, arguments.callee);
						trace ("loadCommand complete", event.isSuccess);
						loadCommand = null;
						if(event.isSuccess) {
							checkImageData(imageTransform);
						}
						else {
							complete( false, event.data, event.error );
						}
					});
					if (!(file as FileVO).loadCommand)
						loadFileCommand.execute();
					(file as FileVO).loadCommand = loadFileCommand;
				}
			}
			else {
				checkImageData(imageTransform);
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
					if (event.isSuccess) {
						file.imageData = event.decodedBitmap.bitmapData;
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
					if (event.isSuccess) {
						complete(true, event.data);
					}
					else {
						complete(false, null, event.error);
					}
				});
				
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