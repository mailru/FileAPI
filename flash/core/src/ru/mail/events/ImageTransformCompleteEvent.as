package ru.mail.events
{
	import flash.events.Event;
	import flash.utils.ByteArray;
	
	import ru.mail.data.vo.ErrorVO;

	public class ImageTransformCompleteEvent extends CompleteEvent
	{
		public static const TYPE:String = "ImageTransformCompleteEvent";
		
		private var _data:ByteArray;
		/**
		 * transformed image data 
		 * @return 
		 */
		public function get data():ByteArray
		{
			return _data;
		}
		
		public function ImageTransformCompleteEvent(isSuccess:Boolean, data:ByteArray, error:ErrorVO = null)
		{
			super(isSuccess, error, TYPE);
			
			_data = data;
		}
		
		override public function clone():Event
		{
			return new ImageTransformCompleteEvent(isSuccess, data, error);
		}
	}
}