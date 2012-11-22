package ru.mail.utils
{
	import ru.mail.communication.JSCaller;

	public class LoggerJS
	{
		public function LoggerJS()
		{
		}
		
		public static function log(str:String):void
		{
//			trace ("# LoggerJs.log",args);
			var data:Object = {type:"log", target:str};
			JSCaller.jsCaller.callJS(JSCaller.callback, data);
		}
	}
}