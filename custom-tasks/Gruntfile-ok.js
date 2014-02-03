'use strict';

module.exports = function (grunt) {
	// Project configuration.
	grunt.config.set('concat.ok', {
		src: [
			'lib/FileAPI.header.js'
			, 'lib/canvas-to-blob.js'
			, 'lib/FileAPI.core.js'
			, 'lib/FileAPI.Image.js'
			, 'lib/load-image-ios.js'
			, 'lib/FileAPI.Form.js'
			, 'lib/FileAPI.XHR.js'
			, 'lib/FileAPI.Flash.js'
			, 'plugins/FileAPI.exif.js'
		],
		dest: 'dist/<%= pkg.exportName %>.ok.js'
	});
	grunt.config.set('concat.html5ok', {
		src: [
			'lib/FileAPI.header.js'
			, 'lib/canvas-to-blob.js'
			, 'lib/FileAPI.core.js'
			, 'lib/FileAPI.Image.js'
			, 'lib/load-image-ios.js'
			, 'lib/FileAPI.Form.js'
			, 'lib/FileAPI.XHR.js'
			, 'plugins/FileAPI.exif.js'
		],
		dest: 'dist/<%= pkg.exportName %>.html5ok.js'
	});

	grunt.config.set('uglify.distok', {
		files: {
			'dist/<%= pkg.exportName %>.ok.min.js': ['<%= concat.ok.dest %>'], 'dist/<%= pkg.exportName %>.html5ok.min.js': ['<%= concat.html5ok.dest %>']
		}
	});

	grunt.config.set('compress.main', {
		options: {
			archive: '<%= pkg.name %>-<%= pkg.version.replace(/\\./g,"-") %>.zip'
		},
		files: [
			{cwd: 'dist/', expand: true, src: ['*'], dest: '<%= pkg.version.replace(/\\./g,"-") %>/'}
		]
	});


	grunt.registerTask('build-zip', ['build', 'compress']);

};
