package ru.mail.commands
{
	import flash.events.EventDispatcher;
	import flash.events.ProgressEvent;
	import flash.events.TextEvent;
	
	import ru.mail.data.IImageFactory;
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.data.vo.FakeFileVO;
	import ru.mail.data.vo.FileVO;
	import ru.mail.data.vo.IFileVO;
	import ru.mail.data.vo.ImageTransformVO;
	import ru.mail.events.ImageTransformCompleteEvent;
	import ru.mail.events.UploadCompleteEvent;
	import ru.mail.utils.LoggerJS;
	
	/**
	 * Upload command handles uploading process:
	 * 1) only original file - upload it using filereference
	 * 2) set of transformed images with or without original - 
	 * upload them all at once using multipart uploader
	 * 
	 * get transformed images if needed,
	 * watch progress
	 * @author v.demidov
	 * 
	 */	
	public class UploadCommand extends EventDispatcher
	{
		private static var INIT:String = "init";
		private static var ORIGINAL:String = "original";
		/**
		 * {"original":byteArray, "XL": "init", "S": byteArray, "M": errorVO}
		 * command - executing command
		 * "init" - preparing image for upload
		 * bytearray - ready to create upload command
		 * serverResponce - upload complete
		 * error - errorVO
		 */		
		private var filesPool:Object = {};
		
		private var url:String;
		private var uploadPostData:Object;
		private var headers:Object;
		private var files:Object;
		
		private var currentUploadCommand:AbstractUploadFileCommand;
		
		public function UploadCommand(url:String
									  , uploadPostData:Object
									  , headers:Object
										, files:Object)
		{
			super();
			
			this.url = url;
			this.uploadPostData = uploadPostData;
			this.headers = headers;
			this.files = files;
		}
		
		public function execute():void
		{
			var useMultiple:Boolean = false;
			var count:int = 0;
			
			// check transform
			var s:String;
			// init filesPool. We must init all its fields before calling checkPool function
			for (s in files) 
			{
				filesPool[s] = INIT;
				count++;
				if (!useMultiple && (files[s].matrix != null || files[s].overlay != null || count > 1)) {
					// if there are several files or at least one with matrix, we cannot use fileReference
					useMultiple = true;
				}
			}
			
			LoggerJS.log("UploadCommand: use fileReference upload = "+!useMultiple);
			// then create transformed images
			for (s in files) 
			{
				if (useMultiple) {
					// create transformed image, then upload it
					createImage(s, files[s].file, files[s].matrix);
				}
				else {
					uploadOriginal(s, files[s].file);
				}
			}
		}
		
		public function cancel():void
		{
			if (currentUploadCommand)
				currentUploadCommand.cancel();
			dispose();
		}
		
		public function dispose():void
		{
			filesPool = null;
			headers = null;
			files = null;
		}
		
		//=================== prepare ========================
		
		private function createImage(s:String, file:IFileVO, trans:Object):void 
		{
			LoggerJS.log("get image data for "+s);
			// add to queue
			filesPool[s] = INIT;
			var fileName:String = file.fileNameModified;
			
			if(file is FakeFileVO) {
				// upload with no filedata
				filesPool[s] = new Object()
				filesPool[s][fileName] = null;
				checkFilesPool();
			}
			else {
				// get transformed image data
				var imageFactory:IImageFactory = file.imageFactory;
				(imageFactory as EventDispatcher).addEventListener(ImageTransformCompleteEvent.TYPE,function (event:ImageTransformCompleteEvent):void {
					event.currentTarget.removeEventListener(event.type, arguments.callee);
					trace("createImage imageTransform complete", event.isSuccess);
					if (event.isSuccess) {
						// upload transformed image
						filesPool[s] = new Object()
						filesPool[s][fileName] = event.data;
					}
					else {
						complete(false, null, event.error);
					}
					checkFilesPool();
				});
				
				imageFactory.createImage( trans
                        ? new ImageTransformVO(trans.sx, trans.sy, trans.sw, trans.sh, trans.dw, trans.dh, trans.deg, trans.type, trans.quality, (trans.overlay is Array)? trans.overlay : [trans.overlay], trans.multipass)
                        : null );
			}
		}
		
		
		private function checkFilesPool():void
		{
			trace ("checkFilesPool")
			// check images ready
			for (var s:String in filesPool)
			{
				trace ("filesPool["+s+"]="+filesPool[s].length);
				if (filesPool[s] == INIT) {
					// wait for loading this image
					return;
				}
			}
			
			// since we are here, then all images are ready
			uploadImages();
		}
		
		//=================== upload =========================
		
		/**
		 * create and handle command for uploading transformed image 
		 */		
		private function uploadImages():void
		{
			LoggerJS.log("launch multipart upload command");
			// create multipart command
			var command:AbstractUploadFileCommand = new UploadImageCommand( filesPool, url
																		, headers, uploadPostData );
			
			upload(command);
		}
		
		/**
		 * create and handle command for uploading fileReference 
		 */		
		private function uploadOriginal(name:String, file:IFileVO):void 
		{
			LoggerJS.log("launch filereference upload command");
			// launch filereference upload command
			var command:AbstractUploadFileCommand = new UploadFileCommand((file as FileVO).fileRef, url
																		, headers, uploadPostData
																		, name);
			
			upload(command);
		}
		
		private function upload( command:AbstractUploadFileCommand ):void 
		{
			command.addEventListener(UploadCompleteEvent.TYPE, function(event:UploadCompleteEvent):void {
				event.currentTarget.removeEventListener(event.type, arguments.callee);
				// complete
				complete(event.isSuccess, event.result, event.error);
				command.dispose();
			});
			
			command.addEventListener(ProgressEvent.PROGRESS, function(progressEvent:ProgressEvent):void {
				// notify progress
				dispatchEvent( progressEvent.clone() );
			});
			
			command.addEventListener("httpStatus", function(textEvent:TextEvent):void {
				dispatchEvent( textEvent.clone() );
			});
			
			// save command
			currentUploadCommand = command;
			
			command.execute();
		}
		
		//=================== complete =======================
		
		private function complete(isSuccess:Boolean, result:String, error:ErrorVO):void 
		{
			dispatchEvent( new UploadCompleteEvent(isSuccess, result, error) );
		}
	}
}