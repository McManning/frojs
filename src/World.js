/*!
 *  frojs is a Javascript based visual chatroom client.
 *  Copyright (C) 2015 Chase McManning <cmcmanning@gmail.com>
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program; if not, write to the Free Software Foundation, Inc.,
 *  51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

define([
    'EventHooks',
    'Utility',
    'Timer',
    'Audio',
    'Resources',
    'Renderer',
    'Camera',
    'Input',
    'Player',
    'Network'
], function(EventHooks, Util, Timer, Audio, Resources, 
            Renderer, Camera, Input, Player, Network) {

    var FRAMERATE = 1000/30;

    function World(properties) {
        Util.extend(this, EventHooks);

        if (!properties.hasOwnProperty('world')) {
            throw Error('What is a fro without a world? You need to specify world data.');
        }

        this.id = properties.world.id || '';
        this.plugins = {};
        this.renderableEntities = [];
        this.otherEntities = [];
        this.templates = properties.world.templates || {};

        // Set up properties to record framerates
        this.framerates = [];
        this.numFramerates = 10;
        this.renderTime = -1;

        // Initialise submodules
        this.resources = new Resources(this);

        this.audio = new Audio(this, properties.audio || {});
        this.renderer = new Renderer(this, properties.renderer || {});
        this.input = new Input(this, properties.input || {});

        this.loadPlayer(properties.player);
        this.loadEntities(properties.world.entities || []);

        // Load after player/entities, in case we want to track an entity
        this.camera = new Camera(this, properties.camera || {});

        // If we specify network settings, connect us to a server
        if (properties.hasOwnProperty('network')) {
            this.network = new Network(this, properties.network);
        }

        // Load plugins, if any are specified
        var fro = require('fro');
        if (properties.hasOwnProperty('plugins')) {
            for (var name in properties.plugins) {
                if (properties.plugins.hasOwnProperty(name)) {

                    // Check if the plugin method exists
                    if (!fro.plugins.hasOwnProperty(name)) {
                        throw new Error('Plugin [' + name + '] is not registered.');
                    }

                    // If a plugin has just a boolean for enable, default properties to {}
                    if (properties.plugins[name] === true) {
                        properties.plugin[name] = {};
                    }

                    if (properties.plugins[name] !== false) {
                        this.plugins[name] = new fro.plugins[name](
                            this, 
                            properties.plugins[name]
                        ); 
                    }
                }
            }
        }
    }

    World.prototype.loadPlayer = function(properties) {

        // If this entity has an associated template 
        // (or a default template has been defined), merge
        // properties from the template into this entity instance
        var template = this.getTemplate(properties.template || 'default');
        Util.extend(properties, template);

        this.player = new Player(this, properties);
        this.add(this.player);
    };

    /** 
     * Retrieve an entity template by ID. If one does not exist,
     * this will return an empty object. 
     *
     * @param {string} id 
     *
     * @return object
     */
    World.prototype.getTemplate = function(id) {
        for (var i = 0; i < this.templates.length; i++) {
            if (this.templates[i].id === id) {
                return this.templates[i];
            }
        }

        // Return an empty template as default
        return {};
    };

    /** 
     * Shorthand to load multiple entities from an array.
     * Returns an array of all entity instances successfully loaded.
     * 
     * @param {array} entities An array of entity objects to load.
     *
     * @return {array}
     */
    World.prototype.loadEntities = function(entities) {
        var instances = [],
            instance;

        for (var i = 0; i < entities.length; i++) {
            instance = this.loadEntity(entities[i]);
            if (instance) {
                instances.push(instance);
            }
        }

        return instances;
    };

    /**
     * 
     *
     * @param {object} entity a single entity object to load.
     *
     * @return {object|null}
     */
    World.prototype.loadEntity = function(properties) {
        // Late-require fro so we don't get caught 
        // in a dependency cycle on import
        var fro = require('fro');

        var id = properties.id,
            instance = null,
            type;
        
        // If this entity has an associated template 
        // (or a default template has been defined), merge
        // properties from the template into this entity instance
        var template = this.getTemplate(properties.template || 'default');
        Util.extend(properties, template);

        // Defined after template injection so we can define types by template.
        type = properties.type;

        // If we don't have a loader for this entity, throw an error
        if (!fro.entities.hasOwnProperty(type)) {
            throw new Error(
                'Unknown type [' + type + '] for required entity [' + id + ']'
            );
        }

        // Call a loader based on entity type
        instance = new fro.entities[type](this, properties);

        // Add it to the world
        this.add(instance);

        return instance;
    };

    /** 
     * Returns true if any entities on the map are still loading,  
     * and demand for the map to wait for them to finish.
     *   
     * @return {boolean}
     */
    World.prototype.isLoading = function() {
        // TODO: isLoading
        throw new Error('Not implemented');
    };

    /**
     * Search the world for an entity by ID and return the 
     * matching entity, or null if one does not exist. 
     *
     * @param {string} id unique entity ID to find.
     * 
     * @return {object|null}
     */
    World.prototype.find = function(id) {
        
        // TODO: This can/should be optimized further.
        // Start throwing around hash maps. 

        for (var i = 0; i < this.renderableEntities.length; i++) {
            if (this.renderableEntities[i].id === id) {
                return this.renderableEntities[i];
            }
        }
        
        for (var j = 0; j < this.otherEntities.length; j++) {
            if (this.otherEntities[j].id === id) {
                return this.otherEntities[j];
            }
        }
        
        return null;
    };

    /** 
     * Add an entity instance to the world.
     * Based on the isRenderable flag, this will either add the entity
     * to the render list, or to the other entities list for optimization.
     *
     * @param {object} entity
     */
    World.prototype.add = function(entity) {
        
        // Let listeners know a new entity instance has been created,
        // but before it's actually added to the world. 
        this.fire('new.entity', entity);
        
        if (entity.isRenderable) {
            this.renderableEntities.push(entity);
            this.resort();
        } else {
            this.otherEntities.push(entity);
        }
        
        this.fire('add.entity', entity);
    };

    /** 
     * Removes an entity by reference from the world. In order to fully 
     * delete an entity, do NOT call this method and instead call 
     * entity.destroy() which will also perform removal from the world. 
     * Returns true if the entity was removed successfully, or false if 
     * it could not be found in the world. 
     * 
     * @param {object} entity
     */
    World.prototype.remove = function(entity) {

        // TODO: Allow this to be callable from the world anyway, 
        // and not just entity.destroy()

        var index = this.renderableEntities.indexOf(entity);
        if (~index) {
            this.renderableEntities.splice(index, 1);
            this.fire('remove.entity', entity);
            return true;
        }

        // If not in that list, try non-renderables
        index = this.otherEntities.indexOf(entity);
        if (~index) {
            this.otherEntities.splice(index, 1);
            this.fire('remove.entity', entity);
            return true;
        }

        return false;
    };

    /** 
     * Flag a resort of the renderable entities. 
     * Usually called whenever an entity changes position or Z-order.
     */
    World.prototype.resort = function() {

        this.needsResort = true;
    };

    /** 
     * Reorganizes props on the map based on their Z order and position.
     * Do NOT call this directly, and instead call resort() to flag the
     * world as dirty.
     */
    World.prototype.sortRenderables = function() {
        
        // TODO: Mad amounts of optimization. E.g. if something moved on a 
        // z-order that nothing else has, there's no reason those entities
        // should be resorted. Likewise things a large distance from the 
        // moved entity don't need to be resorted. Look into speeding this up.

        /*
            Return less than zero if left should be lower indexed than right
            0 if left is the same as right
            greater than zero if left should be higher indexed than right
        */
        this.renderableEntities.sort(function(left, right) {

            var pl = left.getPosition();
            var pr = right.getPosition();
            
            // left lower z order
            if (pl[2] < pr[2]) {
                return -1;
            }
            
            // right lower z order
            if (pl[2] > pr[2]) {
                return 1;
            }
                
            // Else, order depends on Y position
            
            // left is lower (therefore in front of right & higher indexed)
            if (pl[1] < pr[1]) {
                return -1;
            }
                    
            // Right is lower (therefore in front of left & higher indexed)
            if (pl[1] > pr[1]) {
                return 1;
            }
                
            return 0;
        });
    };

    World.prototype.run = function() {
        
        this.lastTime = this.startTime = Date.now();
        this.heartbeat();
    };

    World.prototype.heartbeat = function() {
        window.requestAnimationFrame(this.heartbeat.bind(this));

        var now = Date.now();
        var delta = now - this.lastTime;

        if (delta > FRAMERATE) {
            this.render();
            this.snapshot();

            this.lastTime = now - (delta % FRAMERATE);
        }
    };

    World.prototype.snapshot = function() {
    
        if (this.renderTime < 0) {
            this.renderTime = new Date().getTime();
        } else {
            var newTime = new Date().getTime();
            var t = newTime - this.renderTime;
            
            if (t === 0) {
                return;
            }

            var framerate = 1000/t;
            this.framerates.push(framerate);
            while (this.framerates.length > this.numFramerates) {
                this.framerates.shift();
            }

            this.renderTime = newTime;
        }
    };
    
    World.prototype.getFramerate = function() {
        var tot = 0;
        for (var i = 0; i < this.framerates.length; ++i) {
            tot += this.framerates[i];
        }

        var framerate = tot / this.framerates.length;
        framerate = Math.round(framerate);
        
        return framerate;
    };

    World.prototype.render = function() {
        this.camera.setupViewport();

        // If we need to resort our renderables, do so
        if (this.needsResort) {
            this.needsResort = false;
            this.sortRenderables();
        }
        
        // Doodle some props
        for (var i = 0; i < this.renderableEntities.length; i++) {
            if (this.renderableEntities[i].visible) {
                this.renderableEntities[i].render();
            }
        }
    };

    /** 
     * Returns true if there's a solid entity between start and end vectors
     *
     * @param {vec3} start
     * @param {vec3} end
     * @return {boolean}
     */
    World.prototype.isPathBlocked = function(start, end) {
        // jshint unused:false

        return false; // TODO
    };

    /**
     * Returns true if an entity collides with the specified world rect.
     *
     * @param {rect} r
     * @param {entity} excluding If supplied, this entity will be ignored
     *
     * @return {boolean}
     */
    World.prototype.isRectBlocked = function(r, excluding) {

        for (var i = 0; i < this.renderableEntities.length; i++) {
            if (this.renderableEntities[i] !== excluding && 
                this.renderableEntities[i].collides(r)) {
                return true;
            }
        }
        
        for (var j = 0; j < this.otherEntities.length; j++) {
            if (this.otherEntities[j] !== excluding && 
                this.otherEntities[j].collides(r)) {
                return true;
            }
        }
        
        return false;
    };

    return World;
});
