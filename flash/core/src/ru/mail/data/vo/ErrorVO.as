package ru.mail.data.vo
{
	/**
	 * 
	 * Try to get error type, message and ID from given string.
	 * 
	 * Input string can be Error.toString() or ErrorEvent.toString() or anything else
	 *  
	 * @author v.demidov
	 * 
	 */	
	public class ErrorVO
	{
		public var error:String = "";
		public var errorType:String = "error";
		public var errorID:String = "";
		public var errorMessage:String = "";
		public var httpStatus:String = '';
		
		public function ErrorVO(error:String, errorType:String = null, httpStatus:String = null)
		{
			super();
			parseError(error);
			if (errorType) {
				this.errorType = errorType;
			}
			if (httpStatus) {
				this.httpStatus = httpStatus;
			}
		}
		
		public function parseError(str:String):void {
			if (!str) {
				return;
			}
			error = str;
			
			var idIndex:int = str.indexOf("#");
			var msgIndex:int = str.indexOf(":", idIndex);
			var msgEndIndex:int = str.lastIndexOf('"');
			// #1234:
			errorID = str.substring(idIndex+1, msgIndex);
			//: Error details
			errorMessage = str.substring(msgIndex+1, msgEndIndex == -1? str.length : msgEndIndex);
		}
		
		public function getError():String {
			return errorType + " " + errorID + ": " + errorMessage;
		}
	}
}