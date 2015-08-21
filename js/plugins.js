

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
