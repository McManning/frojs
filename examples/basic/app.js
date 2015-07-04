
requirejs.config({
    paths: {
        'fro': '../../dist/fro'
    }
});

require([
    'fro'
], function(fro) {

    // In your application main, initialise fro
    var instance = new fro({
        canvas: document.getElementById('fro-canvas')
    });

    instance.run();
});
