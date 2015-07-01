
requirejs.config({
    paths: {
        'Timer': '../../src/Timer',
        'jquery': '../../external/jquery-1.7.2.min'
    }
});

require([
    'jquery',
    'Timer'
], function($, Timer) {

    var total = 0;

    function foo(timer, elapsed) {
      //  console.log('foo! ' + elapsed + ' total ' + total);
        total = 0;
    }

    window.test = new Timer(foo, 10, true, false);
    //window.test.start();

    /*
    var timers = [];
    for (var i = 0; i < 10000; i++) {
        var timer = new Timer(function() { total++; }, 10, false, false);
        timers.push(timer);
        timer.start();
    }
    */
});

// Second encapsulation test
require([
    'jquery',
    'Timer'
], function($, Timer) {


    function shifter(timer, dt) {

        //var r = Math.floor(Math.random() * 100 + 50);
        console.log('dt: ' + dt + ' ' + Date.now());
        //console.log('next: ' + r);

        // update interval
        //timer.interval = r;
    }

    window.test2 = new Timer(shifter, 100); // Plays catch-up
    //window.test2.start();

    window.test3 = new Timer(shifter, 100, true); // lazy...
    window.test3.start();
});