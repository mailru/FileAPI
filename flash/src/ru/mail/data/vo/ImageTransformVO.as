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
		public var sx:Number = 0;
		public var sy:Number = 0;
		public var sw:Number = 0;
		public var sh:Number = 0;
		public var dw:Number = 0;
		public var dh:Number = 0;
		public var deg:Number = 0;
		
		public function ImageTransformVO(sx:Number = 0, sy:Number = 0, sw:Number = 0, sh:Number = 0, dw:Number = 0, dh:Number = 0, deg:Number = 0)
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
		}
	}
}