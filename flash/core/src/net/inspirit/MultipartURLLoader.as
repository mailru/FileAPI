package net.inspirit
{
	import flash.errors.IllegalOperationError;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.HTTPStatusEvent;
	import flash.events.IOErrorEvent;
	import flash.events.ProgressEvent;
	import flash.events.SecurityErrorEvent;
	import flash.net.URLLoader;
	import flash.net.URLLoaderDataFormat;
	import flash.net.URLRequest;
	import flash.net.URLRequestHeader;
	import flash.net.URLRequestMethod;
	import flash.utils.ByteArray;
	import flash.utils.Dictionary;
	import flash.utils.Endian;
	import flash.utils.clearInterval;
	import flash.utils.setTimeout;
	
	import net.inspirit.events.MultipartURLLoaderEvent;

	/**
	 * Multipart URL Loader
	 *
	 * Original idea by Marston Development Studio - http://marstonstudio.com/?p=36
	 *
	 * History
	 * 2009.01.15 version 1.0
	 * Initial release
	 *
	 * 2009.01.19 version 1.1
	 * Added options for MIME-types (default is application/octet-stream)
	 *
	 * 2009.01.20 version 1.2
	 * Added clearVariables and clearFiles methods
	 * Small code refactoring
	 * Public methods documentaion
	 *
	 * 2009.02.09 version 1.2.1
	 * Changed 'useWeakReference' to false (thanx to zlatko)
	 * It appears that on some servers setting 'useWeakReference' to true
	 * completely disables this event
	 *
	 * 2009.03.05 version 1.3
	 * Added Async property. Now you can prepare data asynchronous before sending it.
	 * It will prevent flash player from freezing while constructing request data.
	 * You can specify the amount of bytes to write per iteration through BLOCK_SIZE static property.
	 * Added events for asynchronous method.
	 * Added dataFormat property for returned server data.
	 * Removed 'Cache-Control' from headers and added custom requestHeaders array property.
	 * Added getter for the URLLoader class used to send data.
	 *
	 * 2010.02.23
	 * Fixed issue 2 (loading failed if not directly dispatched from mouse event)
	 * problem and fix reported by gbradley@rocket.co.uk
	 *
	 * @author Eugene Zatepyakin
	 * @version 1.3
	 * @link http://blog.inspirit.ru/
	 */
	public class  MultipartURLLoader extends EventDispatcher
	{
		public static var BLOCK_SIZE:uint = 64 * 1024;

		private var _loader:URLLoader;
		private var _boundary:String;
		private var _variableNames:Array;
		private var _fileNames:Array;
		private var _variables:Dictionary;
		private var _files:Dictionary;

		private var _async:Boolean = false;
		private var _path:String;
		private var _data:ByteArray;

		private var _prepared:Boolean = false;
		private var asyncWriteTimeoutId:Number;
		private var asyncFilePointer:uint = 0;
		private var totalFilesSize:uint = 0;
		private var writtenBytes:uint = 0;

		public var requestHeaders:Array;

		public function MultipartURLLoader()
		{
			_fileNames = new Array();
			_files = new Dictionary();
			_variableNames = new Array();
			_variables = new Dictionary();
			_loader = new URLLoader();
			requestHeaders = new Array();
		}

		/**
		 * Start uploading data to specified path
		 *
		 * @param	path	The server script path
		 * @param	async	Set to true if you are uploading huge amount of data
		 */
		public function load(path:String, async:Boolean = false):void
		{
			if (path == null || path == '') throw new IllegalOperationError('You cant load without specifing PATH');

			_path = path;
			_async = async;

			if (_async) {
				if(!_prepared){
					constructPostDataAsync();
				} else {
					doSend();
				}
			} else {
				_data = constructPostData();
				doSend();
			}
		}

		/**
		 * Start uploading data after async prepare
		 */
		public function startLoad():void
		{
			if ( _path == null || _path == '' || _async == false ) throw new IllegalOperationError('You can use this method only if loading asynchronous.');
			if ( !_prepared && _async ) throw new IllegalOperationError('You should prepare data before sending when using asynchronous.');

			doSend();
		}

		/**
		 * Prepare data before sending (only if you use asynchronous)
		 */
		public function prepareData():void
		{
			constructPostDataAsync();
		}

		/**
		 * Stop loader action
		 */
		public function close():void
		{
			try {
				_loader.close();
			} catch( e:Error ) { }
		}

		/**
		 * Add string variable to loader
		 * If you have already added variable with the same name it will be overwritten
		 *
		 * @param	name	Variable name
		 * @param	value	Variable value
		 */
		public function addVariable(name:String, value:Object = ''):void
		{
			if (_variableNames.indexOf(name) == -1) {
				_variableNames.push(name);
			}
			_variables[name] = value;
			_prepared = false;
		}

		/**
		 * Add file part to loader
		 * If you have already added file with the same fileName it will be overwritten
		 * 
		 * // no overwrite when adding file with the same fileName.
		 *
		 * @param	fileContent	File content encoded to ByteArray
		 * @param	fileName	Name of the file
		 * @param	dataField	Name of the field containg file data
		 * @param	contentType	MIME type of the uploading file
		 */
		public function addFile(fileContent:ByteArray, fileName:String, dataField:String = 'Filedata', contentType:String = 'application/octet-stream'):void
		{
			var key:String = fileName+_fileNames.length.toString(); // cannot use just fileName, because there can be several files with equal filename
			_fileNames.push( key );
			_files[key] = new FilePart(fileContent, fileName, dataField, contentType);
			totalFilesSize += fileContent.length;

			_prepared = false;
		}

		/**
		 * Remove all variable parts
		 */
		public function clearVariables():void
		{
			_variableNames = new Array();
			_variables = new Dictionary();
			_prepared = false;
		}

		/**
		 * Remove all file parts
		 */
		public function clearFiles():void
		{
			for each(var name:String in _fileNames)
			{
				(_files[name] as FilePart).dispose();
			}
			_fileNames = new Array();
			_files = new Dictionary();
			totalFilesSize = 0;
			_prepared = false;
		}

		/**
		 * Dispose all class instance objects
		 */
		public function dispose(): void
		{
			clearInterval(asyncWriteTimeoutId);
			removeListener();
			close();

			_loader = null;
			_boundary = null;
			_variableNames = null;
			_variables = null;
			_fileNames = null;
			_files = null;
			requestHeaders = null;
			_data = null;
		}

		/**
		 * Generate random boundary
		 * @return	Random boundary
		 */
		public function getBoundary():String
		{
			if (_boundary == null) {
				_boundary = '';
				for (var i:int = 0; i < 0x20; i++ ) {
					_boundary += String.fromCharCode( int( 97 + Math.random() * 25 ) );
				}
			}
			return _boundary;
		}

		public function get ASYNC():Boolean
		{
			return _async;
		}

		public function get PREPARED():Boolean
		{
			return _prepared;
		}

		public function get dataFormat():String
		{
			return _loader.dataFormat;
		}

		public function set dataFormat(format:String):void
		{
			if (format != URLLoaderDataFormat.BINARY && format != URLLoaderDataFormat.TEXT && format != URLLoaderDataFormat.VARIABLES) {
				throw new IllegalOperationError('Illegal URLLoader Data Format');
			}
			_loader.dataFormat = format;
		}

		public function get loader():URLLoader
		{
			return _loader;
		}

		private function doSend():void
		{
			var urlRequest:URLRequest = new URLRequest();
			urlRequest.url = _path;
			//urlRequest.contentType = 'multipart/form-data; boundary=' + getBoundary();
			urlRequest.method = URLRequestMethod.POST;
			urlRequest.data = _data;

			urlRequest.requestHeaders.push( new URLRequestHeader('Content-type', 'multipart/form-data; boundary=' + getBoundary()) );

			if (requestHeaders.length)
			{
				urlRequest.requestHeaders = urlRequest.requestHeaders.concat(requestHeaders);
			}

			addListener();

			_loader.load(urlRequest);
		}

		private function constructPostDataAsync():void
		{
			clearInterval(asyncWriteTimeoutId);

			_data = new ByteArray();
			_data.endian = Endian.BIG_ENDIAN;

			_data = constructVariablesPart(_data);

			asyncFilePointer = 0;
			writtenBytes = 0;
			_prepared = false;
			if (_fileNames.length) {
				nextAsyncLoop();
			} else {
				_data = closeDataObject(_data);
				_prepared = true;
				dispatchEvent( new MultipartURLLoaderEvent(MultipartURLLoaderEvent.DATA_PREPARE_COMPLETE) );
			}
		}

		private function constructPostData():ByteArray
		{
			var postData:ByteArray = new ByteArray();
			postData.endian = Endian.BIG_ENDIAN;

			postData = constructVariablesPart(postData);
			postData = constructFilesPart(postData);

			postData = closeDataObject(postData);

			return postData;
		}

		private function closeDataObject(postData:ByteArray):ByteArray
		{
			postData = BOUNDARY(postData);
			postData = DOUBLEDASH(postData);
			return postData;
		}

		private function constructVariablesPart(postData:ByteArray):ByteArray
		{
			var i:uint;
			var bytes:String;

			for each(var name:String in _variableNames)
			{
				postData = BOUNDARY(postData);
				postData = LINEBREAK(postData);
				bytes = 'Content-Disposition: form-data; name="' + name + '"';
				for ( i = 0; i < bytes.length; i++ ) {
					postData.writeByte( bytes.charCodeAt(i) );
				}
				postData = LINEBREAK(postData);
				postData = LINEBREAK(postData);
				postData.writeUTFBytes(_variables[name]);
				postData = LINEBREAK(postData);
			}

			return postData;
		}

		private function constructFilesPart(postData:ByteArray):ByteArray
		{
			var i:uint;
			var bytes:String;

			if(_fileNames.length){
				for each(var name:String in _fileNames)
				{
					postData = getFilePartHeader(postData, _files[name] as FilePart);
					postData = getFilePartData(postData, _files[name] as FilePart);

					if (i != _fileNames.length - 1)
					{
						postData = LINEBREAK(postData);
					}
					i++;

				}
				postData = closeFilePartsData(postData);
			}

			return postData;
		}

		private function closeFilePartsData(postData:ByteArray):ByteArray
		{
			var i:uint;
			var bytes:String;

			postData = LINEBREAK(postData);
			postData = BOUNDARY(postData);
			postData = LINEBREAK(postData);
			bytes = 'Content-Disposition: form-data; name="Upload"';
			for ( i = 0; i < bytes.length; i++ ) {
				postData.writeByte( bytes.charCodeAt(i) );
			}
			postData = LINEBREAK(postData);
			postData = LINEBREAK(postData);
			bytes = 'Submit Query';
			for ( i = 0; i < bytes.length; i++ ) {
				postData.writeByte( bytes.charCodeAt(i) );
			}
			postData = LINEBREAK(postData);

			return postData;
		}

		private function getFilePartHeader(postData:ByteArray, part:FilePart):ByteArray
		{
			var i:uint;
			var bytes:String;

			postData = BOUNDARY(postData);
			postData = LINEBREAK(postData);
			bytes = 'Content-Disposition: form-data; name="Filename"';
			for ( i = 0; i < bytes.length; i++ ) {
				postData.writeByte( bytes.charCodeAt(i) );
			}
			postData = LINEBREAK(postData);
			postData = LINEBREAK(postData);
			postData.writeUTFBytes(part.fileName);
			postData = LINEBREAK(postData);

			postData = BOUNDARY(postData);
			postData = LINEBREAK(postData);
			bytes = 'Content-Disposition: form-data; name="' + part.dataField + '"; filename="';
			for ( i = 0; i < bytes.length; i++ ) {
				postData.writeByte( bytes.charCodeAt(i) );
			}
			postData.writeUTFBytes(part.fileName);
			postData = QUOTATIONMARK(postData);
			postData = LINEBREAK(postData);
			bytes = 'Content-Type: ' + part.contentType;
			for ( i = 0; i < bytes.length; i++ ) {
				postData.writeByte( bytes.charCodeAt(i) );
			}
			postData = LINEBREAK(postData);
			postData = LINEBREAK(postData);

			return postData;
		}

		private function getFilePartData(postData:ByteArray, part:FilePart):ByteArray
		{
			postData.writeBytes(part.fileContent, 0, part.fileContent.length);

			return postData;
		}

		private function onProgress( event: ProgressEvent ): void
		{
			dispatchEvent( event );
		}

		private function onComplete( event: Event ): void
		{
			removeListener();
			dispatchEvent( event );
		}

		private function onIOError( event: IOErrorEvent ): void
		{
			removeListener();
			dispatchEvent( event );
		}

		private function onSecurityError( event: SecurityErrorEvent ): void
		{
			removeListener();
			dispatchEvent( event );
		}

		private function onHTTPStatus( event: HTTPStatusEvent ): void
		{
			dispatchEvent( event );
		}

		private function addListener(): void
		{
			_loader.addEventListener( Event.COMPLETE, onComplete, false, 0, false );
			_loader.addEventListener( ProgressEvent.PROGRESS, onProgress, false, 0, false );
			_loader.addEventListener( IOErrorEvent.IO_ERROR, onIOError, false, 0, false );
			_loader.addEventListener( HTTPStatusEvent.HTTP_STATUS, onHTTPStatus, false, 0, false );
			_loader.addEventListener( SecurityErrorEvent.SECURITY_ERROR, onSecurityError, false, 0, false );
		}

		private function removeListener(): void
		{
			if (!_loader) return;
			_loader.removeEventListener( Event.COMPLETE, onComplete );
			_loader.removeEventListener( ProgressEvent.PROGRESS, onProgress );
			_loader.removeEventListener( IOErrorEvent.IO_ERROR, onIOError );
			_loader.removeEventListener( HTTPStatusEvent.HTTP_STATUS, onHTTPStatus );
			_loader.removeEventListener( SecurityErrorEvent.SECURITY_ERROR, onSecurityError );
		}

		private function BOUNDARY(p:ByteArray):ByteArray
		{
			var l:int = getBoundary().length;
			p = DOUBLEDASH(p);
			for (var i:int = 0; i < l; i++ ) {
				p.writeByte( _boundary.charCodeAt( i ) );
			}
			return p;
		}

		private function LINEBREAK(p:ByteArray):ByteArray
		{
			p.writeShort(0x0d0a);
			return p;
		}

		private function QUOTATIONMARK(p:ByteArray):ByteArray
		{
			p.writeByte(0x22);
			return p;
		}

		private function DOUBLEDASH(p:ByteArray):ByteArray
		{
			p.writeShort(0x2d2d);
			return p;
		}

		private function nextAsyncLoop():void
		{
			var fp:FilePart;

			if (asyncFilePointer < _fileNames.length) {

				fp = _files[_fileNames[asyncFilePointer]] as FilePart;
				_data = getFilePartHeader(_data, fp);

				asyncWriteTimeoutId = setTimeout(writeChunkLoop, 10, _data, fp.fileContent, 0);

				asyncFilePointer ++;
			} else {
				_data = closeFilePartsData(_data);
				_data = closeDataObject(_data);

				_prepared = true;

				dispatchEvent( new MultipartURLLoaderEvent(MultipartURLLoaderEvent.DATA_PREPARE_PROGRESS, totalFilesSize, totalFilesSize) );
				dispatchEvent( new MultipartURLLoaderEvent(MultipartURLLoaderEvent.DATA_PREPARE_COMPLETE) );
			}
		}

		private function writeChunkLoop(dest:ByteArray, data:ByteArray, p:uint = 0):void
		{
			var len:uint = Math.min(BLOCK_SIZE, data.length - p);
			dest.writeBytes(data, p, len);

			if (len < BLOCK_SIZE || p + len >= data.length) {
				// Finished writing file bytearray
				dest = LINEBREAK(dest);
				nextAsyncLoop();
				return;
			}

			p += len;
			writtenBytes += len;
			if ( writtenBytes % BLOCK_SIZE * 2 == 0 ) {
				dispatchEvent( new MultipartURLLoaderEvent(MultipartURLLoaderEvent.DATA_PREPARE_PROGRESS, writtenBytes, totalFilesSize) );
			}

			asyncWriteTimeoutId = setTimeout(writeChunkLoop, 10, dest, data, p);
		}

	}
}
import flash.utils.ByteArray;

internal class FilePart
{

	public var fileContent:ByteArray;
	public var fileName:String;
	public var dataField:String;
	public var contentType:String;

	public function FilePart(fileContent:ByteArray, fileName:String, dataField:String = 'Filedata', contentType:String = 'application/octet-stream')
	{
		this.fileContent = fileContent;
		this.fileName = fileName;
		this.dataField = dataField;
		this.contentType = contentType;
	}

	public function dispose():void
	{
		fileContent = null;
		fileName = null;
		dataField = null;
		contentType = null;
	}
}