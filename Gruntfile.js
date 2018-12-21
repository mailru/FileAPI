'use strict';

module.exports = function (grunt) {
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			all: [
				  'Gruntfile.js'
				, 'lib/**/*.js'
				, 'plugins/jquery.fileapi.js'
				, 'node/**/*.js'
			],

			options: {
				  curly:	true	// + "Expected '{' and instead saw 'XXXX'."
				, immed:	true
				, latedef:	true
				, newcap:	true	// "Tolerate uncapitalized constructors"
				, noarg:	true
				, sub:		true
				, undef:	true
				, unused:	true
				, boss:		true
				, eqnull:	true

				, node:			true
				, expr:			true // - "Expected an assignment or function call and instead saw an expression."
				, supernew:		true // - "Missing '()' invoking a constructor."
				, laxcomma:		true
				, laxbreak:		true
				, smarttabs:	true
			}
		},

		version: {
			src: 'lib/FileAPI.core.js'
		},

		connect: {
			server: {
				options: {
					port: 9001,
					base: '.'
				}
			},
			standalone: {
				options: {
					hostname: '*',
					keepalive: true,
					port: 9001,
					base: '.'
				}
			}
		},

		curl: {
			jpg: {
				src: 'https://dl.dropboxusercontent.com/u/49592745/BigJPG.jpg',
				dest: 'tests/files/big.jpg'
			}
		},

		qunit: {
			all: {
				options: {
					timeout: 5 * 60 * 1000, // 5min
					files: {
						  '1px_gif':	['tests/files/1px.gif']
						, 'big.jpg':	['tests/files/big.jpg']
						, 'hello.txt':	['tests/files/hello.txt']
						, 'image.jpg':	['tests/files/image.jpg']
						, 'dino.png':	['tests/files/dino.png']
						, 'multiple':	['tests/files/1px.gif', 'tests/files/hello.txt', 'tests/files/image.jpg', 'tests/files/dino.png', 'tests/files/lebowski.json']
					},
					urls: ['http://127.0.0.1:<%=connect.server.options.port%>/tests/index.html']
				}
			}
		},

		concat: {
			options: {
				banner: '/*! <%= pkg.exportName %> <%= pkg.version %> - <%= pkg.license %> | <%= pkg.repository.url %>\n' +
					' * <%= pkg.description %>\n' +
					' */\n\n',

				footer: 'if( typeof define === "function" && define.amd ){ define("<%= pkg.jam.name %>", [], function (){ return FileAPI; }); }'
			},

			all: {
				src: [
					  'lib/canvas-to-blob.js'
					, 'lib/FileAPI.core.js'
					, 'lib/FileAPI.Image.js'
					, 'lib/load-image-ios.js'
					, 'lib/FileAPI.Form.js'
					, 'lib/FileAPI.XHR.js'
					, 'lib/FileAPI.Camera.js'
					, 'lib/FileAPI.Flash.js'
					, 'lib/FileAPI.Flash.Camera.js'
				],
				dest: 'dist/<%= pkg.exportName %>.js'
			},

			html5: {
				src: [
					  'lib/canvas-to-blob.js'
					, 'lib/FileAPI.core.js'
					, 'lib/FileAPI.Image.js'
					, 'lib/load-image-ios.js'
					, 'lib/FileAPI.Form.js'
					, 'lib/FileAPI.XHR.js'
					, 'lib/FileAPI.Camera.js'
					, 'lib/FileAPI.Flash.Camera.js'
				],
				dest: 'dist/<%= pkg.exportName %>.html5.js'
			}
		},

		uglify: {
			options: { banner: '/*! <%= pkg.exportName %> <%= pkg.version %> - <%= pkg.license %> | <%= pkg.repository.url %> */\n' },
			dist: {
				files: {
					  'dist/<%= pkg.exportName %>.min.js': ['<%= concat.all.dest %>']
					, 'dist/<%= pkg.exportName %>.html5.min.js': ['<%= concat.html5.dest %>']
				}
			}
		},

		mxmlc: {
			core: {
				options: {
					rawConfig: '-target-player=10.1  -static-link-runtime-shared-libraries=true -compiler.debug=false' +
						' -library-path+=flash/core/lib/blooddy_crypto.swc -library-path+=flash/core/lib/EnginesLibrary.swc'
				},
				files: {
					'dist/<%= pkg.exportName %>.flash.swf': ['flash/core/src/FileAPI_flash.as']
				}
			},
			image: {
				options: {
					rawConfig: '-static-link-runtime-shared-libraries=true -compiler.debug=false' +
						' -library-path+=flash/image/lib/blooddy_crypto.swc'
				},
				files: {
					'dist/<%= pkg.exportName %>.flash.image.swf': ['flash/image/src/FileAPI_flash_image.as']
				}
			},
			camera: {
				options: {
					rawConfig: '-static-link-runtime-shared-libraries=true -compiler.debug=false'
				},
				files: {
					'dist/<%= pkg.exportName %>.flash.camera.swf': ['flash/camera/src/FileAPI_flash_camera.as']
				}
			}
		},

		watch: {
			scripts: {
				files: 'lib/**/*.js',
				tasks: ['concat'],
				options: { interrupt: true }
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-version');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-mxmlc');
	grunt.loadNpmTasks('grunt-curl');

	// Load custom QUnit task, based on grunt-contrib-qunit, but support "files" option.
	grunt.loadTasks('./tests/grunt-task/');
	grunt.loadTasks('./custom-tasks/');

	// "npm build" runs these tasks
	grunt.registerTask('prepare-test-files', function (){
		// big.jpg added to git
		/*if (!grunt.file.exists('tests/files/big.jpg')) {
			grunt.task.run('curl');
		}*/
	});

	grunt.registerTask('express', 'Start a custom web server.', function() {
		var done = this.async();

		require('./node/server.js').createServer(8000, function () {
			done();
		});
	});

	grunt.registerTask('server', ['connect:server', 'express']);
	grunt.registerTask('dev', ['concat', 'server', 'watch']);
	grunt.registerTask('tests', ['jshint', 'concat', 'server', 'prepare-test-files', 'qunit']);
	grunt.registerTask('build', ['version', 'concat', 'uglify']);
	grunt.registerTask('build-all', ['build', 'mxmlc']);
	grunt.registerTask('default', ['tests', 'build']);
};
