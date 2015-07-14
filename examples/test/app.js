
requirejs.config({
    paths: {
        'fro': '../../dist/fro',
        'Timer': '../../dist/fro', // Defined within the fro build
    },
    //urlArgs: 'bust=' + Date.now()
});

require([
    'fro',
    'MyPlugin'
], function(fro, MyPlugin) {

    // In your application main, initialise fro
    var instance = new fro.World({
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
        /*network: {
            server: 'http://localhost:3000',
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


    console.log('1.l - ', Object.keys(fro.plugins).length);
    console.log('1 - ', fro);

    var plugin = new MyPlugin(instance);


    console.log('2.l - ', Object.keys(fro.plugins).length);
    console.log('2 - ', fro);

    // Test timers
    var fpsTimer = new fro.utils.Timer(function() {
      //  document.getElementById('fps').innerHTML = instance.getFramerate();
    }, 1000);

    fpsTimer.start();

    // Test input events
    instance.input
        .bind('mousedown', console, function() {
            //this.log('mousedown');
            //debugger;
            
            // Figure out where we clicked in world space
            var position = instance.input.getCursorPosition();

            console.log(position);
            instance.camera.canvasVec3ToWorld(position);
            console.log(position);

            // Spawn a new crate!
            instance.world.loadEntity({
                template: 'crate',
                position: position
            });

            //instance.world.find('test').setDestination(destination);
        })
        .bind('keydown', console, function(evt) {
            this.log('keydown: ' + evt.keyCode);
        })
        .bind('canvasfocus', console, function() {
            this.log('canvasfocus');
        })
        .bind('canvasblur', console, function() {
            this.log('canvasblur');
        })
        .bind('blur', console, function() {
            this.log('blur');
        })
        .bind('focus', console, function() {
            this.log('focus');
        })
        .bind('keyup', console, function(evt) {
            this.log('keyup: ' + evt.keyCode);
        })
        .bind('mouseup', console, function() {
            this.log('mouseup');
        });

    // Test camera events
    instance.camera
        .bind('move', function(position) {
            console.log('Camera moved to ' + vec3.str(position));
            console.log(this);
        });
/*
    // Test resource loader (JSON)
    instance.resources
        .load({
            id: 'test',
            type: 'json',
            url: 'http://mysafeinfo.com/api/data?list=popes&format=json'
        })
        .bind('onload', function() {
            console.log('Loaded popes');
            console.log(this.getJson());
        })
        .bind('onerror', function() {
            console.log('Failed to load JSON resource');
        });

    instance.resources
        .load({
            id: 'test-sound',
            type: 'sound',
            url: 'http://hydra-media.cursecdn.com/dota2.gamepedia.com/a/a5/Bane_blink_03.mp3'
        })
        .bind('onload', function() {
            console.log(this);

            // Do playback or something
        })
        .bind('onerror', function() {
            console.log('Failed to load sound resource');
        });
*/
    instance.camera.setCenter([0, 0]);
    //instance.run();

    //var nametag = new NametagPlugin(instance, {});

    instance.player.actor = instance.find('test');
    //instance.camera.followEntity(instance.player.actor);

    // Attach to window so I can debug easier :/
    window.fro1 = instance;

    // Bind our input box to create coolio chat bubbles
    document.getElementById('chat-input').addEventListener('keydown', function(evt) {
        if (evt.keyCode === KeyEvent.DOM_VK_RETURN) {
            instance.player.actor.say(this.value);

            var line = document.createElement('li');
            line.appendChild(document.createTextNode(this.value));

            document.getElementById('chat-output').appendChild(line);

            this.value = '';
        }
    });

});



require([
    'fro'
], function(instance2) {

    console.log('req2.l - ', Object.keys(instance2.plugins).length);
    console.log('req2 - ', instance2);

    window.fro2 = instance2;
});

