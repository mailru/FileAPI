package ru.mail.commands.textloader
{
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.IEventDispatcher;
	import flash.events.IOErrorEvent;
	import flash.events.ProgressEvent;
	import flash.events.SecurityErrorEvent;
	import flash.events.TimerEvent;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	import flash.utils.Timer;
	
	import ru.mail.commands.textloader.events.*;
	import ru.mail.data.vo.ErrorVO;

	public class SimpleTextLoader extends EventDispatcher implements ITextLoader
	{
		private var _timeoutTimer:Timer = new Timer( _TIMEOUT, 1 ) ; // to keep off endless waiting 		
		private var _loader:URLLoader= new URLLoader() ;	
		
		private var _TIMEOUT:uint = 1 * 60 * 1000 ; // timeout in millisecond: minutes * secs per min * millisecs per sec
		private const _SUCCESS:Boolean = true ;
		
		public function SimpleTextLoader( timeoutDelayInSecs:uint = 60 )
		{
			_addURLLoaderListeners( _loader ) ;
			
			_timeoutTimer.delay = timeoutDelayInSecs * 1000;			
			_timeoutTimer.addEventListener( TimerEvent.TIMER
										  , function( e:TimerEvent ):void{ _complete( !_SUCCESS ); } ) ;
		}
		
		/** 
		 * method load data by request
		 */
		public function loadText( request:URLRequest ):void 
		{	
			_timeoutTimer.start() ;
			try
			{				
				_loader.load( request ) ;	
			}
			catch( e:Error )	
			{
				_complete( !_SUCCESS, new ErrorVO( e.toString() ) );
			}
		}			
		
		private function _complete( isSuccess:Boolean, error:ErrorVO = null ):void 
		{	
			_timeoutTimer.stop() ;
			dispatchEvent( new TextLoaderCompleteEvent( isSuccess, _loader.data, error ) ) ;
		}	
	
		private function _addURLLoaderListeners( dispatcher:IEventDispatcher ):void 
		 {
            dispatcher.addEventListener( Event.COMPLETE, function( e:Event ):void{ _complete( _SUCCESS ); } );            
            dispatcher.addEventListener( SecurityErrorEvent.SECURITY_ERROR, function( e:Event ):void{ _complete( !_SUCCESS, new ErrorVO(e.toString()) ); } );
            dispatcher.addEventListener( IOErrorEvent.IO_ERROR, function( e:Event ):void{ _complete( !_SUCCESS, new ErrorVO(e.toString()) ); } );
			dispatcher.addEventListener( ProgressEvent.PROGRESS
									   , function( e:ProgressEvent ):void
									   { dispatchEvent( new LoaderProgressEvent( e.bytesLoaded, e.bytesTotal ) ) } ) ;
        }	
	}
}