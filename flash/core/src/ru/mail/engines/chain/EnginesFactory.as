package ru.mail.engines.chain
{
	import ru.mail.engines.chain.manage.SelectFilesEngine;
	import ru.mail.engines.chain.presentation.MouseListenerEngine;

	/**
	 * concreate engines factory for attachments uploader
	 */	
	public class EnginesFactory extends AbstractEnginesFactory
	{
		protected static var _instance:EnginesFactory = null;
		
		/**
		 * should be overrided in derived classes 
		 * @return 
		 * 
		 */		
		public static function getEnginesFactory():EnginesFactory {
			if ( !_instance ) {
				_instance = new EnginesFactory();
			}
			
			return _instance;
		}
		
		public function EnginesFactory() {
			super();
			
			if ( _instance ) {
				throw new Error("EnginesFactory is singleton class, use get engineFactory method instead");
			}
		}
		
		override protected function registerEngines():void {
			_registeredEngines.push(new SelectFilesEngine());
			_registeredEngines.push(new MouseListenerEngine());
//			_registeredEngines.push(new UploadEngine());
			
			super.registerEngines();
		}
	}
}