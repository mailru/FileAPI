package ru.mail.commands.textloader
{
	import flash.net.URLRequest;
	
	/**
	 * Simple util loader 
	 */
	public interface ITextLoader 
	{
		function loadText( request:URLRequest ):void;
	}
	
}