
define([
    'fro'
], function(fro) {
    var BaseEntity = fro.entities.Entity;

    console.log(fro);

    function MyPlugin(context) {
        console.log('MyPlugin <- ', context);

        //console.log('Actor ', Actor);
    }

    // Register a new entity type

    function MyEntity(context, properties) {
        // ... do stuff
        BaseEntity.call(this, context, properties);
    }

    MyEntity.prototype = Object.create(BaseEntity.prototype);
    MyEntity.prototype.constructor = MyEntity;

    // Register as a new available entity type
    fro.entities.MyEntity = MyEntity;

    // Register this as a new plugin
    fro.plugins.MyPlugin = MyPlugin;

    return MyPlugin;
});