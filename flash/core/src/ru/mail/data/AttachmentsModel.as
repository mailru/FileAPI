package ru.mail.data
{
	import flash.events.EventDispatcher;
	import flash.net.FileFilter;
	import flash.net.SharedObject;
	
	import ru.mail.data.builder.FilesDataBuilder;

	public class AttachmentsModel extends EventDispatcher
	{
		
		//=================================================
		//				singleton
		//=================================================
		
		protected static var _instance:AttachmentsModel = null;
		
		/**
		 * reference to Singleton 
		 * @return 
		 * 
		 */		
		public static function get model():AttachmentsModel
		{
			if (!_instance)
			{
				_instance = new AttachmentsModel();
			}
			
			return _instance
		}
		
		//=================================================
		//				consts
		//=================================================
		
		protected const DEFAULT_FILTER:FileFilter = new FileFilter( "All types", "*.*");
		
		//=================================================
		//				vars
		//=================================================
		
		// TODO: remove unused vars
		
		public var fileFilters:Array = [DEFAULT_FILTER];
		
		protected var _filesBuilder:FilesDataBuilder = new FilesDataBuilder()

		public function get filesBuilder():FilesDataBuilder
		{
			return _filesBuilder;
		}
		
		public var useCamera:String = null;
		
		/**
		 * if true, user can select multiple files 
		 */		
		public var useMultipleSelect:Boolean = true;
		
		public var storeKey:String = "";
		protected var _hasError:Boolean = false;
		/**
		 * read from sharedObject, whether application experienced error #2038 - problems with authorisation 
		 * while uploading through proxy. 
		 * @return 
		 * 
		 */		
		public function get hasError():Boolean
		{
			return _hasError;
		}

		public function set hasError(value:Boolean):void
		{
			_hasError = value;
			writeError(value);
		}
		
		public function clearError():void {
			_clearError();
			_hasError = false;
		}
		
		private var _timeout:int = 0;
		/**
		 * timeout for removing file
		 * When calling cmd.abort(), do not delete file immediately, but wait for some time.
		 * If file is called for upload or something, cancel timeout and do not remove file 
		 * @return
		 *
		 */
		public function get timeout():int
		{
			return _timeout;
		}

		public function set timeout(value:int):void
		{
			_timeout = int(value) || 0;
		}


		/**
		 * @private Constructor 
		 */
		public function AttachmentsModel()
		{
			super();
			
			// lock
			if (_instance) 
			{
				throw new Error("AttachmentsModel is singleton class, use get model method instead");
			}
			
			_hasError = readError();
		}
		
		public function updateHasError():void {
			_hasError = readError();
		}
		
		/**
		 * whether error #2038 occured or not
		 * @return 
		 */		
		private function readError():Boolean {
			try
			{
				var so:SharedObject = SharedObject.getLocal("flashfileapi", '/');
				var error:String = so.data[storeKey+"savedError"];
				
				trace ("attachmetsModel read sharedobject, error = " + error);
				
				return (error == "1");
			}
			catch (e:Error) {
				trace ("read shared object error: "+e);
			}
			
			return false;
		}
		
		private function writeError(isError:Boolean):void {
			try
			{
				var so:SharedObject = SharedObject.getLocal("flashfileapi", '/');
				so.data[storeKey+"savedError"] = isError? "1" : "0";
				so.flush();
			}
			catch (e:Error) {
				trace ("write shared object error: "+e);
			}
		}
		
		/**
		 * clear shared object data 
		 */		
		private function _clearError():void {
			var so:SharedObject = SharedObject.getLocal("flashfileapi", '/');
			so.clear();
		}
		
		
	}
}