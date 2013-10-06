package
{
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.Sprite;
	import flash.display.StageAlign;
	import flash.display.StageScaleMode;
	import flash.events.*;
	import flash.media.Camera;
	import flash.media.Video;
	import flash.text.TextField;
	
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
			} else {
				// callback with error
			}
			
			
			// test
			/*var tf:TextField = new TextField();
			tf.text = 'on';
			tf.x = 10;
			tf.width = 30;
			tf.addEventListener(MouseEvent.CLICK, function(event:MouseEvent):void {
				toggleCamera(true);
			});
			addChild(tf);
			
			tf = new TextField();
			tf.text = 'off';
			tf.x = 50;
			tf.width = 30;
			tf.addEventListener(MouseEvent.CLICK, function(event:MouseEvent):void {
				toggleCamera(false);
			});
			addChild(tf);
			
			tf = new TextField();
			tf.text = 'photo';
			tf.x = 100;
			tf.width = 30;
			tf.addEventListener(MouseEvent.CLICK, function(event:MouseEvent):void {
				shot();
			});
			addChild(tf);*/
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
	}
}