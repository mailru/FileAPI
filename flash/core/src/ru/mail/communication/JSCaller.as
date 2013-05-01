package ru.mail.communication
{
	import flash.external.ExternalInterface;
	
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.data.vo.FileVO;

	/**
	 * Call JS methods via ExternalInterfaces
	 *  
	 * @author v.demidov
	 * 
	 */	
	public class JSCaller
	{
		/**
		 * flashvar parameter with callback function name 
		 */		
		public static var callback:String = "callback";
		public static var flashId:String = "flashId";
		
		private static var _instance:JSCaller = null;
		
		/**
		 * Reference to Singleton 
		 * @return 
		 * 
		 */		
		public static function get jsCaller():JSCaller
		{
			if (!_instance) {
				_instance = new JSCaller();
			}
			
			return _instance;
		}
		
		/**
		 * @private
		 * Constructor 
		 */		
		public function JSCaller()
		{
		}
		
		/**
		 * Call js  
		 * @param _callback name of js function to call
		 * @param data object with all nesessary data
		 * 
		 */		
		public function callJS(_callback:String, data:Object, data2:Object = null):void
		{
			try {
				// pass data to given callback
				if (data2) {
					ExternalInterface.call(_callback, data, data2);
				}
				else {
					ExternalInterface.call(_callback, data);
				}
			}
			catch (e:Error)	{
				trace ("callJS caused an exception", e);
			}
		}
		
		/**
		 * call js when the application is ready to work 
		 * @param triesCount
		 * @return 
		 * 
		 */		
		public function notifyJSAboutAppReady(triesCount:int):Boolean
		{
			var isReady:Boolean = false;
			try {
				var r:* = ExternalInterface.call(callback, {type:"ready", flashId:flashId});
				trace( "JSCaller.notifyJSAboutAppReady() ", triesCount );
				
				isReady = ( r != null );
			}
			catch ( e:Error ) {
				trace ("notifyJSAboutAppReady error", e);
			}
			
			return isReady;
		}
		
		/**
		 * types: mouseenter, mouseleave, mouseDown, mouseUp 
		 * @param eventType
		 * 
		 */		
		public function notifyJSMouseEvents(eventType:String):void
		{
			if (eventType == "rollOut") {
				eventType = "mouseleave";
			}
			else if (eventType == "rollOver") {
				eventType = "mouseenter";
			}
			
			try {
				ExternalInterface.call(callback, { type:eventType, flashId:flashId });
			}
			catch (e:Error) {
				trace ("notifyJSMouseEvents error", e);
			}
		}
		
		/**
		 * Notify js about file events - select, cancel, browse
		 * 
		 * When sending select event, a files list is required.
		 *  
		 * @param eventType
		 * @param filesVector
		 * 
		 */		
		public function notifyJSFilesEvents(eventType:String, filesVector:Vector.<FileVO> = null):void
		{
			trace ("{JSCaller} - notifyJSFilesEvents, eventType", eventType)
			
			var details:Object = new Object();
			details.type = eventType;
			
			if (eventType == "select")
			{
				if (!filesVector) {
					throw new Error("{JSCaller} - notifyJSFilesEvents: filesVector is null");
				}
				
				// create fileInfo array:
				var fileList:Array = new Array();
				var file:Object;
				
				for (var i:uint = 0; i < filesVector.length; i++)
				{
					// [{ uid: ... // unique id , name: "" // fileName , type: "" // fileType , size: "" // fileSize }]
					file = new Object();
					file.id = filesVector[i].fileID;
					file.flashId = flashId;
					file.name = filesVector[i].fileName;
					file.type = filesVector[i].fileType;
					file.size = filesVector[i].fileSize;
					
					fileList.push(file);
				}
				
				// add information about files
				details.target = {files: fileList};
				details.flashId = flashId;
			}
			
			try 
			{
				ExternalInterface.call(callback, details);
			}
			catch (e:Error) {
				trace ("notifyJSFilesEvents error",e);
			}
		}
		
		/**
		 * Send 'ping' event.  
		 * @param status 'ok|error'
		 * @param savedStatus 'ok|error', value from sharedObject
		 * @param error - error's message
		 */		
		public function notifyPing(statusOk:Boolean, savedStatusOk:Boolean, error:String = null):void 
		{
			var details:Object = new Object();
			details.type = "ping";
			details.status = statusOk? 'ok' : 'error';
			details.savedStatus = savedStatusOk? 'ok' : 'error';
			details.flashId = flashId;
			if (error)
				details.error = error;
			
			try 
			{
				ExternalInterface.call(callback, details);
			}
			catch (e:Error) {
				trace ("notifyJSErrors error",e);
			}
		}
		
		/**
		 * Notify JS about errors not related to load and upload process
		 * 
		 * Load and upload errors are handled in special callbacks, so use callJS() for them
		 * @return 
		 * 
		 */		
		public function notifyJSErrors( errorVO:ErrorVO ):void
		{
			try 
			{
				ExternalInterface.call(callback, {type:"error", message:errorVO.getError(), flashId:flashId});
			}
			catch (e:Error) {
				trace ("notifyJSErrors error",e);
			}
		}
	}
}