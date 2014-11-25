package ru.mail.controller
{
	import by.blooddy.crypto.Base64;
	
	import flash.display.Graphics;
	import flash.display.Sprite;
	import flash.display.Stage;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.ProgressEvent;
	import flash.events.TextEvent;
	import flash.events.TimerEvent;
	import flash.events.UncaughtErrorEvent;
	import flash.net.FileFilter;
	import flash.net.URLRequest;
	import flash.system.Security;
	import flash.utils.Timer;
	import flash.utils.setTimeout;
	
	import ru.mail.commands.LoadFileCommand;
	import ru.mail.commands.UploadCommand;
	import ru.mail.commands.textloader.SimpleTextLoader;
	import ru.mail.commands.textloader.events.TextLoaderCompleteEvent;
	import ru.mail.communication.*;
	import ru.mail.data.AttachmentsModel;
	import ru.mail.data.IImageFactory;
	import ru.mail.data.vo.BaseFileVO;
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.data.vo.IFileVO;
	import ru.mail.data.vo.ImageTransformVO;
	import ru.mail.engines.chain.AbstractEngine;
	import ru.mail.engines.chain.EnginesFactory;
	import ru.mail.engines.chain.manage.SelectFilesEngine;
	import ru.mail.engines.chain.presentation.MouseListenerEngine;
	import ru.mail.engines.commands.AbstractEngineCommand;
	import ru.mail.engines.commands.MouseListenerEngineCommand;
	import ru.mail.engines.events.CommandCompleteEvent;
	import ru.mail.events.ImageTransformCompleteEvent;
	import ru.mail.events.UploadCompleteEvent;
	import ru.mail.utils.LoggerJS;

	/**
	 * Application controller.
	 *  
	 * @author v.demidov
	 * 
	 */	
	public class AppController extends EventDispatcher
	{
		private var _model:AttachmentsModel;
		
		private var _jsCaller:JSCaller;
		private var _jsCallbackPresenter:JSCallbackPresenter;
		
		private var _view:Sprite;
		
		private var _options:Object; // flashvars {callback, ping}
		
		/**
		 * root of engines chain
		 */
		private var _chainRoot:AbstractEngine = null;
		
		/**
		 * call js ready notification until it responce
		 */		
		private var readyTimer:Timer = new Timer(10);
		private var readyTimerCount:int = 0;
		
		/**
		 * Controller for managing camera swf
		 */		
		public var cameraController:CameraController;
		
		/**
		 * 
		 * @param graphicContext
		 * @param options {callback, ping}
		 * 
		 */		
		public function AppController(graphicContext:Sprite, options:Object)
		{
			// init model
			_model = AttachmentsModel.model;
			// init js
			_jsCaller = JSCaller.jsCaller;
			
			// configure js callbacks
			_jsCallbackPresenter = new JSCallbackPresenter(this);
			
			// init view
			_view = graphicContext;
			initView(graphicContext);
			
			// parse flashvars
			_options = options;
			JSCaller.callback = getJsFunctionName(options, JSCaller.callback);
			// logger
			LoggerJS.enable(!!options["debug"]);
			// error store prefix
			_model.storeKey = options["storeKey"];
			LoggerJS.log("storeKey="+_model.storeKey);
			_model.updateHasError();
			checkSOClear(options);
			// get flashId from flashvars
			if (options["flashId"]) {
				JSCaller.flashId = options["flashId"];
			}

			// use camera 
			// options["useCamera"], if not false, contains url to camera swf
			_model.useCamera = options["useCamera"];
			if (_model.useCamera && _model.useCamera !== 'false') {
				setupCamera();
			}

			// abort timeout
			_model.timeout = options["timeout"];
			LoggerJS.log("timeout="+_model.timeout);

			setupChain();
			configureListeners();
			
			// check ping and complete initialisation
			completeInitialization(options);
		}
		
		//===================================================
		//
		//                 Initialization
		//
		//===================================================
		
		/**
		 * We need transparent sprite to listen to mouseEvents
		 * JS places it over its button 
		 * @param graphicContext
		 * 
		 */		
		private function initView(graphicContext:Sprite):void
		{
			// init with some default dimensionsm then listen to Stage resize event
			resizeView(graphicContext, 1000, 1000);
			
			// use hand cursor true
			setCursor("pointer");
		}
		
		/**
		 * Draw transparent rectangle with given dimenions 
		 * @param graphicContext
		 * @param width
		 * @param height
		 * 
		 */		
		private function resizeView(graphicContext:Sprite, width:Number, height:Number):void
		{
			var g:Graphics = graphicContext.graphics;
			g.clear();
			g.beginFill(0xCCCCCC, 0);
			g.moveTo(0,0);
			g.lineTo(width,0);
			g.lineTo(width,height);
			g.lineTo(0,height);
			g.lineTo(0,0);
			g.endFill();
		}
		
		/**
		 * construct chain of engines
		 */
		private function setupChain():void 
		{
			if (!_model.useCamera) {
				// init factory
				var factory:EnginesFactory = EnginesFactory.getEnginesFactory();
				var engine:AbstractEngine = null;
				
				engine = factory.getFactory(SelectFilesEngine.TYPE);
				_chainRoot = engine;
				engine.addEventListener(CommandCompleteEvent.TYPE, onFilesSelected);
				
				engine = factory.getFactory(MouseListenerEngine.TYPE);
				_chainRoot.addEngine(engine);
				(engine as MouseListenerEngine).view = _view;
			}
		}
		
		private function configureListeners():void
		{
			// listener for events from controller and from bubbled events
			addEventListener(AbstractEngineCommand.COMMAND_EVENT_TYPE, onEngineCommand);
			
			// subscribe all engines to AbstractEngineCommand event
			var engine:AbstractEngine = _chainRoot;
			
			while (engine)
			{
				engine.addEventListener(AbstractEngineCommand.COMMAND_EVENT_TYPE, onEngineCommand);
				engine = engine.next;
			}
		}
		
		private function setupCamera():void
		{
			cameraController = new CameraController(_view);
		}
		
		/**
		 * Get JS function name from options 
		 * @param defaultFunctionName
		 * @return 
		 * 
		 */		
		private function getJsFunctionName (options:Object, defaultFunctionName:String):String{
			var functionName:String = options[defaultFunctionName];
			if(functionName == null || functionName == ""){
				return defaultFunctionName;
			} else {
				return functionName;
			}
		}
		
		/**
		 * check if we have to clear shared object 
		 * @param options
		 */		
		private function checkSOClear(options:Object):void
		{
			if (options["clearError"] == "1") {
				LoggerJS.log("clear saved error");
				_model.clearError();
			}
		}
		
		/**
		 * Check that network is available, if needed, and notify js about ready  
		 * Use ping urls from flashvars,
		 * Notify about flash ready only if ping successed
		 */		
		private function completeInitialization(options:Object):void
		{
			var pingUrls:Array = getPing(options);
			if (pingUrls && pingUrls.length > 0) {
				var checksRemaining:int = pingUrls.length;
				for(var i:uint = 0; i < pingUrls.length; i++) 
				{
					var checkPingLoader:SimpleTextLoader = new SimpleTextLoader();
					if(pingUrls[i] == "") {
						checksRemaining--;
						if (checksRemaining == 0) {
							if (_model.hasError) {
								_jsCaller.notifyPing(true, false, "has saved error 2038");
							}
							else {
								_jsCaller.notifyPing(true, true);
							}
							notifyJSAboutAppReady(); // ready
						}
						continue;
					}
					
					Security.loadPolicyFile( createPingRequest(pingUrls[i]) );
					
					checkPingLoader.addEventListener(TextLoaderCompleteEvent.TYPE, function(event:TextLoaderCompleteEvent):void {
						event.currentTarget.removeEventListener(event.type, arguments.callee);
						if (event.isSuccess) {
							checksRemaining --;
							if (checksRemaining == 0) {
								if (_model.hasError) {
									// check shared object, if it contains information about error 2038, do not call ready
									// instead, notify about this error
									_jsCaller.notifyPing(true, false, "has saved error 2038");
								}
								else {
									_jsCaller.notifyPing(true, true);
								}
								notifyJSAboutAppReady(); // ready even if saved error 
							}
						}
						else {
							_jsCaller.notifyPing(false, !_model.hasError, "failed to ping "+request.url);
							if (!_model.hasError) {
								_model.hasError = true;
							}
						}
					});
					
					var request:URLRequest = new URLRequest( createPingRequest(pingUrls[i]) );
					checkPingLoader.loadText( request );
				}
			}
			else {
				// no ping required
				// initialisation complete, notifyJS
				notifyJSAboutAppReady();
			}
		}
		
		/**
		 * parse ping urls from flashvars 
		 */		
		private function getPing(options:Object):Array {
			var urls:Array;
			var fvUrls:String = options["ping"];
			if(fvUrls != null && fvUrls != "") {
				urls = fvUrls.split(",");
			}
			return urls;
		}
		
		private function createPingRequest(url:String):String
		{
			return new String().concat(url, "/crossdomain.xml", "?", Math.random());
		}
		
		private function notifyJSAboutAppReady():void
		{
			// wait for boolean answer
			readyTimer.addEventListener(TimerEvent.TIMER, onReadyTimer);
			
			readyTimer.start();
		}
		
		private function onReadyTimer(event:TimerEvent):void
		{
			if (_jsCaller.notifyJSAboutAppReady(++readyTimerCount))
			{
				readyTimer.removeEventListener(TimerEvent.TIMER, onReadyTimer);
				readyTimer.stop();
			}
		}
		
		//===================================================
		//
		//                 Events
		//
		//===================================================
		
		/**
		 * choose engine and handle command  
		 * @param command
		 */		
		private function onEngineCommand(command:AbstractEngineCommand):void
		{
			var commandHandlers:Vector.<AbstractEngine> = new Vector.<AbstractEngine>();
			try {
				commandHandlers = _chainRoot.isCommandHandable(command);
			}
			catch(error:Error) {
			}
			
			var handlerToUse:AbstractEngine = null;
			
			if (commandHandlers.length == 1) {
				handlerToUse = commandHandlers[0];
			}
			else if (commandHandlers.length == 0) {
				trace("No one engine could handle this command. Type is " + command.commandType);
			}
			else if (commandHandlers.length > 1) {
				handlerToUse = commandHandlers[0];
				trace("there is several engine to handle this command! Using only first by default. Type is " + command.commandType);
			}
			
			//execute current command
			if (handlerToUse != null) {
				try {
					handlerToUse.handle(command);
				}
				catch(error:Error) {
					trace ("onEngineCommand - calling handle on engine caused error:", error.message);
					_jsCaller.notifyJSErrors( new ErrorVO( error.toString() ) );
				}
			}
		}
		
		public function onStageResize(event:Event):void
		{
			// disabled. Now flash has very big size (oh, yeah!) but cropped by its html container
			//resizeView (_view, (event.target as Stage).stageWidth, (event.target as Stage).stageHeight);
		}
		
		private function onFilesSelected(event:CommandCompleteEvent):void
		{
			// enable rollout
			dispatchEvent(new MouseListenerEngineCommand(true));
		}
		
		/**
		 * Global Error Events Listener <br>
		 * Listen for all uncaught events and log them.
		 * 
		 * public: subscription is in the main application file.
		 *  
		 * @param event
		 * 
		 */		
		public function onUncaughtError(event:UncaughtErrorEvent):void 
		{
			if (event && event.error) {
				LoggerJS.log("Uncaught error: "+event.error);
			}
		}
		
		//===================================================
		//
		//                 JS Callbacks
		//
		//===================================================
		
		/**
		 * Set new file filter 
		 * 
		 * @param string  'jpg,gif,...' or  '*'
		 * 
		 * extension: it must be a semicolon-delimited list of file extensions, 
		 * with a wildcard (*) preceding each extension, 
		 * as shown in the following string: "*.jpg;*.gif;*.png"
		 * 
		 */		
		public function setTypeFilter(str:String):void
		{
			var filter:FileFilter;
			var filtersArray:Array = [];
			
			try
			{
				if (str && str.length > 0) {
					// convert to fileFilter format
					str = str.replace(new RegExp(",", "g"), ";*.");
					// add first wildcard
					str = "*."+str;
					
					filter = new FileFilter("Files", str);
					filtersArray.push(filter);
				}
			}
			catch (e:Error) {
				trace("setTypeFilter error")
			}
			
			if (filtersArray.length > 0)
			{
				trace ("setTypeFilter sucsessful");
				_model.fileFilters = filtersArray;
			}
		}
		
		/**
		 * set cursor type
		 * in case type is "poiter" - use hand cursor
		 * in case "default" - use default arrow 
		 * @param type
		 * 
		 */		
		public function setCursor(type:String):void
		{
			trace ("{AppController} - setCursor", type);
			switch (type)
			{
				case "pointer":
					_view.useHandCursor = true;
					_view.buttonMode = true;
					break;
				default:
					_view.useHandCursor = false;
					_view.buttonMode = false;
					break;
			}
		}
		
		/**
		 * If mouse is over the view, then return true 
		 * @return 
		 * 
		 */		
		public function hitTest():Boolean
		{
			var stage:Stage = _view.stage;
			var result:Boolean = false;
			
			if (   stage.mouseX >= 0 && stage.mouseX <= stage.stageWidth
				&& stage.mouseY >= 0 && stage.mouseY <= stage.stageHeight)
			{
				result = true;
			}
			
			LoggerJS.log("hitTest, mouse: "+ stage.mouseX+", "+ stage.mouseY+ ", result = "+ result);
			
			return result;
		}
		
		/**
		 * Set files select type 
		 * @param value -	if true, select multiple files (use FileReferenceList), 
		 * 					if false, select 1 file (use FileReference)
		 * 
		 */		
		public function setMultipleSelect(value:Boolean):void
		{
			_model.useMultipleSelect = value;
//			LoggerJS.log("set multiple, value: "+ _model.useMultipleSelect);
		}
		
		//===================== load, resize ===================
		
		/**
		 * Load file, return some its properties,
		 * currently for images only. width, heigth, exif rotation.  
		 * @param fileID
		 * @param callback
		 * 
		 */		
		public function getFileInfo(fileID:String, callback:String):void 
		{
			LoggerJS.log('getFileInfo, fileID: '+fileID+', callback: '+callback );
			var file:BaseFileVO = _model.filesBuilder.getFileByID(fileID);
			if (!file) {
				LoggerJS.log("getFileInfo, file with id "+ fileID +" doen't exist" );
				return;
			}
			
			var imageFactory:IImageFactory = file.imageFactory;
			(imageFactory as EventDispatcher).addEventListener(ImageTransformCompleteEvent.TYPE,function (event:ImageTransformCompleteEvent):void {
				event.currentTarget.removeEventListener(event.type, arguments.callee);
				LoggerJS.log("getFileInfo complete, success = "+ event.isSuccess );
				if (event.isSuccess && (file as IFileVO).imageData) 
				{
					// report file info
					var info:Object = { "width":(file as IFileVO).imageData.width
										, "height":(file as IFileVO).imageData.height
										};
					LoggerJS.log("getFileInfo imageFactory.readExif()");
					var exif:Object = imageFactory.readExif();
					if ( exif ) {
						info["exif"] = exif;
					}
					_jsCaller.callJS(callback, false, info);
				}
				else {
					// report error
					_jsCaller.callJS(callback, event.error.getError() );
				}
			});
				
			imageFactory.createImage(null);
		}
		
		/**
		 * Transform image, return base64 string with transformed image.
		 * If needed, load file before transform (if it wasn't loaded yet) 
		 * @param fileID
		 * @param trans
		 * @param callback
		 */		
		public function imageTransform(fileID:String, trans:Object, callback:String):void 
		{
			try {
				// transform image and return base64
				var file:BaseFileVO = _model.filesBuilder.getFileByID(fileID);
				if (!file) {
					trace ("file with id "+ fileID +" doen't exist"); 
					return;
				}
				
				LoggerJS.log("imageTransform, fileId = "+fileID);
				
				var imageFactory:IImageFactory = file.imageFactory;
				(imageFactory as EventDispatcher).addEventListener(ImageTransformCompleteEvent.TYPE,function (event:ImageTransformCompleteEvent):void {
					event.currentTarget.removeEventListener(event.type, arguments.callee);
					trace("imageTransform complete", event.isSuccess);
					if (event.isSuccess) {
						_jsCaller.callJS( callback, false, Base64.encode(event.data) );
					}
					else {
						// report error
						_jsCaller.callJS(callback, event.error.getError() );
					}
				});
				
				imageFactory.createImage( trans
                        ? new ImageTransformVO(trans.sx, trans.sy, trans.sw, trans.sh, trans.dw, trans.dh, trans.deg, trans.type, trans.quality, (trans.overlay is Array)? trans.overlay : [trans.overlay], trans.multipass)
                        : null);
				}
			catch (e:Error){
				LoggerJS.log('imageFactory createImage error: '+e.toString());
				_jsCaller.notifyJSErrors(new ErrorVO(e.toString()));
			}
		}
		
		
		//===================== upload ========================= 
		
		/**
		 * 
		 * @param url - where to upload
		 * @param uploadPostData - URLVariables
		 * @param headers - custom request headers for URLLoader
		 * @param files - object with files uids and matrix objects <br>
		 *  exapmle - files: {
		 * 			'filename[original]': { 
		 * 							id
		 * 							, name
		 * 							, matrix:null
		 * 			, 'filename[XL]': { id
		 * 								, name
		 * 								, matrix:{
		 * 									sx
		 * 									...
		 * 									,deg
		 * 									, type:'image/png'
		 * 									, quality: 1 // jpeg quality, от 0 до 1
		 * 									, overlay: [  // an array of images to place over the image:
		 * 										{ x: 0, y: 0, opacity: .5, src: '...' // base64 or url }
		 * 										, { x: 0, y: 0, w: 120, h: 30, opacity: 1, src: '...' }
		 * 										 ]
		 * 								}
		 * 							 } 
		 * 						}
		 * 	when there is only 1 file with null matrix, file will be uploaded using fileReference
		 * @param callback
		 * 
		 */		
		public function uploadFile( url:String
									, uploadPostData:Object
								   , headers:Object
								   , files:Object
									 , callback:String ):void 
		{
			trace ("upload file")
			try {
				LoggerJS.log("call upload, files: "+files);
					
				// get files
				var file:BaseFileVO;
				if (files) {
					for (var s:String in files)
					{
						file = _model.filesBuilder.getFileByID(files[s].id);
						if (!file) {
							trace ("file with id "+ files[s].id +" doen't exist"); 
							LoggerJS.log("upload: file with id "+ files[s].id + " doen't exist"); 
							return;
						}
						files[s].file = file;
					}
				} else {
					// https://github.com/mailru/FileAPI/issues/83
					// upload request without files
					// add fake file to avoid error in ImageFactory, but do not upload it
					file = _model.filesBuilder.createFakeFileVO('dummy');
					files = {'dummy':{'id': 'dummy', 'file':file, 'name':'', 'matrix':{} }};
					LoggerJS.log("upload without files");
				}
			
				// launch command
				var httpStatus:String;
				var uploadCommand:UploadCommand = new UploadCommand(url
												, uploadPostData, headers
												, files );
			
				uploadCommand.addEventListener(UploadCompleteEvent.TYPE, function(event:UploadCompleteEvent):void {
					// complete
					if (event.isSuccess) {
						var result:String = event.result.toString().split("%").join("%25")
																	.split("\\").join("%5c")
																	.split("\"").join("%22")
																	.split("&").join("%26");
						_jsCaller.callJS( callback, {type:"complete", result:result, status:httpStatus} );
					}
					else {
						if (event.error.error.indexOf("#2038") > -1) {
							_model.hasError = true;
						}
						_jsCaller.callJS( callback, {type:"error", message:event.error.getError(), status:event.error.httpStatus } ); 
						//TODO replace with httpStatus, и вообще в complete статус передастся только через urlLoader, в случае fileReference никогда мы его не узнаем.
					}
					
					uploadCommand.dispose();
				});
				
				uploadCommand.addEventListener(ProgressEvent.PROGRESS, function(progressEvent:ProgressEvent):void {
					_jsCaller.callJS( callback, {type:"progress", loaded: progressEvent.bytesLoaded, total: progressEvent.bytesTotal} );
				});
				
				uploadCommand.addEventListener("httpStatus", function(textEvent:TextEvent):void {
					httpStatus = textEvent.text;
					//_jsCaller.callJS( callback, {type:"httpStatus", message:(textEvent as TextEvent).text} );
				});
				
				// save command
				file.uploadCommand = uploadCommand;
				// run
				uploadCommand.execute();
			}
			catch (err:Error) {
				LoggerJS.log("upload error: "+err.toString());
				_jsCaller.notifyJSErrors( new ErrorVO( err.toString() ) );
			}
		}
		
		//===================== clear, cancel ========================= 
		/**
		 * If file is in uploading state, cancel the upload.
		 * Remove file from model. 
		 * @param fileID
		 * 
		 */		
		public function cancelFile(fileID:String, force:Boolean = false):void
		{
			trace ("{AppController} - cancelFile", fileID);
			
			var file:BaseFileVO = _model.filesBuilder.getFileByID(fileID);
			if (!file) {
				LoggerJS.log("abort: file with id "+ fileID +" doen't exist");
				trace ("file with id "+ fileID +" doen't exist"); 
				return;
			}
			
			if (file.uploadCommand) {
				(file.uploadCommand as UploadCommand).cancel();
				file.uploadCommand = null;
			}
			if (file.loadCommand) {
				(file.loadCommand as LoadFileCommand).cancel();
				file.loadCommand = null;
			}
			if (_model.timeout && !force) {
				LoggerJS.log("abort remove set timeout");
				file.timeout = setTimeout(function(_model:AttachmentsModel, file:BaseFileVO):void {
					LoggerJS.log("abort remove on timeout");
					_model.filesBuilder.removeFile(file);
				},_model.timeout, _model, file);
			} else {
				LoggerJS.log("abort remove immediately");
				_model.filesBuilder.removeFile(file);
				file = null;
			}
		}
		
		/**
		 * Clear all data and release memory 
		 */		
		public function clear():void
		{
			LoggerJS.log('clear');
			var files:Vector.<BaseFileVO> = _model.filesBuilder.items;
			
			for each (var file:BaseFileVO in files) {
				cancelFile(file.fileID, true);
			}
			_model.filesBuilder.removeAllFiles();
		}
		
		/**
		 * clear shared object's data 
		 */		
		public function clearError():void {
			_model.clearError();
			completeInitialization(_options);
		}
		
	}
}
