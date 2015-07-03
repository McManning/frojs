
requirejs.config({
    paths: {
        'fro': '../../dist/fro',
        'Timer': '../../dist/fro', // Defined within the fro build
    },
    urlArgs: 'bust=' + Date.now()
});

require([
    'fro',
    'Timer'
], function(fro, Timer) {

    // In your application main, initialise fro
    var instance = new fro({
        renderer: {
            canvas: document.querySelectorAll('#fro-canvas')[0],
            background: [0, 255, 0]
        },
        world: {
            templates: [
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
                    template: 'actorTest',
                    id: 'test',
                    position: [0, 0, 0],
                    name: 'Test 1',
                    direction: 2, // south
                    action: 0 // idle
                },
                /*{
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
                    id: 'test3',
                    position: [50, -50, 0],
                    name: 'Test 3',
                    direction: 2, // south
                    action: 2 // sit
                },*/
            ]
        }
    });

    // Test timers
    var fpsTimer = new Timer(function() {
        document.querySelector('#fps').innerHTML = instance.getFramerate();
    }, 1000);

    fpsTimer.start();

    // Test input events
    instance.input
        .bind('mousedown', console, function() {
            //this.log('mousedown');
            //debugger;
          /*  var position = instance.input.getCursorPosition();
            var destination = vec3.create();
            instance.camera.canvasVec3ToWorld(position, destination);
            console.log(destination);

            instance.world.find('test').setDestination(destination); */
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

    instance.camera.setCenter(0, 0);
    instance.run();

    instance.player.actor = instance.world.find('test');

    // Attach to window so I can debug easier :/
    window.fro = instance;
});
