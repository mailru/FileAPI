/**
 * @class	FileAPI.Camera
 * @author	RubaXa	<trash@rubaxa.org>
 * @support	Chrome 21+, FF 18+, Opera 12+
 */

/*global window, FileAPI, jQuery */
/** @namespace LocalMediaStream -- https://developer.mozilla.org/en-US/docs/WebRTC/MediaStream_API#LocalMediaStream */
(function (window, api){
	"use strict";

	var
		URL = window.URL || window.webkitURL,

		document = window.document,
		navigator = window.navigator,

		getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia,

		html5 = !!getMedia
	;


	// Support "media"
	api.support.media = html5;


	var Camera = function (video){
		this.video = video;
	};


	Camera.prototype = {
		isActive: function (){
			return	!!this._active;
		},


		/**
		 * Start camera streaming
		 * @param	{Function}	callback
		 */
		start: function (callback){
			var
				  _this = this
				, video = _this.video
				, _successId
				, _failId
				, _complete = function (err){
					_this._active = !err;
					clearTimeout(_failId);
					clearTimeout(_successId);
//					api.event.off(video, 'loadedmetadata', _complete);
					callback && callback(err, _this);
				}
			;

			getMedia.call(navigator, { video: true }, function (stream/**LocalMediaStream*/){
				// Success
				_this.stream = stream;

//				api.event.on(video, 'loadedmetadata', function (){
//					_complete(null);
//				});

				// Set camera stream
				video.src = URL.createObjectURL(stream);

				// Note: onloadedmetadata doesn't fire in Chrome when using it with getUserMedia.
				// See crbug.com/110938.
				_successId = setInterval(function (){
					if( _detectVideoSignal(video) ){
						_complete(null);
					}
				}, 1000);

				_failId = setTimeout(function (){
					_complete('timeout');
				}, 5000);

				// Go-go-go!
				video.play();
			}, _complete/*error*/);
		},


		/**
		 * Stop camera streaming
		 */
		stop: function (){
			try {
				this._active = false;
				this.video.pause();

				try {
					this.stream.stop();
				} catch (err) {
					api.each(this.stream.getTracks(), function (track) {
						track.stop();
					});
				}

				this.stream = null;
			} catch( err ){
				api.log('[FileAPI.Camera] stop:', err);
			}
		},


		/**
		 * Create screenshot
		 * @return {FileAPI.Camera.Shot}
		 */
		shot: function (){
			return	new Shot(this.video);
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
			, start:	true
		}, options);


		if( el.jquery ){
			// Extract first element, from jQuery collection
			el = el[0];
		}


		var doneFn = function (err){
			if( err ){
				callback(err);
			}
			else {
				// Get camera
				var cam = Camera.get(el);
				if( options.start ){
					cam.start(callback);
				}
				else {
					callback(null, cam);
				}
			}
		};


		el.style.width	= _px(options.width);
		el.style.height	= _px(options.height);


		if( api.html5 && html5 && !api.insecureChrome ){
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

			// end
			doneFn();
		}
		else {
			Camera.fallback(el, options, doneFn);
		}
	};


	Camera.fallback = function (el, options, callback){
		callback('not_support_camera');
	};

	Camera.checkAlreadyCaptured = (function () {
		var	mediaDevices = navigator.mediaDevices,
			MediaStreamTrack = window.MediaStreamTrack,
			navigatorEnumerateDevices = navigator.enumerateDevices,
			enumerateDevices;

		if (mediaDevices && mediaDevices.enumerateDevices) {
			enumerateDevices = function (callback) {
				mediaDevices.enumerateDevices().then(callback);
			};
		} else if (MediaStreamTrack && MediaStreamTrack.getSources) {
			enumerateDevices = MediaStreamTrack.getSources.bind(MediaStreamTrack);
		} else if (navigatorEnumerateDevices) {
			enumerateDevices = navigatorEnumerateDevices.bind(navigator);
		} else {
			enumerateDevices = function (fn) {
				fn([]);
			};
		}

		return function (callback) {
			enumerateDevices(function (devices) {
				var deviceExists = devices.some(function (device) {
					return (device.kind === 'videoinput' || device.kind === 'video') && device.label;
				});

				callback(deviceExists);
			});
		};

	})();


	/**
	 * @class	FileAPI.Camera.Shot
	 */
	var Shot = function (video){
		var canvas	= video.nodeName ? api.Image.toCanvas(video) : video;
		var shot	= api.Image(canvas);
		shot.type	= 'image/png';
		shot.width	= canvas.width;
		shot.height	= canvas.height;
		shot.size	= canvas.width * canvas.height * 4;
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


	/**
	 * @private
	 * @param	{HTMLVideoElement} video
	 * @return	{Boolean}
	 */
	function _detectVideoSignal(video){
		var canvas = document.createElement('canvas'), ctx, res = false;
		try {
			ctx = canvas.getContext('2d');
			ctx.drawImage(video, 0, 0, 1, 1);
			res = ctx.getImageData(0, 0, 1, 1).data[4] != 255;
		}
		catch( err ){
			api.log('[FileAPI.Camera] detectVideoSignal:', err);
		}
		return	res;
	}


	// @export
	Camera.Shot	= Shot;
	api.Camera	= Camera;
})(window, FileAPI);
