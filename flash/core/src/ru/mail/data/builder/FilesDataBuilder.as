package ru.mail.data.builder
{
	import flash.net.FileReference;
	
	import ru.mail.data.AbstractImageFactory;
	import ru.mail.data.vo.FileVO;

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
		
	}
}