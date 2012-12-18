package ru.mail.data.vo
{
	import flash.display.BitmapData;
	import flash.utils.ByteArray;
	
	import ru.mail.data.IImageFactory;

	public interface IFileVO
	{
		function get fileID():String;
		function get fileData():ByteArray;
		function get fileSize():Number;
		function get fileName():String;
		function get fileNameModified():String;
		/**
		 * it gets fileRef name, cuts the dot and returns the lowerCase file extenation.
		 * it returns empty string if type is null
		 */
		function get fileType():String;	
		
		function get status():String;
		function set status(value:String):void;
		
		function get imageData():BitmapData;
		function set imageData(bd:BitmapData):void;
		
		function get imageFactory():IImageFactory;
	}
}