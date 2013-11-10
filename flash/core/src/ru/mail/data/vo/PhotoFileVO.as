package ru.mail.data.vo
{
	import flash.display.BitmapData;
	import flash.geom.Rectangle;
	import flash.utils.ByteArray;
	
	public class PhotoFileVO extends BaseFileVO implements IFileVO
	{
		private var _image:BitmapData = null;
		private var _filedata:ByteArray = null;
		
		public function PhotoFileVO()
		{
			super();
		}
		
		public function get fileData():ByteArray
		{
			return _filedata;
		}
		
		public function get fileSize():Number
		{
			return _filedata? _filedata.length : 0;
		}
		
		public function get fileName():String
		{
			return _fileID+'.png';
		}
		
		/**
		 * use fileName, because modified filename makes sense only for fileRef files.
		 * @return 
		 * 
		 */		
		public function get fileNameModified():String
		{
			return fileName;
		}
		
		public function get fileType():String
		{
			return 'png';
		}
		
		public function get imageData():BitmapData
		{
			return _image;
		}
		
		public function set imageData(bd:BitmapData):void
		{
			_image = bd;
			if (_image) {
				// get bytearray now to avoid this operation every time we need it.
				_filedata = _image.getPixels(new Rectangle(0, 0, _image.width, _image.height)); 
			}
		}
	}
}