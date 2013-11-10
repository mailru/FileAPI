package ru.mail.commands
{
	
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.Loader;
	import flash.display.LoaderInfo;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.IOErrorEvent;
	import flash.events.SecurityErrorEvent;
	import flash.events.TimerEvent;
	import flash.utils.ByteArray;
	import flash.utils.Timer;
	
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.events.DecodeBytesToBitmapCompleteEvent;
	import ru.mail.utils.BMPDecoder;
	
	
	/**
	 * The command decodes bytes to image with the Loader object. png, jpg, bmp and unanimated gif only.
	 * 
	 * Animated gif - currently there is no check for it, so it will be decoded, but the image might be incorrect
	 * 
	 * @author ivanova
	 */
	public class DecodeBytesToBitmapCommand extends EventDispatcher
	{
		private var bmpDecoder:BMPDecoder = new BMPDecoder();
		private var _bytes:ByteArray ;
		private var _loader:Loader = new Loader() ;		
		private var _terminateTimer:Timer = new Timer( 20 * 1000 );
		private var _isTerminated:Boolean = false;
		
		/**
		 * ctor
		 * @param	bytes: the bytes collection to decode		
		 */		
		public function DecodeBytesToBitmapCommand( bytes:ByteArray ) 
		{
			if ( null == bytes )
				throw new Error( "DecodeBytesToBitmapCommand bytes is null" ) ;
				
			_bytes = bytes ;
		
			_loader.contentLoaderInfo.addEventListener( Event.COMPLETE, _onDecodeImageComplete ) ;
			_loader.contentLoaderInfo.addEventListener( IOErrorEvent.IO_ERROR, _onDecodeImageError ) ;	
			_loader.contentLoaderInfo.addEventListener( SecurityErrorEvent.SECURITY_ERROR, _onDecodeImageError ) ;
			
			_terminateTimer.addEventListener( TimerEvent.TIMER, _onTerminateTimer);
		}
		
		public function dispose():void 
		{
			_loader.contentLoaderInfo.removeEventListener( Event.COMPLETE, _onDecodeImageComplete ) ;
			_loader.contentLoaderInfo.removeEventListener( SecurityErrorEvent.SECURITY_ERROR, _onDecodeImageError ) ;
			_loader.contentLoaderInfo.removeEventListener( IOErrorEvent.IO_ERROR, _onDecodeImageError ) ;
			
			_bytes = null ;
			try
			{
				if ( ( _loader.contentLoaderInfo.content as Bitmap ) != null )
					( _loader.contentLoaderInfo.content as Bitmap ).bitmapData.dispose() ;
			}
			catch ( e:Error ) { }
			
			bmpDecoder = null;
			_loader = null ;
			_terminateTimer.removeEventListener( TimerEvent.TIMER, _onTerminateTimer);
			_terminateTimer = null;
		}
		
		public function execute():void 
		{	
			try
			{				
				_terminateTimer.start();
				_loader.loadBytes( _bytes ) ;
			}
			catch ( e:Error )
			{	
				complete( false, null, new ErrorVO( e.toString() ) ); ;
			}
		}
		
		private function _onDecodeImageComplete( e:Event ):void 
		{	
			
			try
			{
				var image:Bitmap = ( e.target as LoaderInfo ).content as Bitmap ;			
				var isSuccess:Boolean = ( image != null ) ;			
				complete( isSuccess, image ) ;
			}
			catch ( e:Error ) { complete( false, null, new ErrorVO( e.toString() ) ); }
		}
		
		private function _onDecodeImageError( e:Event ):void
		{
			
			try {
				var bd:BitmapData = bmpDecoder.decode(_bytes);
				var image:Bitmap = new Bitmap(bd);
				var isSuccess:Boolean = ( image != null && ( !bmpDecoder.decodeError || bmpDecoder.decodeError == "" ) ) ;	
				complete( isSuccess, image, bmpDecoder.decodeError? new ErrorVO(bmpDecoder.decodeError) : null ) ;
			} catch(e:Error) {
				complete( false, null, new ErrorVO( e.toString() ) );
			}
		}
		
		private function _onTerminateTimer( e:TimerEvent ):void
		{
			complete( false, null, new ErrorVO("DecodeBytesToImageCommand timeout") );
		}
		
		private function complete( isSuccess:Boolean, image:Bitmap, error:ErrorVO = null ):void 
		{
			if ( !_isTerminated )
			{
				_isTerminated = true;
				_terminateTimer.stop();
				dispatchEvent( new DecodeBytesToBitmapCompleteEvent( isSuccess, image, error ) ) ;
			}
		}
	}	
}