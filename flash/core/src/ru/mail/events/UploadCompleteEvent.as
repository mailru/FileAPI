package ru.mail.events
{
	import flash.events.Event;
	
	import ru.mail.data.vo.ErrorVO;
	
	public class UploadCompleteEvent extends CompleteEvent
	{
		public static const TYPE:String = "UploadCompleteEvent";
		
		private var _result:String;
		/**
		 * Upload server responce 
		 */
		public function get result():String
		{
			return _result;
		}
		
		public function UploadCompleteEvent(isSuccess:Boolean, result:String, error:ErrorVO=null)
		{
			super(isSuccess, error, TYPE);
			
			_result = result;
		}
		
		override public function clone():Event
		{
			return new UploadCompleteEvent(isSuccess, result, error);
		}
	}
}