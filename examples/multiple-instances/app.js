
requirejs.config({
    paths: {
        'fro': '../../dist/fro'
    }
});

require([
    'fro'
], function(fro) {

    var froInstance1 = new fro({
        canvas: document.getElementById('fro-canvas-1')
    });

    froInstance1.renderer.setClearColor(0,255,0);
    froInstance1.run();

    // Second instance of the client in the same closure
    var froInstance2 = new fro({
        canvas: document.getElementById('fro-canvas-2')
    });

    froInstance2.renderer.setClearColor(0,0,255);
    froInstance2.run();
});

// Second closured instance of the client
require([
    'fro'
], function(fro) {

    var froInstance1 = new fro({
        canvas: document.getElementById('fro-canvas-3')
    });

    froInstance1.renderer.setClearColor(0,255,255);
    froInstance1.run();
});
