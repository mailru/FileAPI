package ru.mail.utils
{
	import ru.mail.communication.JSCaller;

	public class LoggerJS
	{
		private static var on:Boolean = false;
		
		public function LoggerJS()
		{
		}
		
		public static function enable(value:Boolean):void
		{
			on = value;
		}
		
		public static function log(str:String):void
		{
			if (on) {
				trace ("# LoggerJs.log",str);
				var data:Object = {type:"log", target:str};
				JSCaller.jsCaller.callJS(JSCaller.callback, data);
			}
		}
	}
}