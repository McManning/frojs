
define([
    'fro'
], function(fro) {
    var Animation = fro.resources.Animation;

    if (typeof(Animation) !== 'function') {
        throw Error('Missing Animation resource definition');
    }

    // Register a new resource type, based off Animation
    function MyAnimation(context, properties) {
        Animation.call(this, context, properties);
        console.log('MyAnimation <- ', context);
    }

    MyAnimation.prototype = Object.create(Animation.prototype);
    MyAnimation.prototype.constructor = MyAnimation;

    // Attach MyAnimation to the global register of resource types
    fro.resources.MyAnimation = MyAnimation;

    return MyAnimation;
});
