package ru.mail.commands.graphicloader
{
	import flash.net.URLRequest;
	
	/**
	 */
	public interface IGraphicLoader 
	{
		function loadGraphic( request:URLRequest ):void;	
		
		function cancel():void;
	}
	
}