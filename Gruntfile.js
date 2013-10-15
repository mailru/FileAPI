'use strict';

module.exports = function (grunt){
	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		jshint: {
			all: [
				  'Gruntfile.js'
				, 'lib/**/*.js'
				, 'plugins/jquery.fileapi.js'
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
				, es5:			true
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

		qunit: {
			options: {
				files: {
					  '1px.gif':	['tests/files/1px.gif']
					, 'hello.txt':	['tests/files/hello.txt']
					, 'image.jpg':	['tests/files/image.jpg']
					, 'dino.png':	['tests/files/dino.png']
					, 'multiple':	['tests/files/1px.gif', 'tests/files/hello.txt', 'tests/files/image.jpg', 'tests/files/dino.png', 'tests/files/lebowski.json']
				}
			},
			all: ['tests/*.html']
		},

		concat: {
			options: {
				banner: '/*! <%= pkg.name %> <%= pkg.version %> - <%= pkg.license %> | <%= pkg.repository.url %>\n' +
					' * <%= pkg.description %>\n' +
					' */\n\n',

				footer: 'if( typeof define === "function" && define.amd ){ define("FileAPI", [], function (){ return FileAPI; }); }'
			},

			all: {
				src: [
					  'lib/FileAPI.core.js'
					, 'lib/FileAPI.Image.js'
					, 'lib/FileAPI.Form.js'
					, 'lib/FileAPI.XHR.js'
					, 'lib/FileAPI.Camera.js'
					, 'lib/FileAPI.Flash.js'
					, 'lib/load-image-ios.js'
					, 'lib/canvas-to-blob.js'
				],
				dest: 'dist/<%= pkg.name %>.js'
			},

			html5: {
				src: [
					  'lib/FileAPI.core.js'
					, 'lib/FileAPI.Image.js'
					, 'lib/FileAPI.Form.js'
					, 'lib/FileAPI.XHR.js'
					, 'lib/FileAPI.Camera.js'
					, 'lib/load-image-ios.js'
					, 'lib/canvas-to-blob.js'
				],
				dest: 'dist/<%= pkg.name %>.html5.js'
			}
		},

		uglify: {
			options: { banner: '/*! <%= pkg.name %> <%= pkg.version %> - <%= pkg.license %> | <%= pkg.repository.url %> */\n' },
			dist: {
				files: {
					  'dist/<%= pkg.name %>.min.js': ['<%= concat.all.dest %>']
					, 'dist/<%= pkg.name %>.html5.min.js': ['<%= concat.html5.dest %>']
					, 'dist/jquery.fileapi.min.js': ['plugins/jquery.fileapi.js']
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

	// Load custom QUnit task, based on grunt-contrib-qunit, but support "files" option.
	grunt.loadTasks('./tests/grunt-task/');

	// "npm build" runs these tasks
	grunt.registerTask('build', ['version', 'concat', 'uglify', 'qunit']);
	grunt.registerTask('default', ['jshint', 'build']);
};
