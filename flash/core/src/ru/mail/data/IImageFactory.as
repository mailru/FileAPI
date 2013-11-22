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
		 * @param imageTransform - if null, return fileData (ByteArray)
		 * @param noImage - if true, do not create imageData, just load and return fileData.
		 * 
		 */		
		function createImage(imageTransform:ImageTransformVO, noImage:Boolean = false):void;
		/**
		 * try to read file's exif. return object with "Orientation" value  
		 * @return 
		 * 
		 */		
		function readExif():Object;
	}
}