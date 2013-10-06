package ru.mail.data
{
	import ru.mail.data.vo.IFileVO;

	/**
	 * Produce factories for file
	 *  
	 * @author v.demidov
	 * 
	 */	
	public class AbstractImageFactory
	{
		private var file:IFileVO;
		
		public function AbstractImageFactory(target:IFileVO) 
		{
			if (!target) {
				throw new Error("{ImageFactory} - init: target is null");
			}
			
			file = target;
		}
		
		public function getImageFactory():IImageFactory
		{
			return new ImageFactory(file);
		}
	}
}