
requirejs.config({
    paths: {
        'fro': 'vendor/fro.min',
        //'Nametag': 'plugins/Nametag'
        //'plugins': '../../src/plugins',
        //'frochat': '../../../frochat/src/frochat',
        //'emojify': '../../../frochat/src/vendor/emojify.min'
    },
    //baseUrl: '../../src',
    //plugins: '../../examples/test'
    //urlArgs: 'bust=' + Date.now()
});

require([
    'fro'
], function(fro) {

    $(document).ready(function(){
        $('.tooltipped').tooltip({delay: 0});
    });

    var instance = new fro.World({
        plugins: {
            /*Nametag: {
                fontSize: 14
            },
            ChatBubble: {
                fontSize: 14,
                backgroundColor1: '#CAC',
                backgroundColor2: '#FEF'
            },
            Frochat: {
                element: document.getElementById('chatbox'),
                placeholder: 'Send a message ...', 
                minWidth: 200,
                minHeight: 100,
                maxHistory: 100,
                maxMessageLength: 140
            }*/
        },
        /*network: {
            server: 'http://localhost:3000/universe',
            token: 'hi',
            room: 'test'
        },*/
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
                    type: 'Prop',
                    image: {
                        type: 'Image',
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
                    type: 'Actor',
                    avatar: {
                        type: 'Animation',
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
        },
        player: {
            template: 'actorTest',
            id: 'player',
            position: [0, 0, 0],
            name: 'Local Player',
            direction: 2, // south
            action: 0 // idle
        }
    });

    var fpsTimer = new fro.Timer(function() {
        document.getElementById('fps').innerHTML = instance.getFramerate();
    }, 1000);

    instance.camera.setCenter([0, 0]);
    instance.run();
    fpsTimer.start();

    // Toggle help text on input blur
    instance.input
        .bind('canvasblur', function() {
            $('#controls-hint').hide();
            $('#focus-hint').show();
        })
        .bind('canvasfocus', function() {
            $('#controls-hint').show();
            $('#focus-hint').hide();
        });

    instance.renderer.canvas.focus();

    // Was going to force focus on the canvas, but that's a terrible idea
    // (prevents highlighting and whatnot on the rest of the page).
    // Maybe an option for the engine to listen to events globally?
    //$('#fro-canvas').focus().blur(function() { $(this).focus(); });
});

