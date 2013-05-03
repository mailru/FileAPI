package ru.mail.controller
{
	import flash.display.Loader;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.ProgressEvent;
	import flash.net.URLRequest;
	
	import ru.mail.commands.graphicloader.SimpleGraphicLoader;
	import ru.mail.commands.graphicloader.events.GraphicLoaderCompleteEvent;
	import ru.mail.communication.JSCaller;
	import ru.mail.utils.LoggerJS;

	public class CameraController
	{
		private var _jsCaller:JSCaller;
		private var _view:Sprite;
		
		private var _cameraSwf:*;
		
		public function CameraController(view:Sprite)
		{
			LoggerJS.log('Camera Controller - init');
			
			_jsCaller = JSCaller.jsCaller;
			_view = view;
			
			loadCamera();
		}
		
		private function loadCamera():void
		{
			var loader:SimpleGraphicLoader = new SimpleGraphicLoader(10);
			loader.addEventListener(GraphicLoaderCompleteEvent.TYPE, function(evt:GraphicLoaderCompleteEvent):void {
				if (evt.isSuccess) {
					LoggerJS.log('load camera swf complete');
					_cameraSwf = evt.content;
					_view.addChild(_cameraSwf);
				}
				else {
					LoggerJS.log('load camera swf complete, _isSuccess='+evt.isSuccess+', error='+evt.error.getError());
					// What a pity
				}
			});
			// todo: parametrize swf path
			loader.loadGraphic(new URLRequest('../dist/FileAPI.flash.camera.swf'));
		}
	}
}