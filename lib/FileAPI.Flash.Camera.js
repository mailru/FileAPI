/**
 * FileAPI fallback to Flash
 *
 * @flash-developer  "Vladimir Demidov" <v.demidov@corp.mail.ru>
 */

/*global window, FileAPI */
(function (window, jQuery, api) {
    "use strict";

	var
		  _each = api.each
		, _extend = api.extend
		, _cameraQueue = []

		, Flash = api.Flash
		, _wrap = Flash.wrap
		, _unwrap = Flash.unwrap
	;


	if( api.support.flash && (api.media && !api.support.media) ){
		api.extend(Flash, {

			patchCamera: function (){
				api.Camera.fallback = function (el, options, callback){
					var camId = api.uid();
					api.log('FlashAPI.Camera.publish: ' + camId);
					Flash.publish(el, camId, _extend(options, {
						camera: true,
						onEvent: _wrap(function _(evt){
							if( evt.type === 'camera' ){
								_unwrap(_);

								if( evt.error ){
									api.log('FlashAPI.Camera.publish.error: ' + evt.error);
									callback(evt.error);
								} else {
									api.log('FlashAPI.Camera.publish.success: ' + camId);
									callback(null);
								}
							}
						})
					}));
				};


				// Run
				_each(_cameraQueue, function (args){
					api.Camera.fallback.apply(api.Camera, args);
				});
				_cameraQueue = [];


				// FileAPI.Camera:proto
				_extend(api.Camera.prototype, {
					_id: function (){
						return this.video.id;
					},

					start: function (callback){
						var _this = this;
						Flash.cmd(this._id(), 'camera.on', {
							callback: _wrap(function _(evt){
								_unwrap(_);

								if( evt.error ){
									api.log('FlashAPI.camera.on.error: ' + evt.error);
									callback(evt.error, _this);
								} else {
									api.log('FlashAPI.camera.on.success: ' + _this._id());
									_this._active = true;
									callback(null, _this);
								}
							})
						});
					},

					stop: function (){
						this._active = false;
						Flash.cmd(this._id(), 'camera.off');
					},

					shot: function (){
						api.log('FlashAPI.Camera.shot:', this._id());

						var shot = Flash.cmd(this._id(), 'shot', {});
						shot.type = 'image/png';
						shot.flashId = this._id();
						shot.isShot = true;

						return new api.Camera.Shot(shot);
					}
				});
			}
		});

		api.Camera.fallback = function (){
			_cameraQueue.push(arguments);
		};
    }
})(window, window.jQuery, FileAPI);
