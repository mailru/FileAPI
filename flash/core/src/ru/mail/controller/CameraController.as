package ru.mail.controller
{
	import flash.display.BitmapData;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.StatusEvent;
	import flash.net.URLRequest;
	
	import ru.mail.commands.graphicloader.SimpleGraphicLoader;
	import ru.mail.commands.graphicloader.events.GraphicLoaderCompleteEvent;
	import ru.mail.communication.JSCaller;
	import ru.mail.data.AttachmentsModel;
	import ru.mail.data.vo.PhotoFileVO;
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
				_cameraSwf.addEventListener('Camera.On', function(event:Event):void {
					_jsCaller.callJS(callback, {error:null}, null, true);
				});
				_cameraSwf.toggleCamera(true);
			} catch (e:Error) {
				_jsCaller.callJS(callback, {error:e.toString()}, null, true);
			}
		}
		
		public function cameraOff():void
		{
			LoggerJS.log('camera.off called');
			_cameraSwf.toggleCamera(false);
		}
		
		public function shot():Object
		{
			LoggerJS.log('smile please!');
			var bm:BitmapData = _cameraSwf.shot();
			var result:Object = {};
			if (bm == null) {
				LoggerJS.log('shot image error');
				result.error = 'create shot fail';
			}
			else {
				LoggerJS.log('shot image w:'+bm.width+', h:'+bm.height);
				var fileVO:PhotoFileVO = _model.filesBuilder.createPhotoFileVO(bm);
				result.id = fileVO.fileID;
				result.type = fileVO.fileType;
				result.size = fileVO.fileSize;
				result.width = fileVO.imageData.width;
				result.height = fileVO.imageData.height;
			}
			
			return result;
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
			
			loader.loadGraphic(new URLRequest(_model.useCamera || 'FileAPI.flash.camera.swf'));
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