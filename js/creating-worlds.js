
/*
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

});

*/


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

});
