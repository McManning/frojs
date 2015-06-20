module.exports = function(grunt) {
    "use strict";

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                globals: {
                    console: true,
                    module: true,
                    // TODO: Build glMatrix as well
                    vec3: true,
                    rect: true,
                    mat4: true,
                }
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
                    out: 'dist/fro.js',
                    exclude: [
                        'jquery'
                    ]
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
            files: ['Gruntfile.js', 'require-config.js', 'src/**/*.js'],
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