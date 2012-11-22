package
{
	import flash.display.Sprite;
	import flash.display.StageAlign;
	import flash.display.StageQuality;
	import flash.display.StageScaleMode;
	import flash.events.Event;
	
	import ru.mail.controller.AppController;
	
	/**
	 * 
	 * @author v.demidov
	 * 
	 */	
	public class FlashFileAPI extends Sprite
	{
		private var _controller:AppController;
		private var _graphicContext:Sprite = new Sprite();
		
		public function FlashFileAPI()
		{
			if (stage) {
				init();
			}
			else {
				addEventListener(Event.ADDED_TO_STAGE, init);
			}
		}
		
		/**
		 * entry point 
		 * @param event
		 * 
		 */		
		protected function init(event:Event = null):void
		{
			trace ("{FlashFileAPI} - init");
			removeEventListener(Event.ADDED_TO_STAGE, init);
			
			// config stage
			stage.align = StageAlign.TOP_LEFT;
			stage.scaleMode = StageScaleMode.NO_SCALE;
			stage.quality = StageQuality.BEST;
			
			// add graphic context
			addChild(_graphicContext);
			
			// initiate controller
			_controller = new AppController(_graphicContext, parseFlashVars());
			stage.addEventListener(Event.RESIZE, _controller.onStageResize)
		}
		
		/**
		 * parse all flashvars into object
		 */		
		private function parseFlashVars():Object
		{
			var options:Object = new Object();
			for (var s:String in loaderInfo.parameters) {
				options[s] = loaderInfo.parameters[s];
			}
			return options;
		}
	}
}