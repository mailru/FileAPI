package ru.mail.data.vo
{
	/**
	 * Value object with transformation matrix
	 * 
	 * @author v.demidov
	 * 
	 */	
	public class ImageTransformVO
	{
		public static const TYPE_PNG:String = 'image/png';
		public static const TYPE_JPEG:String = 'image/jpeg';

		public var sx:Number = 0;
		public var sy:Number = 0;
		public var sw:Number = 0;
		public var sh:Number = 0;
		public var dw:Number = 0;
		public var dh:Number = 0;
		public var deg:Number = 0;
		public var type:String = 'image/png'; // encoded image type. If type value is unknown, png is used
		public var quality:Number = 1; // encode quality (jpeg only)
		public var overlay:Array = []; // array of OverlayVO instances
        public var multiPassResize: Boolean = true;

		public function ImageTransformVO(sx:Number = 0, sy:Number = 0, sw:Number = 0, sh:Number = 0, dw:Number = 0, dh:Number = 0, deg:Number = 0
										 , type:String = null, quality:Number = 1, overlay:Array = null, multiPassResize:Boolean = true)
		{
			super();

			if ( !isNaN(sx) )
				this.sx = sx;
			if ( !isNaN(sy) )
				this.sy = sy;
			if ( !isNaN(sw) )
				this.sw = sw;
			if ( !isNaN(sh) )
				this.sh = sh;
			if ( !isNaN(dw) )
				this.dw = dw;
			if ( !isNaN(dh) )
				this.dh = dh;
			if ( !isNaN(deg) )
				this.deg = deg;
			if ( type )
				this.type = type;
			if ( !isNaN(quality) )
				this.quality = quality;

            this.multiPassResize = multiPassResize;

			if ( overlay )
				setOverlay( overlay );
		}

		/**
		 * @private fill overlay array with value objects 
		 * @param overlay
		 * 
		 */
		private function setOverlay(overlay:Array):void
		{
			var item:Object;
			var overlayVO:OverlayVO;
			for (var i:uint = 0; i < overlay.length; i++) {
				item = overlay[i];
				if ( item && item.src ) {
					overlayVO = new OverlayVO(item);
					this.overlay.push(overlayVO);
				}
			}
		}
	}
}