package ru.mail.commands.textloader.events
{
	import flash.events.Event;
	
	import ru.mail.data.vo.ErrorVO;
	
	public class TextLoaderCompleteEvent extends Event
	{
		public static const TYPE:String = "TextLoaderCompleteEvent" ;
		
		public function TextLoaderCompleteEvent( isSuccess:Boolean, content:String, error:ErrorVO = null )
		{
			super( TYPE ) ;
			_isSuccess = isSuccess ;
			_content = content ;
			_error = error;
		}
		
		public function get isSuccess():Boolean 
		{
			return _isSuccess ;
		}
		
		public function get content():String 
		{
			return _content ;
		}
		
		public function get error():ErrorVO
		{
			return _error;
		}
		
		private var _isSuccess:Boolean ;
		private var _content:String ;	
		private var _error:ErrorVO;
	}
}