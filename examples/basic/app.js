
requirejs.config({
    paths: {
        'fro': '../../dist/fro',
        'jquery': '../../external/jquery-1.7.2.min'
    }
});

require([
    'jquery',
    'fro'
], function($, fro) {

    // In your application main, initialise fro
    fro.initialise({
        canvas: $('#fro-canvas')[0]
    });
});
