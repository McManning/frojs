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
    'fro'
], function(fro) {
    // Shorthand things a bit
    var Entity = fro.entities.Entity,
        Actor = fro.entities.Actor,
        FontImage = fro.resources.FontImage;

    if (typeof(Entity) !== 'function') {
        throw Error('Missing Entity entity definition');
    }

    if (typeof(Actor) !== 'function') {
        throw Error('Missing Actor entity definition');
    }

    if (typeof(FontImage) !== 'function') {
        throw Error('Missing FontImage resource definition');
    }

    var NICKNAME_ZORDER = 998; // TODO: global UI_ZORDER
    
    /**
     * New entity type that is simply a rendering of an Actor's
     * name property overhead that actor. 
     *
     * @param {object} context fro instance
     * @param {object} properties to tweak rendering this Nametag
     */
    function Nametag(context, properties) {
        Entity.call(this, context, properties);
        
        this.isRenderable = true; // Add this entity to the render queue

        this.fontFamily = properties.fontFamily || 'sans-serif';
        this.fontColor = properties.fontColor || '#000000';
        this.fontSize = properties.fontSize || 14;

        // Move our Z-order up to the UI layer
        this.position[2] = NICKNAME_ZORDER;
        
        this.updateText = this.updateText.bind(this);
        this.updateOffset = this.updateOffset.bind(this);
    }

    Nametag.prototype = Object.create(Entity.prototype);
    Nametag.prototype.constructor = Nametag;

    /**
     * Override to bind parent update events to also update this nametag.
     *
     * @param {Entity} entity
     */
    Nametag.prototype.setParent = function(entity) {
        Entity.prototype.setParent.call(this, entity);

        if (entity) {
            entity
                .bind('name.Nametag', this.updateText)
                .bind('move.Nametag, avatar.Nametag', this.updateOffset);

            this.updateText(entity.name);
            this.updateOffset();
        }
    };

    /**
     * Update displayed text to the new parent name.
     */
    Nametag.prototype.updateText = function() {
        
        if (this.parent.name.length < 1) { // No nickname, hide this entity
            this.visible = false;
            
        } else {
            // regenerate a name texture
            this.image = new FontImage(this.context, {
                text: this.parent.name,
                fontFamily: this.fontFamily,
                fontColor: this.fontColor,
                fontSize: this.fontSize
            });
        
            this.updateOffset();
        }
    };

    /**
     * Update offset to remain overhead the parent. This may be 
     * called when the parent's avatar changes dimensions. 
     */
    Nametag.prototype.updateOffset = function() {
        if (this.parent) {
            var parentOffset = this.parent.getOffset();
            this.offset[0] = this.image.width * 0.5;
            this.offset[1] = parentOffset[1] + this.image.height + 10;
        }

        this.updateTranslation();
    };

    Nametag.prototype.render = function() {

        this.image.render(this.translation, 0.0);
    };

    /**
     * @param {rect} r
     */
    Nametag.prototype.getBoundingBox = function(r) {

        // TODO: factor in rotations and scaling
        // and utilize this.renderable.getTopLeft(), getBottomRight(), etc
        
        // TODO: this is incorrect. We center the (x, y)
        r[0] = this.position[0];
        r[1] = this.position[1];
        r[2] = this.image.width;
        r[3] = this.image.height;
    };

    /**
     * Entry point for the Nametag plugin. This will listen on the 
     * `add` event for whenever new entities are added to the world 
     * and attach a child Nametag entity to them, if they were inherited
     * from the Actor base class. 
     *
     * @param {object} context fro instance to bind the plugin
     * @param {object} options for this plugin (equivalent 
     *                         to Nametag properties)
     */
    function Plugin(context, options) {

        this.context = context;
        this.options = options;

        this.onNewEntity = this.onNewEntity.bind(this);
        context.bind('add.entity', this.onNewEntity);

        // Also load for all existing actors
        var i = context.renderableEntities.length;
        while (i--) {
            this.onNewEntity(context.renderableEntities[i]);
        }
    }

    /**
     * Create and attach a new Nametag entity to new Actors. 
     *
     * @param {Entity} entity that has been added to the world
     */
    Plugin.prototype.onNewEntity = function(entity) {

        if (entity instanceof Actor) {
            var nametag = new Nametag(this.context, this.options);

            this.context.add(nametag);

            // Connect the nametag as a child of the actor
            entity.addChild(nametag);
        }
    };

    // Register Nametag entity
    fro.entities.Nametag = Nametag;

    // Register plugin
    fro.plugins.Nametag = Plugin;
    return Plugin;
});
