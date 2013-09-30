package ru.mail.commands
{
	import flash.events.Event;
	import flash.events.HTTPStatusEvent;
	import flash.events.IOErrorEvent;
	import flash.events.ProgressEvent;
	import flash.events.SecurityErrorEvent;
	import flash.events.TextEvent;
	
	import net.inspirit.MultipartURLLoader;
	import net.inspirit.events.MultipartURLLoaderEvent;
	
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.utils.LoggerJS;

	/**
	 * Upload using MultipartURLLoader
	 *  
	 * @author v.demidov
	 * 
	 */	
	public class UploadImageCommand extends AbstractUploadFileCommand
	{
		private var _files:Object;
		private var _totalSize:int = 0;
		private var _loader:MultipartURLLoader;
		private var status:String = null; // httpStatus. in case of upload error we get httpStatus event followed by ioError event. add status to error event using this temp variable
		
		public function UploadImageCommand(files:Object, url:String, headers:Object, uploadPostData:Object)
		{
			super(url, headers, uploadPostData);
			
			_files = files;
		}
		
		override public function dispose():void 
		{
			_loader.removeEventListener(Event.COMPLETE, onUploadComplete);
			_loader.loader.removeEventListener(HTTPStatusEvent.HTTP_STATUS, onHTTPStatus);
			_loader.loader.removeEventListener(IOErrorEvent.IO_ERROR, onError);
			_loader.loader.removeEventListener(SecurityErrorEvent.SECURITY_ERROR, onError);
			_loader.loader.removeEventListener(ProgressEvent.PROGRESS, onProgress);
			
			_loader.dispose();
			_loader = null;
			_files = null;
		}
		
		override public function execute():void
		{
			if ( _url == null ) {
				complete(false, null, new ErrorVO("UploadImageCommand: upload url is null") );
				return;
			}
			
			_loader = new MultipartURLLoader();
			// add listeners
			_loader.addEventListener(Event.COMPLETE, onUploadComplete);
			_loader.loader.addEventListener(ProgressEvent.PROGRESS, onProgress);
			_loader.loader.addEventListener(HTTPStatusEvent.HTTP_STATUS, onHTTPStatus);
			_loader.loader.addEventListener(IOErrorEvent.IO_ERROR, onError);
			_loader.loader.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onError);
			
			// post data
			for (var s:String in _uploadPostData) {
				_loader.addVariable(s, _uploadPostData[s]);
			}
			// headers 
			if (_requestHeaders) {
				_loader.requestHeaders = _requestHeaders;
			}
			
			// files data
			addFiles();
			
			try 
			{
				LoggerJS.log("Load file with multipartURLLoader. url = "+_url );
				_loader.addEventListener(MultipartURLLoaderEvent.DATA_PREPARE_COMPLETE, function(event:MultipartURLLoaderEvent):void {
					event.currentTarget.removeEventListener(event.type, arguments.callee);
					_loader.startLoad();
				});
				_loader.load(_url, true);
			}
			catch ( e:Error ){
				trace ("UploadImageCommand execute err", e);
				complete( false, null, new ErrorVO( e.toString() ) ); 
			}
		}
		
		/**
		 * add files
		 */		
		private function addFiles():void 
		{
			trace ("addFiles");
			for (var s:String in _files )
			{
				for (var filename:String in _files[s]) {
					trace ("s="+s+ ", filename = " + filename);
					if ( _files[s][filename] ) {
						_totalSize += _files[s][filename].length;
						_loader.addFile(_files[s][filename], filename, s);
					}
				}
			}
		}
		
		/**
		 * Cancels upload and disposes the object
		 */
		override public function cancel():void
		{
			try{
				trace ("UploadImageCommand:cancel");
				_loader.close();
				
				dispose();
			}catch(e:Error){
				trace ("UploadImageCommand cancel() error: "+e.message);
			}
		}
		
		/**
		 * Get the responce from server
		 */		
		private function onUploadComplete(event:Event):void
		{
			trace ("onUploadCompleteData", event);
			complete(true, _loader.loader.data);
		}
		
		private function onHTTPStatus(event:HTTPStatusEvent):void
		{
			trace ("onHTTPStatus", event);
			LoggerJS.log("urlloader.upload onHTTPStatus: " +event.status);
			status = event.status.toString();
			dispatchEvent(new TextEvent("httpStatus", false, false, event.status.toString() ) );
		}
		
		private function onError(event:Event):void
		{
			// choose error type
			var errorType:String = null;
			if (event is IOErrorEvent) {
				errorType = "IOError";
			} else if (event is SecurityErrorEvent) {
				errorType = "SecurityError";
			}
			
			LoggerJS.log("fileReference.upload onError: " +event.toString());
			
			trace ("onError", event);
			complete(false, null, new ErrorVO(event.toString(), errorType, status) );
		}
		
		private function onProgress(event:ProgressEvent):void
		{
			// because of bug (loaded:123123, total:0), use _totalSize as total
			dispatchEvent(new ProgressEvent( ProgressEvent.PROGRESS, false, false, event.bytesLoaded, _totalSize) );
		}
		
	}
}