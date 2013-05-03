package ru.mail.commands.graphicloader
{
	import flash.display.Loader;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.IEventDispatcher;
	import flash.events.IOErrorEvent;
	import flash.events.ProgressEvent;
	import flash.events.SecurityErrorEvent;
	import flash.events.TimerEvent;
	import flash.net.URLRequest;
	import flash.utils.Timer;
	
	import ru.mail.commands.graphicloader.events.GraphicLoaderCompleteEvent;
	import ru.mail.commands.textloader.events.LoaderProgressEvent;
	import ru.mail.data.vo.ErrorVO;
	import ru.mail.utils.LoggerJS;
	
	
	public class SimpleGraphicLoader extends EventDispatcher implements IGraphicLoader
	{
		private var _timeoutTimer:Timer = new Timer( _TIMEOUT, 1 ); // to keep off endless waiting
		private var _loader:Loader = new Loader();
		
		private var _TIMEOUT:uint = 60 * 1000; // timeout in millisecond: minutes * secs per min * millisecs per sec
		private const _SUCCESS:Boolean = true;
		
		public function SimpleGraphicLoader( timeOutInSeconds:uint = 60 )
		{
			_addURLLoaderListeners( _loader.contentLoaderInfo ) ;
			
			_TIMEOUT = timeOutInSeconds * 1000;
			_timeoutTimer = new Timer( _TIMEOUT, 1 ) ;
			_timeoutTimer.addEventListener( TimerEvent.TIMER
			, function( e:TimerEvent ):void{ _complete( _getContent() != null, new ErrorVO('SimpleGraphicLoader loadGraphic timeout') ); } ) ;
		}
		
		public function cancel():void
		{
			try
			{
				_loader.close();
			}catch ( e:Error ) { }
		}
		
		/** 
		 * method load data by request
		 */
		public function loadGraphic( request:URLRequest ):void 
		{	
			//trace( "SimpleGraphicLoader.loadGraphic() ", request.url ) ;
			LoggerJS.log('SimpleGraphicLoader loadGraphic '+request.url);
			_timeoutTimer.start() ;
			try
			{
				import flash.system.LoaderContext ;
				_loader.load( request, new LoaderContext( true ) ) ;
			}
			catch( e:Error )	
			{
				LoggerJS.log('SimpleGraphicLoader Error '+e.toString());
				_complete( !_SUCCESS, new ErrorVO( e.toString() ) );
			}
		}			
		
		private function _complete( isSuccess:Boolean, error:ErrorVO = null ):void 
		{	//trace( "SimpleGraphicLoader._complete() ", isSuccess ) ;	
			LoggerJS.log('SimpleGraphicLoader _complete, isSuccess = '+isSuccess+', error = '+(error?error.error:""));
			_timeoutTimer.stop() ;
			
			dispatchEvent( new GraphicLoaderCompleteEvent( isSuccess, _getContent(), error ) ) ;
		}	
		
		private function _getContent():*
		{
			var content:* = null
			try
			{
				content = _loader.content;
			}
			catch ( e:Error ) { 
				LoggerJS.log("SimpleGraphicLoader._getContent() Error "+ e.message);
			}
			
			return content;
		}
		
	
		private function _addURLLoaderListeners( dispatcher:IEventDispatcher ):void 
		 {
            dispatcher.addEventListener( Event.INIT, function( e:Event ):void{ _complete( _SUCCESS ); } );
            dispatcher.addEventListener( SecurityErrorEvent.SECURITY_ERROR, function( e:Event ):void{ _complete( !_SUCCESS, new ErrorVO(e.toString()) ); } );
            dispatcher.addEventListener( IOErrorEvent.IO_ERROR, function( e:Event ):void{ _complete( !_SUCCESS, new ErrorVO(e.toString()) ); } );
			dispatcher.addEventListener( ProgressEvent.PROGRESS
			, function( e:ProgressEvent ):void { 
				dispatchEvent( new LoaderProgressEvent( e.bytesLoaded, e.bytesTotal ) ) 
			} ) ;
        }	
	}
}