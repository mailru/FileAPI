/**
 * FileAPI fallback to Flash
 *
 * @flash-developer  "Vladimir Demidov" <v.demidov@corp.mail.ru>
 */

/*global window, FileAPI */
(function (window, jQuery, api) {
    "use strict";

    var _each = api.each,
        _cameraQueue = [];

    if (api.support.flash && (api.media && (!api.support.media || !api.html5 || api.insecureChrome))) {
        (function () {
            function _wrap(fn) {
                var id = fn.wid = api.uid();
                api.Flash._fn[id] = fn;
                return 'FileAPI.Flash._fn.' + id;
            }


            function _unwrap(fn) {
                try {
                    api.Flash._fn[fn.wid] = null;
                    delete api.Flash._fn[fn.wid];
                } catch (e) {
                }
            }

            var flash = api.Flash;
            api.extend(api.Flash, {

                patchCamera: function () {
                    api.Camera.fallback = function (el, options, callback) {
                        var camId = api.uid();
                        api.log('FlashAPI.Camera.publish: ' + camId);
                        flash.publish(el, camId, api.extend(options, {
                            camera: true,
                            onEvent: _wrap(function _(evt) {
                                if (evt.type === 'camera') {
                                    _unwrap(_);

                                    if (evt.error) {
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
                    _each(_cameraQueue, function (args) {
                        api.Camera.fallback.apply(api.Camera, args);
                    });
                    _cameraQueue = [];


                    // FileAPI.Camera:proto
                    api.extend(api.Camera.prototype, {
                        _id: function () {
                            return this.video.id;
                        },

                        start: function (callback) {
                            var _this = this;
                            flash.cmd(this._id(), 'camera.on', {
                                callback: _wrap(function _(evt) {
                                    _unwrap(_);

                                    if (evt.error) {
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

                        stop: function () {
                            this._active = false;
                            flash.cmd(this._id(), 'camera.off');
                        },

                        shot: function () {
                            api.log('FlashAPI.Camera.shot:', this._id());

                            var shot = api.Flash.cmd(this._id(), 'shot', {});
                            shot.type = 'image/png';
                            shot.flashId = this._id();
                            shot.isShot = true;

                            return new api.Camera.Shot(shot);
                        }
                    });
                }
            });

            api.Camera.fallback = function () {
                _cameraQueue.push(arguments);
            };

        }());
    }
}(window, window.jQuery, FileAPI));
