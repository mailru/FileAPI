package ru.mail.engines.chain.manage
{
	import flash.errors.IllegalOperationError;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.net.FileReference;
	import flash.net.FileReferenceList;
	
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.data.vo.FileVO;
	import ru.mail.engines.chain.AbstractModelJSEngine;
	import ru.mail.engines.commands.AbstractEngineCommand;
	import ru.mail.engines.commands.SelectFilesCommand;
	import ru.mail.engines.events.CommandCompleteEvent;
	import ru.mail.engines.exceptions.WrongEngineCommandType;
	
	/**
	 * Select files, add files to model, send filesInfo
	 *  
	 * @author v.demidov
	 * 
	 */	
	public class SelectFilesEngine extends AbstractModelJSEngine
	{
		public static const TYPE:String = "SelectFilesEngine";
		
		/**
		 * It can be whether FileReferenceList or FileReference. It depends on model.useMultipleSelect value
		 */		
		protected var _fileRefObj:EventDispatcher = null;
		
		protected var _isActive:Boolean = false;
		
		public function SelectFilesEngine()
		{
			super(TYPE);
		}
		
		override public function handle(e:AbstractEngineCommand):void
		{
			var command:SelectFilesCommand = e as SelectFilesCommand;
			
			if (command == null){
				throw new WrongEngineCommandType("{SelectFilesEngine} - handle: command type is: " + command.type + " engine to handle is: " + command.engineToHandleCommandType);
			}
			
			super.handle(command);			
			selectFiles(command.filesFilters);	
		}
		
		/**
		 * browse for files on disk 
		 * @param filesFilter
		 * 
		 */		
		private function selectFiles(filesFilters:Array):void 
		{
			// mail-8225 do not allow multiple sessions
			if (_isActive) 
				return;
			
			var useMultiple:Boolean = _model.useMultipleSelect;
			
			if (useMultiple)
				_fileRefObj = new FileReferenceList();
			else
				_fileRefObj = new FileReference();
			
			_fileRefObj.addEventListener( Event.SELECT, onFilesSelected) ;
			_fileRefObj.addEventListener( Event.CANCEL, onFilesSelectionCanceled) ;
			
			try {
				if (useMultiple)
					(_fileRefObj as FileReferenceList).browse( filesFilters ) ;
				else 
					(_fileRefObj as FileReference).browse( filesFilters ) ;
				
				jsCaller.notifyJSFilesEvents("browse");
				_isActive = true;
			}
			catch(error:Error) {
				trace ("selectFiles error", error);
				
				// call js
				jsCaller.notifyJSErrors( new ErrorVO(error.toString(), 'browseError') );
				
				if ( error is IllegalOperationError) {
					complete(false, _fileRefObj);
				}
				else if ( error is ArgumentError ) {
					complete(false, _fileRefObj);
				}
				else if ( error is Error ) {
					complete(false, _fileRefObj);
				}
			}
		}
		
		private function onFilesSelected(event:Event):void {
			complete( true, event.target as EventDispatcher);
		}
		
		private function onFilesSelectionCanceled(event:Event):void {
			complete( true, event.target  as EventDispatcher, true); 
		}
		
		/**
		 * add files to model, notify js
		 *  
		 * @param fileList
		 * 
		 */		
		private function processFiles(fileList:Array):void
		{
			var fileVO:FileVO;
			var filesListForJS:Vector.<FileVO> = new Vector.<FileVO>();
			
			for each (var fileRef:FileReference in fileList)
			{
				fileVO = _model.filesBuilder.createFileVO(fileRef);
				
				filesListForJS.push(fileVO);
			}
			
			// notifyJS - collect all files in a vector and then send them all at once
			jsCaller.notifyJSFilesEvents("select", filesListForJS);
		}
		
		/**
		 * 
		 * @param isSuccess
		 * @param fileRefrenceList
		 * @param isCanceled
		 * 
		 */		
		private function complete( isSuccess:Boolean, fileRefrenceObj:EventDispatcher, isCanceled:Boolean = false ):void {
			//remove listeners
			fileRefrenceObj.removeEventListener( Event.SELECT, onFilesSelected) ;
			fileRefrenceObj.removeEventListener( Event.CANCEL, onFilesSelectionCanceled) ;
			
			_isActive = false;
			
			var fileList:Array;
			
			if (isCanceled) {
				// notify about cancel
				_jsCaller.notifyJSFilesEvents("cancel");
			}
			else {
				if (fileRefrenceObj is FileReferenceList) {
					fileList = (fileRefrenceObj as FileReferenceList).fileList;
				}
				else {
					fileList = [fileRefrenceObj];
				}
				
				processFiles(fileList);
			}
			
			var event:CommandCompleteEvent = new CommandCompleteEvent(isSuccess);
			dispatchEvent(event);
		}
		
	}
}