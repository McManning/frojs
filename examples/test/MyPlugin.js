
define([
    'fro',
    'MyAnimation'
], function(fro, MyAnimation) {
    var BaseEntity = fro.entities.Entity;

    function MyPlugin(context, properties) {
        console.log('MyPlugin <- ', context);
    }

    // Register a new entity type
    function MyEntity(context, properties) {
        // ... do stuff
        BaseEntity.call(this, context, properties);

        // Utilize a custom animation plugin 
        this.myAnimation = new MyAnimation(context, {});
    }

    MyEntity.prototype = Object.create(BaseEntity.prototype);
    MyEntity.prototype.constructor = MyEntity;

    // Attach MyEntity to the global register of entities
    fro.entities.MyEntity = MyEntity;

    // Attach MyPlugin to the global register of plugins
    fro.plugins.MyPlugin = MyPlugin;
    return MyPlugin;
});
