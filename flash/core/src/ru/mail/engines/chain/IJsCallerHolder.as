package ru.mail.engines.chain
{
	import ru.mail.communication.JSCaller;

	/**
	 * For Engines that have jsCaller property 
	 * @author v.demidov
	 * 
	 */	
	public interface IJsCallerHolder
	{
		function get jsCaller():JSCaller;
		function set jsCaller(value:JSCaller):void
	}
}