/**
 * Configuration file for building via grunt/requirejs. 
 * Not necessary in the final build (so far, at least)
 */
requirejs.config({
    baseUrl: 'src',
    paths: {
        text: 'vendor/text',
        glMatrix: 'vendor/glMatrix'
        //browser: '../node_modules/debug/browser',
        //debug: '../node_modules/debug/debug',
        //ms: '../node_modules/debug/node_modules/ms/index'
    },
    cjsTranslate: true,
});
