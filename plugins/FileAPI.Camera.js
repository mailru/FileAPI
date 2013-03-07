/**
 * @class	FileAPI.Camera
 * @author	RubaXa	<trash@rubaxa.org>
 * @support	Chrome 21+, FF 18+, Opera 12+
 */

(function (window, api){
	 /** @namespace LocalMediaStream -- https://developer.mozilla.org/en-US/docs/WebRTC/MediaStream_API#LocalMediaStream */


	var
		URL = window.URL || window.webkitURL,

		document = window.document,
		navigator = window.navigator,

		getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia,

		html5 = !!getMedia
	;


	var Camera = function (video){
		this.video = video;
	};

	Camera.prototype = {
		isActive: function (){
			var stream = this.stream;
			return	stream ? stream.readyState == stream.LIVE : false;
		},


		/**
		 * Start camera streaming
		 * @param	{Function}	callback
		 */
		start: function (callback){
			var _this = this, video = _this.video;

	 		getMedia.call(navigator, { video: true }, function (stream/**LocalMediaStream*/){
	 			// Success
	 			_this.stream = stream;

	 			// Set camera stream
	 			video.src = URL.createObjectURL(stream);

	 			// Go-go-go!
	 			video.play();

	 			callback && callback(null, _this);
			}, function (err){
	 			// Error
	 			callback && callback(err, _this);
	 		});
		},


		/**
		 * Stop camera streaming
		 */
		stop: function (){
			try {
				this.video.pause();
				this.stream.stop();
			} catch( err ){ }
		},


		/**
		 * Create screenshot
		 * @return {FileAPI.Camera.Shot}
		 */
		shot: function (){
			return	Shot(this.video);
		}
	};


	/**
	 * Get camera element from container
	 *
	 * @static
	 * @param	{HTMLElement}	el
	 * @return	{Camera}
	 */
	Camera.get = function (el){
		return	new Camera(el.firstChild);
	};


	/**
	 * Publish camera element into container
	 *
	 * @static
	 * @param	{HTMLElement}	el
	 * @param	{Object}		options
	 * @param	{Function}		[callback]
	 */
	Camera.publish = function (el, options, callback){
	 	if( typeof options == 'function' ){
	 		callback = options;
	 		options = {};
	 	}

		// Dimensions of "camera"
	 	options = api.extend({}, {
	 		  width:	'100%'
	 		, height:	'100%'
		}, options);


		if( el.jquery ){
			// Extract first element, from jQuery collection
			el = el[0];
		}


	 	if( html5 ){
			// Create video element
			var video = document.createElement('video');

			// Set dimensions
			video.style.width	= _px(options.width);
			video.style.height	= _px(options.height);

			// Clean container
			if( window.jQuery ){
				jQuery(el).empty();
			} else {
				el.innerHTML = '';
			}

			// Add "camera" to container
			el.appendChild(video);


			callback(null, Camera.get(el));
	 	}
	 	else {
	 		callback('not_support');
	 	}
	};


	/**
	 * @class	FileAPI.Camera.Shot
	 */
	 var Shot = function (video){
	 	var shot = new api.Image(video);
	 	shot.type	= 'image/png';
		shot.width	= video.videoWidth;
		shot.height	= video.videoHeight;
		shot.size	= shot.width * shot.height * 4;
	 	return	shot;
	 };



	/**
	 * Add "px" postfix, if value is a number
	 *
	 * @private
	 * @param	{*}  val
	 * @return	{String}
	 */
	function _px(val){
		return	val >= 0 ? val + 'px' : val;
	}


	// @export
	FileAPI.Camera = Camera;
})(window, FileAPI);
