package ru.mail.commands.graphicloader.events
{
	import flash.events.Event;
	
	import ru.mail.data.vo.ErrorVO;

;
	
	public class GraphicLoaderCompleteEvent extends Event
	{
		public static const TYPE:String = "GraphicLoaderCompleteEvent" ;
		
		public function GraphicLoaderCompleteEvent( isSuccess:Boolean, content:*, error:ErrorVO = null )
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
		
		public function get content():* 
		{
			return _content ;
		}
		
		public function get error():ErrorVO
		{
			return _error;
		}
		
		private var _isSuccess:Boolean ;
		private var _content:* ;
		private var _error:ErrorVO;
	}
}