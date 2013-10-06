package ru.mail.engines.commands
{
	import flash.events.Event;
	
	import ru.mail.engines.chain.manage.SelectFilesEngine;

	/**
	 * command to activate SelectFilesCommand engine
	 * 
	 * store filesFilter to use in fileReference.browse
	 *   
	 * @author s.osipov
	 * 
	 */	
	public class SelectFilesCommand extends AbstractEngineCommand
	{
		public static const TYPE:String = "SelectFilesCommand";
		
		private var _filesFilters:Array = null;
		/**
		 * file filter to use in fileReferenceList 
		 * @return 
		 * 
		 */
		public function get filesFilters():Array
		{
			return _filesFilters;
		}
		
		public function SelectFilesCommand(filters:Array)
		{
			super(TYPE, SelectFilesEngine.TYPE);
			
			_filesFilters = filters;
		}
		
		override public function clone():Event
		{
			return new SelectFilesCommand(_filesFilters);
		}
	}
}