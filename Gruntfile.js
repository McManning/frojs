module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: [
                'Gruntfile.js', 
                'src/**/*.js', 
                '!src/vendor/**/*.js', // Ignore vendor scripts
            ],
            options: {
                globals: {
                    console: false,
                    window: false,
                    document: false,
                    define: false,
                    requirejs: false,
                    module: false,
                    require: false
                },
                curly: true,
                eqeqeq: true,
                forin: true,
                undef: true,
                unused: true
            }
        },
        requirejs: {
            compile: {
                options: {
                    baseUrl: './src',
                    mainConfigFile: 'src/config.js',
                    // Uncomment these lines if we want to use almond instead
                    // and probably manually set a wrapper to something that makes
                    // more sense.
                    //name: '../external/almond',
                    //include: 'fro',
                    wrap: true,
                    name: 'fro',
                    optimize: 'none', // going to do this as a separate task
                    out: 'dist/fro.js'
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
                preserveComments: false,
                sourceMap: true,
                sourceMapName: "dist/fro.map"
            },
            dist: {
                files: {
                    'dist/fro.min.js': ['dist/fro.js']
                }
            }
        },
        watch: {
            files: [
                'Gruntfile.js', 
                'src/**/*.js', 
                'src/**/*.vs', // Packaged vertex shaders
                'src/**/*.fs' // Packaged fragment shaders
            ],
            tasks: ['dev']
        }
    });
    

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Faster build task for dev builds on watch
    grunt.registerTask('dev', ['jshint', 'requirejs']);

    // Full build task
    grunt.registerTask('default', ['jshint', 'requirejs', 'uglify']);

};