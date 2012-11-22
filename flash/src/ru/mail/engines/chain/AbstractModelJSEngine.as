package ru.mail.engines.chain
{
	import ru.mail.communication.JSCaller;
	import ru.mail.data.AttachmentsModel;
	
	public class AbstractModelJSEngine extends AbstractEngine implements IJsCallerHolder, IModelHolder
	{
		protected var _jsCaller:JSCaller;
		/**
		 * reference to JS communicator 
		 * @return 
		 * 
		 */
		public function get jsCaller():JSCaller
		{
			return _jsCaller;
		}
		public function set jsCaller(value:JSCaller):void
		{
			_jsCaller = value;
		}
		
		protected var _model:AttachmentsModel;
		/**
		 * reference to the application model 
		 * @return 
		 * 
		 */
		public function get model():AttachmentsModel
		{
			return _model;
		}
		public function set model(value:AttachmentsModel):void
		{
			_model = value;
		}
		
		public function AbstractModelJSEngine(engineType:String)
		{
			super(engineType);
			
			// default
			model = AttachmentsModel.model;
			jsCaller = JSCaller.jsCaller;
		}
	}
}