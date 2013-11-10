package ru.mail.communication
{
	import flash.external.ExternalInterface;
	import flash.system.Security;
	
	import ru.mail.controller.AppController;
	import ru.mail.utils.LoggerJS;

	/**
	 * Configure js callback functions, redirect all of them to app controller.
	 * Controller will decide what to do with them 
	 * @author v.demidov
	 * 
	 */	
	public class JSCallbackPresenter
	{
		private var appController:AppController;
		
		public function JSCallbackPresenter(appController:AppController)
		{
			this.appController = appController;
			
			try
			{
				Security.allowDomain("*");
				
				ExternalInterface.addCallback("cmd", parseCmd);
			}
			catch (e:Error)	{
				LoggerJS.log('add js cmd callback error: '+e.toString() );
				trace ("{JSCallbackPresenter} - unable to set callback, error:", e.message);
			}
		}
		
		/**
		 * cmd('commandType', { ... })
		 * 
		 * @param command - string to determine what to do
		 * @param data - details - an object or a string, depending on command
		 * @return 
		 * 
		 */		
		protected function parseCmd(command:String, data:Object):Object
		{
			LoggerJS.log('parseCmd, command: '+command);
			switch (command)
			{
				case "accept":
					appController.setTypeFilter(data.toString());
					break;
				case "upload":
					/* cmd("upload", {url:, data:URLVariables, headers:Object
						,files: {'filename[original]': { 
													id
													, name
													, matrix:{
														sx , ...
														,dh
														,deg
														, type:'image/png'
														, quality: 1 // качество jpeg
														,overlay: [  // массив изображений, которые нужно разместить:
														{ x: 0, y: 0, opacity: .5, src: '...' }
														, { x: 0, y: 0, w: 120, h: 30, opacity: 1, src: '...' }
														]
													} }
								, 'filename[XL]': { id, name, matrix:null } }
					    , callback:jsHandler}) */
					// headers: {  'Content-Type': 'application/x-mru-upload' , 'Content-Disposition': '...' , ...}
					appController.uploadFile(data.url 
											, data.data, data.headers
											, data.files
											, data.callback);
					break;
				case "abort":
					// cmd('abort', { id: '...' })
					appController.cancelFile(data.id);
					break;
				case "hitTest":
					// cmd("hitTest")
					// return whether mouse is over the flash
					return appController.hitTest();
					break;
				case "multiple":
					appController.setMultipleSelect(data.toString() == "true");
					break;
				case "clear":
					// remove all files
					appController.clear();
					break;
				case "clearError":
					// clear shared object error data
					appController.clearError();
					break;
				case "getFileInfo":
					// cmd('getFileInfo', { id: '...', callback: '...' });
					appController.getFileInfo(data.id, data.callback)
					break;
				case "imageTransform":
					// cmd('imageTransform', {
					//	id: '...',
					//	matrix: {
					//	sx: Number, // s* — original image region
					//	sy: Number,
					//	sw: Number, // if 0, then w - sx
					//	sh: Number, // if 0, then h - sy
					//	dw: Number, // if 0, then sw
					//	dh: Number, // if 0, then sh
					//	deg: Number
					//	resize: String, // min, max OR preview
					//	},
					//	callback: '...'
					//});
					appController.imageTransform(data.id, data.matrix, data.callback);
					break;
				// camera:
				case "camera.on":
					appController.cameraController.cameraOn(data.callback);
					break;
				case "camera.off":
					appController.cameraController.cameraOff();
					break;
				case "shot":
					return appController.cameraController.shot();
					break;
				default:
					LoggerJS.log("cannot parse command: "+command);
					break;
			}
			
			// by default function doesn't have to return anything
			// If it have to, return it inside switch case
			return false;
		}
		
	}
}