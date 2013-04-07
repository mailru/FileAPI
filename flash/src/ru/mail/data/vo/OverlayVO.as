package ru.mail.data.vo
{
	import flash.display.BitmapData;

	/**
	 * Value object with params for overlay
	 *  
	 * @author demidov
	 * 
	 */	
	public class OverlayVO
	{
		public var x:Number;
		public var y:Number;
		public var w:Number;
		public var h:Number;
		public var rel:uint;
		public var opacity:Number;
		public var src:String;
		public var imageData:BitmapData;
		
		public function OverlayVO(item:Object)
		{
			this.x = item.x|0;
			this.y = item.y|0;
			this.w = item.w|0;
			this.h = item.h|0;
			this.rel = item.rel|0;
			this.opacity = item.opacity||1;
			this.src = item.src;
		}
	}
}