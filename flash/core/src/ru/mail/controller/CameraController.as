package ru.mail.controller
{
	import flash.display.BitmapData;
	import flash.display.Loader;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.ProgressEvent;
	import flash.events.StatusEvent;
	import flash.net.URLRequest;
	
	import ru.mail.commands.graphicloader.SimpleGraphicLoader;
	import ru.mail.commands.graphicloader.events.GraphicLoaderCompleteEvent;
	import ru.mail.communication.JSCaller;
	import ru.mail.data.AttachmentsModel;
	import ru.mail.utils.LoggerJS;

	public class CameraController
	{
		private var _jsCaller:JSCaller;
		private var _model:AttachmentsModel;
		private var _view:Sprite;
		
		private var _cameraSwf:*;
		
		public function CameraController(view:Sprite)
		{
			LoggerJS.log('Camera Controller - init');
			
			_view = view;
			_jsCaller = JSCaller.jsCaller;
			_model = AttachmentsModel.model;
			
			loadCamera();
		}
		
		public function cameraOn(callback:String):void
		{
			LoggerJS.log('camera.on called');
			try {
				_cameraSwf.toggleCamera(true);
				_jsCaller.callJS(callback, {error:null});
			} catch (e:Error) {
				_jsCaller.callJS(callback, {error:e.toString()});
			}
		}
		
		public function cameraOff():void
		{
			LoggerJS.log('camera.off called');
			_cameraSwf.toggleCamera(false);
		}
		
		public function shot(callback:String):void
		{
			LoggerJS.log('smile please!');
			var bm:BitmapData = _cameraSwf.shot();
			if (bm == null) {
				_jsCaller.callJS(callback, {error:'shot error'});
			}
			LoggerJS.log('shot image w:'+bm.width+', h:'+bm.height);
		}
		
		// ============= init ================
		
		private function loadCamera():void
		{
			var loader:SimpleGraphicLoader = new SimpleGraphicLoader(10);
			loader.addEventListener(GraphicLoaderCompleteEvent.TYPE, function(evt:GraphicLoaderCompleteEvent):void {
				if (evt.isSuccess) {
					LoggerJS.log('load camera swf complete');
					try {
						_cameraSwf = evt.content;
						_cameraSwf.addEventListener(StatusEvent.STATUS, onCameraStatus);
						_view.addChild(_cameraSwf);
					} catch (e:Error) {
						LoggerJS.log('attach camera fail: '+e.toString());
						initComplete(false, evt.error.getError());
					}
					
				}
				else {
					LoggerJS.log('load camera swf complete, _isSuccess='+evt.isSuccess+', error='+evt.error.getError());
					// What a pity
					initComplete(false, evt.error.getError());
				}
			});
			// todo: parametrize swf path
			loader.loadGraphic(new URLRequest('../dist/FileAPI.flash.camera.swf'));
		}
		
		private function onCameraStatus(event:StatusEvent):void
		{
			LoggerJS.log('onCameraStatus '+event.code);
			if (event.code == 'Camera.Unmuted') {
				// report ok
				initComplete(true);
			} else if (event.code == 'Camera.Muted') {
				// report user denied
				initComplete(false, 'user denied access to camera');
			} else {
				// report this strange thing
				initComplete(false, 'unknown camera status: '+event.code);
			}
		}
		
		private function initComplete(success:Boolean, error:String = null):void
		{
			_jsCaller.notifyCameraStatus(success? null : error);
		}
	}
}