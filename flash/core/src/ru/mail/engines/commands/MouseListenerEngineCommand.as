package ru.mail.engines.commands
{
	import flash.events.Event;
	
	import ru.mail.engines.chain.presentation.MouseListenerEngine;

	public class MouseListenerEngineCommand extends AbstractEngineCommand
	{
		public static const TYPE:String = "MouseListenerEngineCommand";
		
		private var _dispatchRollout:Boolean;
		/**
		 * true - dispatch js event mouseleave on rollout
		 * false - do not dispatch 
		 * @return 
		 * 
		 */
		public function get isDispatchRollout():Boolean
		{
			return _dispatchRollout;
		}

		
		public function MouseListenerEngineCommand(dispatchRollout:Boolean)
		{
			super(TYPE, MouseListenerEngine.TYPE);
			
			_dispatchRollout = dispatchRollout;
		}
		
		override public function clone():Event
		{
			return new MouseListenerEngineCommand(_dispatchRollout);
		}
	}
}