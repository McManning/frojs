
requirejs.config({
    paths: {
        'fro': 'vendor/fro.min', //'../../frojs/dist/fro',
        'plugins': 'vendor/plugins',
        'emojify': 'vendor/emojify.min'
    },
    //baseUrl: '../../src',
    //plugins: '../../examples/test'
    //urlArgs: 'bust=' + Date.now()
});

require([
    'fro',
    'plugins/frojs.nametag',
    'plugins/frojs.chatbubble',
    'plugins/frojs.chat',
    'emojify' // note this has to be 'emojify' for frojs.chat to pick it up
], function(fro) {

    // Configuration for Club Dis
    var CLUB_DIS = {
        CAMERA_BOUNDS: [0, 0, 992, 852],
        templates: [
            {
                // Using a template to define spawn position
                // from the world JSON itself
                id: 'player_spawn',
                position: [936, 431, 1]
            },
            {
                id: 'ghost',
                type: 'Actor',
                avatar: {
                    type: 'Animation',
                    url: 'http://i.imgur.com/qickI1M.png',
                    autoplay: true,
                    width: 48,
                    height: 48,
                    keyframes: {
                        move_2: {
                            loop: false,
                            frames: [0, 10000]
                        }
                    }
                }
            }
        ],
        entities: [
            {
                id: 'floor',
                type: 'Prop',
                image: {
                    type: 'Image',
                    url: 'http://i.imgur.com/vPz1Mc6.png', // yay CORS! 'img/dis-floor.png',
                    fitToTexture: false,
                    width: 992,
                    height: 852
                },
                offset: [0, 0], // keep position at the top left
                collisions: [
                    // x, y, w, h
                    0,0,992,239, // backdrop
                    144,236,448,20, // cabinets
                    80,239,38,98, // counter left
                    118,300,602,36, // counter forward
                    0,704,992,16, // wall south
                    960,432,32,272, // couches south east
                    960,239,32,149, // couches north east
                    864,288,48,64, // glass table
                    800,432,32,143, // couches inner NS
                    696,556,104,19, // couches inner EW
                    0,239,16,465, // wall west
                    976,388,16,44 // wall east
                ],
                position: [0, 0, 0]
            },
            {
                id: 'counter',
                type: 'Prop',
                image: {
                    type: 'Image',
                    url: 'http://i.imgur.com/2dPUOQb.png', // 'img/dis-counter.png',
                    fitToTexture: false,
                    width: 608,
                    height: 48
                },
                position: [112, 319, 1],
                offset: [0, 48]
            }
        ]
    };

    avatar_urls = [
        'http://i.imgur.com/p9PY92l.png', // blue shirt
        'http://i.imgur.com/qP21knF.png', // red shirt
        'http://i.imgur.com/bjiG1kJ.png', // purple shirt
        'http://i.imgur.com/MAT9aD2.png', // green shirt
    ];

    // Generic avatar for testing
    var DEFAULT_AVATAR = {
        type: 'Animation',
        url: avatar_urls[Math.floor(Math.random()*avatar_urls.length)],
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
    };

    var instance = new fro.World({
        plugins: {
            Nametag: {
                fontSize: 14,
                fontColor: '#FFFFFF',
                fontFamily: '"Roboto", sans-serif'
            },
            ChatBubble: {
                fontSize: 14,
                fontFamily: '"Roboto", sans-serif'
                //backgroundColor1: '#CAC',
                //backgroundColor2: '#FEF',
            },
            Chat: {
                element: document.getElementById('chatbox'),
                placeholder: 'Say hi ...', // Input placeholder
                minWidth: 200, // Minimum dimensions when resizing
                minHeight: 100, // Minimum dimensions when resizing
                maxHistory: 10
            }
        },
        network: {
            server: 'http://localhost:3000/universe',
            token: 'hi',
            room: 'test'
        },
        renderer: {
            canvas: document.getElementById('fro-canvas'),
            background: [145, 184, 101]
        },
        camera: {
            bounds: CLUB_DIS.CAMERA_BOUNDS,
            trackPlayer: true
        },
        world: CLUB_DIS,
        player: {
            template: 'player_spawn',
            id: 'player',
            name: 'Guest',
            avatar: DEFAULT_AVATAR,
            direction: 2, // south
            action: 0 // idle
        }
    });

    // Network messages aren't tied into the main message engine yet, so
    // we're going to hook some things to the socket directly. 
    // I might advise against this :)
    instance.network.socket.on('connect', function() {
        Materialize.toast('Connected to Universe', 4000, 'green-text text-lighten-3');
        
        $('#network-error').hide();
    });

    instance.network.socket.on('disconnect', function() {
        Materialize.toast(
            '<i class="material-icons">sync_disabled</i> Disconnected! Waiting for reconnect',
            10000, 
            'red lighten-1'
        ); 

        $('#network-error').show();
    });

    instance.network.socket.on('auth', function() {
        Materialize.toast('Server says hello!', 4000, 'green-text text-lighten-3'); 
    });

    instance.network.socket.on('err', function(data) {
        // responseTo, message, developerMessage
        Materialize.toast(message, 4000, 'red lighten-1'); 
    });

    $(document).ready(function(){
        $('.scrollspy').scrollSpy();

        var scrollTimer = null;
        $(window).scroll(function() {
            if (scrollTimer) {
                clearTimeout(scrollTimer);
            }
            scrollTimer = setTimeout(onScroll, 50);
        });

        function onScroll() {
            scrollTimer = null;

            var top = $(window).scrollTop();
            if (top > 20) {
                $('#frojs-logo').addClass('large');
            } else {
                $('#frojs-logo').removeClass('large');
            }
        }

        $('#demo-header input').on('blur keyup', function(e) {
            if (e.type === 'keyup' && e.keyCode !== 10 && e.keyCode !== 13) return;

            var nickname = $(this).val() || 'Guest';
            if (instance.player.name !== nickname) {
                instance.player.setName(nickname);
            }
        });

        // TODO: Move these two input switchers elsewhere (frojs-chat plugin?)
        // they're quite useful for managing focus using the old tabbing method. 
        $('.input-container input').keydown(function(e) {
            if (e.which == 9) {
                $('#fro-canvas').focus();
                return false;
            } 
        });

        $('#fro-canvas').keydown(function(e) {
            if (e.which == 9) {
                $('.input-container input').focus();
                return false;
            }
        });
    });

    instance.run();
    instance.renderer.canvas.focus();

    window.fro = instance;
});
