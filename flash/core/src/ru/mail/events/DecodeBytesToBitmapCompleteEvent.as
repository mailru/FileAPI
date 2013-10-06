package ru.mail.events
{
	import flash.display.Bitmap;
	import flash.events.Event;
	
	import ru.mail.data.vo.ErrorVO;

	public class DecodeBytesToBitmapCompleteEvent extends CompleteEvent
	{
		public static const TYPE:String = "DecodeBytesToBitmapCompletedEvent";
		
		private var _decodedBitmap:Bitmap;
		/**
		 * transformed image data 
		 * @return 
		 */
		public function get decodedBitmap():Bitmap
		{
			return _decodedBitmap;
		}
		
		
		public function DecodeBytesToBitmapCompleteEvent(isSuccess:Boolean, decodedBitmap:Bitmap, error:ErrorVO = null)
		{
			super(isSuccess, error, TYPE);
			
			_decodedBitmap = decodedBitmap;
		}
		
		override public function clone():Event
		{
			return new DecodeBytesToBitmapCompleteEvent(isSuccess, decodedBitmap, error);
		}
	}
}