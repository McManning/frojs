
requirejs.config({
    paths: {
        'fro': '../../dist/fro'
    }
});

require([
    'fro'
], function(fro) {

    // In your application main, initialise fro
    var instance = new fro.World({
        renderer: {
            canvas: document.getElementById('fro-canvas'),
            background: [0, 255, 255]
        },
        world: {}
    });

    instance.run();
});
