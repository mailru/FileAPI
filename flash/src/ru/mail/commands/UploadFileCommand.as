package ru.mail.commands
{
	import flash.events.DataEvent;
	import flash.events.Event;
	import flash.events.HTTPStatusEvent;
	import flash.events.IOErrorEvent;
	import flash.events.ProgressEvent;
	import flash.events.SecurityErrorEvent;
	import flash.events.TextEvent;
	import flash.net.FileReference;
	import flash.net.URLRequest;
	import flash.net.URLRequestMethod;
	
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.utils.LoggerJS;

	/**
	 * Upload using fileReference.upload() 
	 * @author v.demidov
	 * 
	 */	
	public class UploadFileCommand extends AbstractUploadFileCommand
	{
		private var fileRef:FileReference;
		private var status:String = null; // httpStatus. in case of upload error we get httpStatus event followed by ioError event. add status to error event using this temp variable
		
		public function UploadFileCommand(fileRef:FileReference, url:String, headers:Object, uploadPostData:Object, uploadDataFieldName:String)
		{
			super(url, headers, uploadPostData, uploadDataFieldName);
			
			this.fileRef = fileRef;
		}
		
		override public function dispose():void 
		{
			fileRef.removeEventListener(DataEvent.UPLOAD_COMPLETE_DATA, onUploadCompleteData);
			fileRef.removeEventListener(HTTPStatusEvent.HTTP_STATUS, onHTTPStatus);
			fileRef.removeEventListener(IOErrorEvent.IO_ERROR, onError);
			fileRef.removeEventListener(SecurityErrorEvent.SECURITY_ERROR, onError);
			fileRef.removeEventListener(ProgressEvent.PROGRESS, onProgress);
		}
		
		override public function execute():void
		{
			if ( _url == null ) {
				complete(false, null, new ErrorVO("UploadFileCommand: upload url is null") );
				return;
			}
			
			// add listeners
			fileRef.addEventListener(DataEvent.UPLOAD_COMPLETE_DATA, onUploadCompleteData);
			fileRef.addEventListener(HTTPStatusEvent.HTTP_STATUS, onHTTPStatus);
			fileRef.addEventListener(IOErrorEvent.IO_ERROR, onError);
			fileRef.addEventListener(SecurityErrorEvent.SECURITY_ERROR, onError);
			fileRef.addEventListener(ProgressEvent.PROGRESS, onProgress);
			
			// create request
			var request:URLRequest = new URLRequest(_url);
			
			// data
			request.method = URLRequestMethod.POST;
			request.data = _uploadPostData;
			
			LoggerJS.log("upload file with FileReference, url = " +  request.url);
			try
			{
				fileRef.upload(request, _uploadDataFieldName) ;
			}
			catch ( e:Error ){
				trace ("UploadFileCommand execute err", e);
				complete( false, null, new ErrorVO( e.toString() ) ); 
			}
		}
		
		/**
		 * Cancels upload and disposes the object
		 * 
		 * Known issue: do not call cancel when the progress is 100% but uploadCompleteData hasn't received
		 * in this case the file fill not be deleted from server
		 */
		override public function cancel():void
		{
			try{
				trace ("UploadFileCommand:cancel");
				fileRef.cancel();
				
				dispose();
			}catch(e:Error){
				trace ("UploadFileCommand cancel() error: "+e.message);
			}
		}
		
		/**
		 * Get the responce from server
		 */		
		private function onUploadCompleteData(event:DataEvent):void
		{
			trace ("onUploadCompleteData", event);
			complete(true, event.data);
		}
		
		private function onHTTPStatus(event:HTTPStatusEvent):void
		{
			trace ("onHTTPStatus", event);
			LoggerJS.log("fileReference.upload HTTPStatusEvent: " +event.status);
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
			// because of bug (loaded:123123, total:0), use fileRef.size as total
			dispatchEvent(new ProgressEvent( ProgressEvent.PROGRESS, false, false, event.bytesLoaded, fileRef.size) );
		}
		
	}
}