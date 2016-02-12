package ru.mail.commands
{
	import by.blooddy.crypto.image.JPEGEncoder;
	import by.blooddy.crypto.image.PNG24Encoder;
	
	import flash.display.BitmapData;
	import flash.events.EventDispatcher;
	import flash.geom.ColorTransform;
	import flash.geom.Matrix;
	import flash.geom.Rectangle;
	import flash.utils.ByteArray;
	
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.data.vo.IFileVO;
	import ru.mail.data.vo.ImageTransformVO;
	import ru.mail.data.vo.OverlayVO;
	import ru.mail.events.ImageTransformCompleteEvent;
	import ru.mail.utils.LoggerJS;

	/**
	 * Resize and rotate image using imageTransform object 
	 * 
	 * file must be loaded before transforming. 
	 *
	 * JPG and PNG will keep their extensions after transform.
	 * GIF and BMP will be encoded as PNG, so uploaded filename will be .png
	 * 
	 * The possible solution is to transform them but save as PNG, but we also have to change the uploaded file extension to png. 
	 * 
	 * @author v.demidov
	 * 
	 */	
	public class ResizeFileCommand extends EventDispatcher
	{
		private var file:IFileVO
		private var imageTransform:ImageTransformVO
		
		public function ResizeFileCommand( file:IFileVO, imageTransform:ImageTransformVO )
		{
			super();
			
			this.file = file;
			this.imageTransform = imageTransform;
		}
		
		public function execute():void
		{
			if( !file.imageData ) {
				complete(false, null, new ErrorVO("ResizeImageCommand - cannot resize file because it has not been succesfully loaded") );
				return;
			}
			
			if (!needResize()) {
				LoggerJS.log('ResizeImageCommand no need to resize');
				complete(true, file.fileData);
				return;
			}
			
			var fileType:String = file.fileType;
			
			checkTransform();
			
			transformImage();
		}
		
		public function cancel():void 
		{
			
		}
		
		/**
		 * check imageTransform if it really transforms image 
		 * @return true if we need to transform
		 */		
		private function needResize():Boolean {
			if ( imageTransform.sx == imageTransform.sy == 0 
				&& imageTransform.sw == file.imageData.width
				&& imageTransform.sh == file.imageData.height
				&& imageTransform.dw == imageTransform.sw
				&& imageTransform.dh == imageTransform.sh
				&& imageTransform.deg == 0
				&& imageTransform.type == ImageTransformVO.TYPE_PNG
				&& imageTransform.quality == 1
				&& imageTransform.overlay.length == 0
				) 
			{
				// transformed image equals original
				return false;
			}
			return true;
		}
		
		/**
		 * Set default values if no value 
		 */		
		private function checkTransform():void {
			if (imageTransform.sw == 0)
				imageTransform.sw = file.imageData.width - imageTransform.sx;
			if (imageTransform.sh == 0)
				imageTransform.sh = file.imageData.height - imageTransform.sy;
			if (imageTransform.dw == 0)
				imageTransform.dw = imageTransform.sw;
			if (imageTransform.dh == 0)
				imageTransform.dh = imageTransform.sh;
		}
		
		private function transformImage():void
		{
			try
			{
				LoggerJS.log('ResizeFileCommand tranform image');
				var fullImageMap:BitmapData = file.imageData; //shortcut
				var matrix:Matrix;
				var currentImageMap:BitmapData;
				var resizedImageMap:BitmapData;
				
				// =============
				// crop
				if ( imageTransform.sx != 0 || imageTransform.sy != 0 
					|| imageTransform.sw != fullImageMap.width || imageTransform.sh != fullImageMap.height )
				{
					matrix = new Matrix();
					matrix.identity();
					matrix.translate( -1*Math.round(imageTransform.sx), -1*Math.round(imageTransform.sy) );
					
					currentImageMap = new BitmapData(imageTransform.sw, imageTransform.sh);
					currentImageMap.draw(fullImageMap, matrix);
				}
				else 
				{
					currentImageMap = fullImageMap.clone();
//                    currentImageMap = fullImageMap; // #199 #265 вернул обратно clone(), т.к. ниже есть currentImageMap.dispose() 
				}
				
				// ==============
				// scale
				var scaleX:Number = imageTransform.dw/currentImageMap.width;
				var scaleY:Number = imageTransform.dh/currentImageMap.height;
				var angle:Number = imageTransform.deg*Math.PI/180;
				var maxScale:Number = Math.max(scaleX, scaleY);
				
				if (imageTransform.multiPassResize && maxScale < 0.5) {
					
					var curWidth:Number = currentImageMap.width;
					var curHeight:Number = currentImageMap.height;
					var mapToScale:BitmapData; 
					// multi-step 
					while(maxScale < 0.5)
					{
						// series if x2 scalings
						
						// temp bitmapdata
						mapToScale = currentImageMap.clone();
						currentImageMap.dispose();
						
						//we can downsample in a half
						matrix = new Matrix();
						matrix.identity();
						matrix.scale( 0.5, 0.5 );
						curWidth = 0.5*curWidth;
						curHeight = 0.5*curHeight;
						
						currentImageMap = new BitmapData( Math.round( curWidth ), Math.round( curHeight ) );
						
						// TODO: set smoothing to false (nearest neighbour) - it should work the same
						currentImageMap.draw(mapToScale, matrix, null, null, null, true );
						
						// new scale
						scaleX = imageTransform.dw/currentImageMap.width;
						scaleY = imageTransform.dh/currentImageMap.height;
						maxScale = Math.max(scaleX, scaleY);
					}
				}
				
				// ==============
				// final scale and rotate
				// single-step
				
				// final size including rotation
				var tw:Number = Math.round( Math.abs( Math.sin(angle)*imageTransform.dh ) + Math.abs( Math.cos(angle)*imageTransform.dw ) );
				var th:Number = Math.round( Math.abs( Math.sin(angle)*imageTransform.dw ) + Math.abs( Math.cos(angle)*imageTransform.dh ) );
				
				scaleX = imageTransform.dw/currentImageMap.width;
				scaleY = imageTransform.dh/currentImageMap.height;
				
				matrix = new Matrix();
				matrix.identity();
				matrix.translate( -1*Math.round(0.5*currentImageMap.width), -1*Math.round(0.5*currentImageMap.height) );
				matrix.rotate( angle );
				matrix.scale( scaleX, scaleY );
				matrix.translate( Math.round(0.5*tw), Math.round(0.5*th) );
				
				resizedImageMap = new BitmapData( tw , th );
				// resize with bilinear interpolation
				resizedImageMap.draw( currentImageMap, matrix, null, null, null, true );
				
				applyOverlay(resizedImageMap);
			}
			catch( e:Error ) {
				complete( false, null, new ErrorVO(e.toString()) );
			}			
		}
		
		private function applyOverlay(imageMap:BitmapData):void {
			try {
				LoggerJS.log('ResizeFileCommand applyOverlay, overlays count: '+imageTransform.overlay.length);
				// TODO:
				for (var i:uint = 0; i < imageTransform.overlay.length; i++) {
					var overlay:OverlayVO = imageTransform.overlay[i];
					if (!overlay || !overlay.imageData) {
						LoggerJS.log('ResizeFileCommand applyOverlay: no overlay image!');
						continue;
					}
					// move:
					// center  |  right  |  left
					var x:Number = (overlay.rel == 1 || overlay.rel == 4 || overlay.rel == 7) ? (imageMap.width - overlay.w + overlay.x)/2 
							: (overlay.rel == 2 || overlay.rel == 5 || overlay.rel == 8 ? imageMap.width - (overlay.w + overlay.x) 
							: overlay.x);
					// center  |  bottom  |  top
					var y:Number = (overlay.rel == 3 || overlay.rel == 4 || overlay.rel == 5) ? (imageMap.height - overlay.h + overlay.y)/2 
							: (overlay.rel >= 6 ? imageMap.height - (overlay.h + overlay.y)
							: overlay.y);
					var matrix:Matrix = new Matrix();
					matrix.identity();
					matrix.translate(x,y);
					// alpha:
					var colorTransform:ColorTransform = new ColorTransform(1, 1, 1, overlay.opacity);
					// clip:
					// note adding translation x y, because clipRect is in the image's coordinates, not the overlay's.
					var clipRect:Rectangle = new Rectangle(x/*+overlay.x*/, y/*+overlay.y*/, overlay.w, overlay.h);
					// draw:
					imageMap.draw(overlay.imageData, matrix, colorTransform, null, clipRect);
				}
				
				// success
				encodeImage(imageMap);
			}
			catch( e:Error ) {
				complete( false, null, new ErrorVO(e.toString()) );
			}	
		}
		
		/**
		 * Encode image using file type (JPG or PNG) 
		 * @param imageMap
		 * 
		 */		
		private function encodeImage(imageMap:BitmapData):void 
		{
			try {
				LoggerJS.log('ResizeFileCommand encode image, type '+imageTransform.type);
				var resizedImageData:ByteArray;
				
				// encode image
				if ( imageTransform.type == ImageTransformVO.TYPE_JPEG ) {
					resizedImageData = JPEGEncoder.encode(imageMap, uint(imageTransform.quality*100) );
				}
				else {
					// use png encoder by default
					resizedImageData = PNG24Encoder.encode(imageMap);
				}
				
				imageMap.dispose();
				
				complete( true, resizedImageData );
			}
			catch (e:Error) {
				complete( false, null, new ErrorVO(e.toString()) );
			}
		}
		
		private function complete( isSuccess:Boolean, fileBytes:ByteArray, error:ErrorVO = null ):void 
		{
			dispatchEvent( new ImageTransformCompleteEvent( isSuccess, fileBytes, error ) );
		}
	}
}