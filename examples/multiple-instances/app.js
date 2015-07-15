
requirejs.config({
    paths: {
        'fro': '../../dist/fro'
    }
});

require([
    'fro'
], function(fro) {

    window.froInstance1 = new fro.World({
        renderer: {
            canvas: document.getElementById('fro-canvas-1'),
            background: [255, 0, 0]
        },
        world: {}
    });

    froInstance1.run();

    // Second instance of the client in the same closure
    window.froInstance2 = new fro.World({
        renderer: {
            canvas: document.getElementById('fro-canvas-2'),
            background: [0, 255, 0]
        },
        world: {}
    });

    froInstance2.run();
});

// Second closured instance of the client
require([
    'fro'
], function(fro) {

    window.froInstance3 = new fro.World({
        renderer: {
            canvas: document.getElementById('fro-canvas-3'),
            background: [0, 0, 255]
        },
        world: {}
    });

    froInstance3.run();
});
