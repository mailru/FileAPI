package ru.mail.engines.chain
{
	import ru.mail.data.AttachmentsModel;

	/**
	 * For Engines that have link to the Attachments model 
	 * @author v.demidov
	 * 
	 */	
	public interface IModelHolder
	{
		function get model():AttachmentsModel;
		function set model(value:AttachmentsModel):void;
	}
}