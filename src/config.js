/**
 * Configuration file for building via grunt/requirejs. 
 * Not necessary in the final build (so far, at least)
 */
requirejs.config({
    baseUrl: 'src',
    paths: {
        text: 'vendor/text',
        glMatrix: 'vendor/glMatrix'
    }
});
