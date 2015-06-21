/**
 * Configuration file for building via grunt/requirejs. 
 * Not necessary in the final build (so far, at least)
 */
requirejs.config({
    baseUrl: 'src',
    paths: {
        jquery: '../external/jquery-1.7.2.min',
        text: '../external/text'
    }
});
