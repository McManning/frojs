
requirejs.config({
    paths: {
        'fro': '../../dist/fro'
    },
    urlArgs: 'bust=' + Date.now()
});

require([
    'fro'
], function(fro) {

    /**
     * Create a new cluster of Actor entities around the given position.
     *
     * @param {World} context
     * @param {vec3} position
     */
    function spawnActorCluster(context, position) {
        var radius = 100;
        var total = 20;

        var x, y;

        while (total--) {
            x = position[0] + Math.floor(Math.random() * radius * 2 - radius);
            y = position[1] + Math.floor(Math.random() * radius * 2 - radius);

            context.loadEntity({
                template: 'actorTest', //'crate',
                position: [x, y, 0],
                direction: Math.floor(Math.random() * 9 + 1),
                name: 'Actor ' + context.renderableEntities.length 
            });
        }
    }

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
                    id: 'actorTest',
                    type: 'Actor',
                    avatar: { // image: {
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
                    template: 'actorTest',
                    id: 'test',
                    position: [0, 0, 0],
                    name: 'Local Player',
                    direction: 2, // south
                    action: 0 // idle
                }
            ]
        }
    });

    // Test timers
    var fpsTimer = new fro.Timer(function() {
        document.getElementById('fps').innerHTML = instance.getFramerate();
    }, 1000);

    fpsTimer.start();

    // Test input events
    instance.input
        .bind('mousedown', console, function() {
            //this.log('mousedown');
            //debugger;
            
            // Figure out where we clicked in world space
            var position = instance.input.getCursorPosition();
            instance.camera.canvasVec3ToWorld(position);

            // Spawn MORE ACTORS!
            spawnActorCluster(instance, position);
        });

    // Spawn some default clusters
    var x, y, clusters = 60, radius = 700;
    while (clusters--) {
        x = Math.floor(Math.random() * radius * 2 - radius);
        y = Math.floor(Math.random() * radius * 2 - radius);
        spawnActorCluster(instance, [x, y, 0]);
    }

    instance.camera.setCenter([0, 0]);
    instance.run();

    //var nametag = new NametagPlugin(instance, {});

    instance.player.actor = instance.find('test');
    //instance.camera.followEntity(instance.player.actor);

    // Attach to window so I can debug easier :/
    window.fro = instance;

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
