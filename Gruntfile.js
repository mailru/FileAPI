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

		concat: {
			options: {
				banner: '/*! <%= pkg.name %> <%= pkg.version %> - <%= pkg.license %> | <%= pkg.repository.url %>\n' +
					' * <%= pkg.description %>\n' +
					' */\n\n',

				footer: 'if( typeof define === "function" && define.amd ){ define("FileAPI", [], function (){ return FileAPI; }); }'
			},

			all: {
				src: [
					  'lib/canvas-to-blob.js'
					, 'lib/FileAPI.core.js'
					, 'lib/FileAPI.Image.js'
					, 'lib/FileAPI.Form.js'
					, 'lib/FileAPI.XHR.js'
					, 'lib/FileAPI.Camera.js'
					, 'lib/FileAPI.Flash.js'
				],
				dest: 'dist/<%= pkg.name %>.js'
			},

			html5: {
				src: [
					  'lib/canvas-to-blob.js'
					, 'lib/FileAPI.core.js'
					, 'lib/FileAPI.Image.js'
					, 'lib/FileAPI.Form.js'
					, 'lib/FileAPI.XHR.js'
					, 'lib/FileAPI.Camera.js'
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
		}
	});


	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');


	// "npm test" runs these tasks
	grunt.registerTask('test', ['jshint']);


	// Default task.
	grunt.registerTask('default', ['test', 'concat', 'uglify']);
};
