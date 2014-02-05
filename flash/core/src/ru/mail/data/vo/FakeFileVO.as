package ru.mail.data.vo
{
	import flash.display.BitmapData;
	import flash.utils.ByteArray;

	/**
	 * Restored file (from url or any else bytearray). If it is image, it cannot be scaled or rotated. 
	 * @author v.demidov
	 * 
	 */
	public class FakeFileVO extends BaseFileVO implements IFileVO
	{
		private var _fileData:ByteArray;
		
		public function get fileData():ByteArray
		{
			return _fileData;
		}

		public function set fileData(value:ByteArray):void
		{
			_fileData = value;
		}

		public function get fileSize():Number {
			return _fileData? _fileData.length : 0;
		}

		public function get fileName():String {
			return fileID;
		}

		public function get fileNameModified():String
		{
			return fileID;
		}

		public function get fileType():String {
			return "";
		}

		private var _imageData:BitmapData;
		/**
		 * original image bitmapData; 
		 * @return 
		 * 
		 */		
		public function get imageData():BitmapData
		{
			return _imageData;
		}

		public function set imageData(bd:BitmapData):void
		{
			_imageData = bd;
		}

		public function FakeFileVO()
		{
			super();
		}
	}
}