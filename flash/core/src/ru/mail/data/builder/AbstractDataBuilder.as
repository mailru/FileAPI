package ru.mail.data.builder
{
	import flash.events.EventDispatcher;
	import flash.utils.clearTimeout;
	
	import ru.mail.data.vo.BaseFileVO;
	
	public class AbstractDataBuilder extends EventDispatcher
	{
		protected var _type:String = "AbstractDataBuilder"

		public function get type():String
		{
			return _type;
		}

		protected var _items:Vector.<BaseFileVO> = new Vector.<BaseFileVO>();
		/**
		 * Return just a copy of items vector 
		 * @return 
		 * 
		 */		
		public function get items():Vector.<BaseFileVO>
		{
			return _items.slice();
		}
		
		public function AbstractDataBuilder(type:String)
		{
			super();
			
			_type = type;
		}
		
		/**
		 * Check id and add file to the collection. 
		 * @param file
		 * @return file that have been added
		 * 
		 */		
		public function addFile(file:BaseFileVO):BaseFileVO
		{
			_items.push(file);
			validateID(file)
			
			return file;
		}
		
		/**
		 * Search among all items and return file that matches given fileID 
		 * @param fileID
		 * @return 
		 * 
		 */		
		public function getFileByID(fileID:String):BaseFileVO
		{
			var result:BaseFileVO = null;
			
			for (var i:uint = 0; i < _items.length; i++)
			{
				if (_items[i].fileID == fileID) {
					result = _items[i];
					if (result.timeout) {
						clearTimeout(result.timeout); // cancel file remove
					}
					break;
				}
			}
			
			return result;
		}
		
		/**
		 * Return file at given index. 
		 * @param index
		 * @return 
		 * 
		 */		
		public function getFileAt(index:int):BaseFileVO
		{
			return _items[index];
		}
		
		/**
		 * Remove given file 
		 * @param file
		 * @return removed file
		 * 
		 */		
		public function removeFile(file:BaseFileVO):BaseFileVO
		{
			var index:int = _items.indexOf(file);
			
			return removeFileAt(index);
		}
		
		/**
		 * 
		 * @param fileID - id of the file to be removed
		 * @return removed file
		 * 
		 */		
		public function removeFileByID(fileID:String):BaseFileVO
		{
			var file:BaseFileVO = getFileByID(fileID);
			
			if (file != null)
			{
				removeFile(file);
			}
			
			return file;
		}
		
		/**
		 * If index is valid, remove file from this index 
		 * @param index
		 * @return removed file
		 * 
		 */		
		public function removeFileAt(index:int):BaseFileVO
		{
			var result:BaseFileVO = null;
			
			if (index > -1 && index < _items.length)
			{
				result = _items.splice(index, 1)[0];
				result.loadCommand = null;
				result.uploadCommand = null;
				if(result.timeout) {
					clearTimeout(result.timeout);
				}
			}
			
			return result;
		}
		
		/**
		 *  
		 * 
		 */		
		public function removeAllFiles():void
		{
			for (var i:uint = 0; i < _items.length; i++) { // for garbage collector
				if (_items[i].timeout) {
					clearTimeout(_items[i].timeout);
				}
			}
			_items.length = 0;
		}
		
		/**
		 * Return files array length 
		 * @return 
		 * 
		 */		
		public function getFilesCount():int
		{
			return _items.length;
		}
		
		/**
		 * returns random id string 
		 * @return 
		 * 
		 */		
		public function generateID():String
		{
			return new String().concat( new Date().valueOf(), Math.floor( Math.random() * 1000 ) );
		}
		
		/**
		 * Validate that file's id is not null and differs from other file ids.
		 * 
		 * If id is not valid, generate new one and assign it to the file.
		 * @param file
		 * @return true if id had been changed
		 * 
		 */		
		protected function validateID(file:BaseFileVO):Boolean
		{
			var isIdChanged:Boolean = false;
			
			// check null
			if (file.fileID == null || file.fileID == ""){
				isIdChanged = true;
				file.fileID = generateID();
			}
			
			// compare with other files
			for (var i:uint = 0; i < _items.length; i++)
			{
				if (_items[i] == file)
					continue;
				
				if (_items[i].fileID == file.fileID) {
					// generate new id
					isIdChanged = true;
					file.fileID = generateID();
				}
			}
			
			return isIdChanged;
		}
	}
}