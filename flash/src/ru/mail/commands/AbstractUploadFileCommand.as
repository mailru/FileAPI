package ru.mail.commands
{
	import flash.events.EventDispatcher;
	import flash.net.URLRequestHeader;
	import flash.net.URLVariables;
	
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.events.UploadCompleteEvent;
	
	/**
	 * Base class for UploadFileCommand and UploadImageCommand 
	 * @author v.demidov
	 * 
	 */	
	public class AbstractUploadFileCommand extends EventDispatcher
	{
		protected var _url:String;
		protected var _uploadDataFieldName:String = "Filedata";
		protected var _uploadPostData:URLVariables;
		protected var _contentType:String;
		protected var _requestHeaders:Array;

		public function AbstractUploadFileCommand(url:String, headers:Object, uploadPostData:Object, uploadDataFieldName:String = "Filedata")
		{
			super();
			
			_url = url;
			if (uploadDataFieldName && uploadDataFieldName != "")
				_uploadDataFieldName = uploadDataFieldName;
			parsePostData(uploadPostData, headers);
		}
		
		public function execute():void {/* do nothing*/}
		
		public function dispose():void {}
		
		/**
		 * it cancels upload and disposes the object
		 */
		public function cancel():void {}
		
		/**
		 * prepare post data, content-type and other request headers for upload  
		 * @param uploadPostData
		 * @param headers
		 * 
		 */		
		protected function parsePostData(uploadPostData:Object, headers:Object):void
		{
			// create URLVariables
			_uploadPostData = new URLVariables();
			var prop:String;
			if (uploadPostData != null)
			{
				for (prop in uploadPostData)
				{
					_uploadPostData[prop] = uploadPostData[prop];
				}
			}
			
			if (headers != null) 
			{
				_requestHeaders = new Array();
				
				for (prop in headers)
				{
					if (prop == "Content-Type")
					{
						// handle Content-Type apart from other headers 
						_contentType = headers[prop];
					}
					else {
						_requestHeaders.push( new URLRequestHeader(prop, headers[prop]) );
					}
				}
			}
		}
		
		protected function complete(isSuccess:Boolean, result:String, error:ErrorVO = null):void 
		{
			dispatchEvent( new UploadCompleteEvent(isSuccess, result, error) );
			
			try{
				dispose();
			} catch (e:Error) {};
		}
	}
}