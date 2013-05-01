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
		/**
		 * 0 1 2 <br>
		 * 3 4 5 <br>
		 * 6 7 8
		 */
		public var rel:uint;
		public var opacity:Number;
		public var src:String;
		
		private var _imageData:BitmapData;
		public function get imageData():BitmapData
		{
			return _imageData;
		}
		public function set imageData(value:BitmapData):void
		{
			_imageData = value;
			// update default w, h
			if (w == 0) {
				w = _imageData.width;
			}
			if (h == 0) {
				h = _imageData.height;
			}
		}

		
		public function OverlayVO(item:Object)
		{
			this.x = item.x|0;
			this.y = item.y|0;
			this.w = item.w|0;
			this.h = item.h|0;
			this.rel = uint(item.rel)|0;
			this.opacity = item.opacity||1;
			this.src = item.src;
		}
	}
}