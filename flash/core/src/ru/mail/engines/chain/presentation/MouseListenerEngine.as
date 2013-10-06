package ru.mail.engines.chain.presentation
{
	import flash.display.InteractiveObject;
	import flash.events.MouseEvent;
	
	import ru.mail.communication.JSCaller;
	import ru.mail.data.AttachmentsModel;
	import ru.mail.engines.chain.AbstractEngine;
	import ru.mail.engines.commands.AbstractEngineCommand;
	import ru.mail.engines.commands.MouseListenerEngineCommand;
	import ru.mail.engines.commands.SelectFilesCommand;
	
	public class MouseListenerEngine extends AbstractEngine
	{
		public static const TYPE:String = "MouseListenerEngine";
		
		private var rollOutFlag:Boolean = false;
		
		protected var _view:InteractiveObject;
		
		/**
		 * we need link to the target object to subscribe to mouseEvents 
		 * @param value
		 * 
		 */
		public function get view():InteractiveObject
		{
			return _view;
		}
		
		public function set view(value:InteractiveObject):void
		{
			if (_view != null) 
			{
				// remove event listeners from old target
				unsubscribeTarget();
			}
			
			// set new value
			_view = value;
			
			try {
				// add listeners to new target
				subscribeTarget();
			} catch (e:Error) {
				trace ("{MouseListenerEngine} - set target: cannot subscribe target", e.message);
			}
		}
		
		public function MouseListenerEngine()
		{
			super(TYPE);
		}
		
		override public function handle(command:AbstractEngineCommand):void
		{
			super.handle(command);
			
			if (command is MouseListenerEngineCommand)
			{
				rollOutFlag = !(command as MouseListenerEngineCommand).isDispatchRollout;
			}
		}
		
		protected function subscribeTarget():void
		{
			_view.addEventListener(MouseEvent.ROLL_OVER, onMouseEvent);
			_view.addEventListener(MouseEvent.MOUSE_DOWN, onMouseEvent);
			_view.addEventListener(MouseEvent.MOUSE_UP, onMouseEvent);
			_view.addEventListener(MouseEvent.ROLL_OUT, onMouseEvent);
		}
		
		protected function unsubscribeTarget():void
		{
			_view.removeEventListener(MouseEvent.ROLL_OVER, onMouseEvent);
			_view.removeEventListener(MouseEvent.MOUSE_DOWN, onMouseEvent);
			_view.removeEventListener(MouseEvent.MOUSE_UP, onMouseEvent);
			_view.removeEventListener(MouseEvent.ROLL_OUT, onMouseEvent);
		}
		
		protected function onMouseEvent(event:MouseEvent):void
		{
			// баг: открывается окно выбора файлов (browse() ) и от этого бросается эвент rollout, 
			// и от этого жс сворачивает флешку и больше ее не слушает
			if (event.type == MouseEvent.ROLL_OUT && rollOutFlag)
			{
				// and
				return;
				// ha-ha!
			}
			// call js
			JSCaller.jsCaller.notifyJSMouseEvents(event.type);
			
			if (event.type == MouseEvent.MOUSE_UP)
			{
				rollOutFlag = true;
				
				// get file filter from model, and dispatch select files event
				var fileFilters:Array = AttachmentsModel.model.fileFilters;
				dispatchEvent(new SelectFilesCommand(fileFilters));
			}
			
		}
	}
}