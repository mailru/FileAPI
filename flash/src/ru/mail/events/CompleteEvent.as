package ru.mail.events
{
	import flash.events.Event;
	
	import ru.mail.data.vo.ErrorVO;
	
	/**
	 * the event that is triggered by Command on its executing completion.
	 * it provides access to execution result flag, that indicates whether command executed successfully
	 * @author ivanova
	 */
	public class CompleteEvent extends Event 
	{
		public static const TYPE:String = "CompleteEvent" ;
		
		private var _isSuccess:Boolean;
		public function get isSuccess():Boolean
		{
			return _isSuccess ;
		}
		
		private var _error:ErrorVO
		public function get error():ErrorVO 
		{
			return _error;
		}
		
		/**
		 * ctor
		 * @param	isSuccess: indicates whether command executed successfully.
		 */
		public function CompleteEvent( isSuccess:Boolean, error:ErrorVO = null, type:String = null ) 
		{
			super( type? type : TYPE ) ;
			_isSuccess = isSuccess ;
			_error = error;
		}
		
		override public function clone():Event
		{
			return new CompleteEvent(_isSuccess, error);
		}
	}
}