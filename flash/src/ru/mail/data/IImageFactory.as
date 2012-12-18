package ru.mail.data
{
	import ru.mail.data.vo.ImageTransformVO;

	/**
	 * produces transformed images from target's source 
	 * @author v.demidov
	 * 
	 */	
	public interface IImageFactory
	{
		/**
		 * Create transformed image using imageTransform params.
		 * if imageTransform is null, return original image.
		 * If original image has not been loaded, first load it. 
		 * The result image is returned async via completeEvent
		 * @param imageTransform
		 * 
		 */		
		function createImage(imageTransform:ImageTransformVO):void;
		/**
		 * try to read file's exif. return object with "Orientation" value  
		 * @return 
		 * 
		 */		
		function readExif():Object;
	}
}