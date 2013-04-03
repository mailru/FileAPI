package ru.mail.commands
{
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.IOErrorEvent;
	import flash.events.ProgressEvent;
	import flash.net.FileReference;
	import flash.utils.ByteArray;
	
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.data.vo.FileStatesEnum;
	import ru.mail.data.vo.FileVO;
	import ru.mail.events.ImageTransformCompleteEvent;
	
	/**
	 *
	 * Load bytes from FileReference
	 * 
	 * @author v.demidov
	 * 
	 */	
	public class LoadFileCommand extends EventDispatcher
	{
		private var fileRef:FileReference;
		private var file:FileVO;
		protected var isCancelled:Boolean = false;
		
		public function LoadFileCommand(file:FileVO)
		{
			super();
			
			if ( null == file )
				throw new Error( "LoadFileCommand fileVO is null" ) ;
			
			this.file = file;
			fileRef = file.fileRef; // shortcut
			
			fileRef.addEventListener(IOErrorEvent.IO_ERROR, onLoadError);
			fileRef.addEventListener(ProgressEvent.PROGRESS, onProgress);
			fileRef.addEventListener(Event.COMPLETE, onLoadComplete);
		}
		
		public function execute():void
		{
			try
			{
				// change file status to prevent simultanious uploading and loading
				file.status = FileStatesEnum.LOADING;
				// load
				fileRef.load() ;
			}
			catch ( e:Error ){
				complete( false, null, new ErrorVO(e.toString()) ); 
			}
		}
		
		/**
		 * it cancels load and disposes the object
		 */
		public function cancel():void
		{
			try{
				isCancelled = true;
				
				fileRef.cancel();
				
				dispose();
			}catch(e:Error){
				trace ("LoadFileCommand cancel() error: "+e.toString());
			}
			
			file.status = FileStatesEnum.SELECTED;
		}
		
		public function dispose():void 
		{
			fileRef.removeEventListener( Event.COMPLETE, onLoadComplete);
			fileRef.removeEventListener( IOErrorEvent.IO_ERROR, onLoadError );
			fileRef.removeEventListener(ProgressEvent.PROGRESS, onProgress);
		}
		
		private function onLoadError(event:IOErrorEvent):void
		{
			complete( false, null, new ErrorVO(event.toString(), IOErrorEvent.IO_ERROR) );
		}
		
		private function onProgress(event:ProgressEvent):void
		{
			dispatchEvent(event.clone());
		}
		
		/**
		 * step 1 complete, 
		 * step 2: create bitmap
		 * @param event
		 * 
		 */		
		private function onLoadComplete(event:Event):void
		{
			if (isCancelled) {
				return;
			}
			else if (file.fileData != null)
			{
				complete( true, file.fileData );
			}
			else {
				complete( false, null, new ErrorVO("Error #1009: Loaded data is null.") );
			}
		}
		
		private function complete(isSuccess:Boolean, data:ByteArray, error:ErrorVO = null):void
		{
			dispatchEvent( new ImageTransformCompleteEvent(isSuccess, data, error) );
		}
	}
}