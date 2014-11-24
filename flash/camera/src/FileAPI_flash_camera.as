package
{
	import flash.display.BitmapData;
	import flash.display.Sprite;
	import flash.display.StageAlign;
	import flash.display.StageScaleMode;
	import flash.events.Event;
	import flash.events.StatusEvent;
	import flash.media.Camera;
	import flash.media.Video;
	import flash.utils.setTimeout;
	
	public class FileAPI_flash_camera extends Sprite
	{
		private var video:Video;
		private var camera:Camera;
		
		public function FileAPI_flash_camera()
		{
			if (stage)
				init();
			else 
				addEventListener(Event.ADDED_TO_STAGE, init);
			
		}

		public function init(e:Event = null):void 
		{
			if(e)
				removeEventListener(Event.ADDED_TO_STAGE, init);
			
			stage.scaleMode = StageScaleMode.SHOW_ALL;
			stage.align = StageAlign.TOP_LEFT;

			// init camera
			camera = Camera.getCamera();
			if (camera != null) {
				camera.addEventListener(StatusEvent.STATUS, onCameraStatus);
				// we need to show settings dialog, so we attach camera to a video
				video = new Video();
				video.attachCamera(camera);
				if (!camera.muted) {
					onCameraStatus(new StatusEvent(StatusEvent.STATUS, false, false, 'Camera.Unmuted'));
				}
				else {
					setTimeout(function ():void {
						if (securityPanelIsClosed()) {
							onCameraStatus(new StatusEvent(StatusEvent.STATUS, false, false, 'Camera.Muted'));
						}
					}, 1000);
				}
				
			} else {
				// callback with error
			}
		}
		
		public function toggleCamera(on:Boolean):void {
			trace('toggleCamera',on);
			if (on) {
				if (video != null) {
					// turn current video off
					toggleCamera(false);
				}
				trace('stage width',stage.stageWidth,'stage w',stage.width,'camera width',camera.width);
				var w:Number = stage.stageWidth;
				var h:Number = stage.stageHeight; //stage.stageWidth * camera.height / camera.width;
				camera.setMode(w, h, camera.fps);
				video = new Video(w, h);
				video.attachCamera(camera);
				
				video.addEventListener(Event.ADDED_TO_STAGE, function(event:Event):void {
					trace('video addedToStage');
					// now the camera is visible
					dispatchEvent(new Event('Camera.On'));
				});
				addChildAt(video,0);
			} else {
				if(video)
					removeChild(video);
				video = null;
			}
		}
		
		public function shot():BitmapData {
			if (video) {
				trace('click!', video.width, stage.stageWidth);
				try{
					var bm:BitmapData = new BitmapData(video.width,video.height);
					bm.draw(video);
					return bm;
				} catch(error:Error) {
					trace('error',error.toString() );
					return null;
				}
			}
			return null;
		}
		
		private function onCameraStatus(event:StatusEvent):void {
			trace('status event:',event.toString() );
			video = null; // turn off video
			// redispatch
			dispatchEvent(event.clone());
		}
		
		/**
		 * This code checks one time if the security panel is closed.
		 * When you open the security panel, you should run this test
		 * repeatedly with a timer (every 500ms seems to work well).
		 * If the security panel is closed, you can then clean up your timers
		 */
		private function securityPanelIsClosed():Boolean
		{
			// Why not just wait for an event from the SettingsPanel to know that it's closed?  Because there isn't one.
			// See http://bugs.adobe.com/jira/browse/FP-41
			var closed:Boolean = true;
			var hack:BitmapData = new BitmapData(1,1);
			try
			{
				// Trying to capture the stage triggers a Security error when the settings dialog box is open. 
				hack.draw(stage);
			}
			catch (error:Error)
			{
				closed = false;
			}
			hack.dispose();
			hack = null;
			return (closed);
		}
	}
}
