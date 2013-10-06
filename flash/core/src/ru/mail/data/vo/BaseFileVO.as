package ru.mail.data.vo
{
	import ru.mail.data.AbstractImageFactory;
	import ru.mail.data.IImageFactory;

	/**
	 * This class contains almost all information about the file. The difference is only the source of data - 
	 * it can be fileReference or loaded from url or image from web camera.
	 * load from url isn't implemented now.
	 *  
	 * @author v.demidov
	 */	
	public class BaseFileVO
	{
		protected var _fileID:String = "";

		public function get fileID():String
		{
			return _fileID;
		}
		
		public function set fileID(value:String):void
		{
			_fileID = value;
		}
		
		// TODO: refactor
		private var _status:String = "selected";
		
		public function get status():String {
			return _status;
		}
		public function set status(value:String):void {
			_status = value;
		}
		
		public var loadCommand:Object;
		public var uploadCommand:Object;
		
		public var timeout:uint = 0; // timeout that can remove file
		
		private var _abstractImageFactory:AbstractImageFactory;
		
		public function set abstractImageFactory(value:AbstractImageFactory):void
		{
			_abstractImageFactory = value;
		}
		/**
		 * factory for producing images
		 * 
		 * @return 
		 * 
		 */		
		public function get imageFactory():IImageFactory
		{
			return _abstractImageFactory.getImageFactory();
		}

		public function BaseFileVO()
		{
			
		}
	}
}