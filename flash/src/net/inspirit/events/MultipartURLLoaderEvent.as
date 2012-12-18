package net.inspirit.events 
{
	import flash.events.Event;
	
	/**
	 * MultipartURLLoader Event for async data prepare tracking
	 * @author Eugene Zatepyakin
	 */
	public class MultipartURLLoaderEvent extends Event
	{
		public static const DATA_PREPARE_PROGRESS:String = 'dataPrepareProgress';
		public static const DATA_PREPARE_COMPLETE:String = 'dataPrepareComplete';
		
		public var bytesWritten:uint = 0;
		public var bytesTotal:uint = 0;
		
		public function MultipartURLLoaderEvent(type:String, w:uint = 0, t:uint = 0) 
		{
			super(type);
			
			bytesTotal = t;
			bytesWritten = w;
		}
		
	}
	
}