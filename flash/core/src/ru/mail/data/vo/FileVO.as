package ru.mail.data.vo
{
	import flash.display.BitmapData;
	import flash.net.FileReference;
	import flash.utils.ByteArray;
	
	/**
	 * Value object contains file reference, unique ID etc
	 * 
	 * @author v.demidov
	 * 
	 */
	public class FileVO extends BaseFileVO implements IFileVO
	{
		public var fileRef:FileReference;
		
		public function get fileData():ByteArray
		{
			return fileRef.data;
		}
		
		public function get fileSize():Number {
			var fileSize:Number = 0;
			try
			{
				fileSize = fileRef.size;
			}
			catch ( e:Error ) { }
			
			return fileSize;
		}
		
		public function get fileName():String
		{
			return fileRef.name;
		}
		
		public function get fileType():String
		{
			var fileNameParts:Array = fileName.split( "." );
			if ( fileNameParts.length < 2 )
				return "";
			
			return ( fileNameParts[ fileNameParts.length - 1 ] ).toLowerCase();
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
		
		/**
		 * for modified images we change filetype, because we encode bmp and gif with png encoder. 
		 * for jpg - do not modify, because we use jpg encoder for them 
		 * @return 
		 */		
		public function get fileNameModified():String
		{
			if (fileType == 'jpg' || fileType == 'jpeg') {
				return fileName;
			}
			else {
				var fileNameParts:Array = fileName.split( "." );
				if ( fileNameParts.length < 2 )
					return fileName;
				
				return fileNameParts[0] + '.png';
			}
		}
		
		public function FileVO()
		{
			super();
		}
	}
}
