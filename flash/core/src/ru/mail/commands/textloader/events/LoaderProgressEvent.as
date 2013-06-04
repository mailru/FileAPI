package ru.mail.commands.textloader.events
{
	import flash.events.Event;
	
	public class LoaderProgressEvent extends Event
	{
		public static const TYPE:String = "LoaderProgressEvent" ;
		
		public function LoaderProgressEvent( loaded:uint, total:uint )
		{
			super( TYPE ) ;
			_loaded = loaded ;
			_total = total ;
		}
		
		public function get total():uint 
		{
			return _total ;
		}
		
		public function get loaded():uint 
		{
			return _loaded ;
		}
		
		private var _loaded:uint ;
		private var _total:uint ;
	}
}