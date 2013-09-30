package ru.mail.data.builder
{
	import flash.display.BitmapData;
	import flash.net.FileReference;
	import flash.utils.ByteArray;
	
	import ru.mail.data.AbstractImageFactory;
	import ru.mail.data.vo.FakeFileVO;
	import ru.mail.data.vo.FileVO;
	import ru.mail.data.vo.PhotoFileVO;

	/**
	 * Create and store files
	 *  
	 * @author v.demidov
	 * 
	 */	
	public class FilesDataBuilder extends AbstractDataBuilder
	{
		public static const TYPE:String = "FilesDataBuilder";
		
		public function FilesDataBuilder()
		{
			super(TYPE);
		}
		
		/**
		 * Create fake file with empty data 
		 * @param fileID
		 * @return 
		 * 
		 */		
		public function createFakeFileVO(fileID:String = ''):FakeFileVO
		{
			// create
			var fileVO:FakeFileVO = new FakeFileVO();
			// set props
			fileVO.fileData = new ByteArray();
			fileVO.imageData = new BitmapData(1,1);
			fileVO.fileID = fileID;
			
			fileVO.abstractImageFactory = new AbstractImageFactory(fileVO);
			
			return fileVO;
		}
		
		public function createFileVO(fileReference:FileReference, fileID:String = '', addToCollection:Boolean = true):FileVO
		{
			if (fileReference == null) {
				throw new Error("FilesDataBuilder - createFileVO: fileReference is null");
			}
			// create
			var fileVO:FileVO = new FileVO();
			// set props
			fileVO.fileRef = fileReference;
			fileVO.fileID = fileID;
			//fileVO.imageFactory = new ImageFactory(fileVO, true);
			fileVO.abstractImageFactory = new AbstractImageFactory(fileVO);
			// add
			if(addToCollection)
			{
				addFile(fileVO);
			}
			
			return fileVO;
		}
		
		/*public function createRestoredFileVO(url:String, fileID:String = '', addToCollection:Boolean = true):RestoredFileVO
		{
			if (!url || url == "") {
				throw new Error("FilesDataBuilder - createRestoredFileVO: empty url");
			}
			// create
			var fileVO:RestoredFileVO = new RestoredFileVO();
			// set props
			fileVO.url = url;
			fileVO.fileID = fileID;
			// add
			if(addToCollection)
			{
				addFile(fileVO);
			}
			
			return fileVO;
		}*/
		
		public function createPhotoFileVO(image:BitmapData, fileID:String = '', addToCollection:Boolean = true):PhotoFileVO
		{
			if (image == null) {
				throw new Error("FilesDataBuilder - createPhotoFileVO: image BitmapData is null");
			}
			
			// create
			var fileVO:PhotoFileVO = new PhotoFileVO();
			// set props
			fileVO.imageData = image;
			fileVO.fileID = fileID;
			//fileVO.imageFactory = new ImageFactory(fileVO, true);
			fileVO.abstractImageFactory = new AbstractImageFactory(fileVO);
			// add
			if(addToCollection)
			{
				addFile(fileVO);
			}
			
			return fileVO;
		}
		
	}
}