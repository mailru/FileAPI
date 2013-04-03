package ru.mail.commands.graphicloader.events
{
	import flash.events.Event ;
	
	public class GraphicLoaderCompleteEvent extends Event
	{
		public static const TYPE:String = "GraphicLoaderCompleteEvent" ;
		
		public function GraphicLoaderCompleteEvent( isSuccess:Boolean, content:* )
		{
			super( TYPE ) ;
			_isSuccess = isSuccess ;
			_content = content ;
		}
		
		public function get isSuccess():Boolean 
		{
			return _isSuccess ;
		}
		
		public function get content():* 
		{
			return _content ;
		}
		
		private var _isSuccess:Boolean ;
		private var _content:* ;
	}
}