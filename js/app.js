
requirejs.config({
    paths: {
        'fro': 'vendor/fro',
        'Timer': 'vendor/fro', // Defined within the fro build
    }
});

require([
    'fro',
    'Timer'
], function(fro, Timer) {

    // In your application main, initialise fro
    var instance = new fro({
        plugins: {
            Nametag: {
                fontSize: 14
            },
            ChatBubble: {
                fontSize: 14,
                backgroundColor1: '#CAC',
                backgroundColor2: '#FEF'
            }
        },
        network: {
            server: 'http://localhost:3000',
            token: 'hi',
            room: 'test'
        },
        renderer: {
            canvas: document.getElementById('fro-canvas'),
            background: [145, 184, 101]
        },
        camera: {
            bounds: [-800, -600, 800, 600]
        },
        world: {
            templates: [
                {
                    id: 'crate',
                    type: 'prop',
                    image: {
                        id: 'crate',
                        type: 'image',
                        url: 'http://i.imgur.com/2LlSRc8.png',
                        fitToTexture: false,
                        width: 132,
                        height: 143
                    },
                    offset: [0, -24],
                    collisions: [-66, -95, 132, 98]
                },
                {
                    id: 'actorTest',
                    type: 'actor',
                    // TODO: w/h is redundant if we have to define an image.
                    // I say, if left out, let's load it from image data.
                    //w: 560,
                    //h: 415, 
                    /*image: {
                        id: 'carl',
                        type: 'image',
                        //url: 'https://placeholdit.imgix.net/~text?txtsize=24&txt=256%C3%97256&w=256&h=256',
                        url: 'http://i.imgur.com/N8JjF8V.jpg',
                        fitToTexture: false,
                        width: 560,
                        height: 415,
                        shader: 'shader:default' // TODO: This scoping for the default shader name is crap. 
                        // Reason being is that we share resource IDs between types. They need to *not* do that.
                    }*/
                    avatar: { // image: {
                        type: 'animation',
                        url: "http://i.imgur.com/MAT9aD2.png", // Original frojs default avatar
                        autoplay: true,
                        width: 32,
                        height: 64,
                        keyframes: {
                            move_2: {
                                loop: true,
                                frames: [0, 1000, 1, 1000]
                            },
                            move_8: {
                                loop: true,
                                frames: [3, 1000, 4, 1000]
                            },
                            move_4: {
                                loop: true,
                                frames: [6, 1000, 7, 1000]
                            },
                            move_6: {
                                loop: true,
                                frames: [9, 1000, 10, 1000]
                            },
                            stop_2: {
                                loop: false,
                                frames: [2, 1]
                            },
                            stop_8: {
                                loop: false,
                                frames: [5, 1]
                            },
                            stop_4: {
                                loop: false,
                                frames: [7, 1]
                            },
                            stop_6: {
                                loop: false,
                                frames: [10, 1]
                            },
                            act_2: {
                                loop: false,
                                frames: [8, 1]
                            }
                        }
                    }
                }
            ],
            entities: [
                {
                    template: 'crate',
                    position: [30, -20, 0]
                },
                {
                    template: 'crate',
                    position: [210, 100, 0]
                },
                {
                    template: 'crate',
                    position: [200, 0, 0]
                },
                {
                    template: 'actorTest',
                    id: 'test',
                    position: [0, 0, 0],
                    name: 'Test 1',
                    direction: 2, // south
                    action: 0 // idle
                },
                {
                    template: 'actorTest',
                    id: 'test2',
                    position: [50, 50, 0],
                    name: 'Test 2',
                    direction: 4, // east
                    action: 0 // idle
                },
                {
                    template: 'actorTest',
                    id: 'test3',
                    position: [-50, -50, 0],
                    name: 'Test 3',
                    direction: 8, // west
                    action: 0 // idle
                },
                {
                    template: 'actorTest',
                    id: 'test4',
                    position: [50, -50, 0],
                    name: 'Test 4',
                    direction: 2, // south
                    action: 2 // sit
                }
            ]
        }
    });

    // Test timers
    var fpsTimer = new Timer(function() {
        document.getElementById('fps').innerHTML = instance.getFramerate();
    }, 1000);

    fpsTimer.start();

    instance.camera.setCenter([0, 0]);
    instance.run();

    instance.player.actor = instance.world.find('test');
    instance.camera.followEntity(instance.player.actor);
});