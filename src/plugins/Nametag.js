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
    'entity/Entity',
    'entity/Actor',
    'resource/FontImage'
], function(Entity, Actor, FontImage) {

    var NICKNAME_ZORDER = 998; // TODO: global UI_ZORDER
    
    /**
     * New entity type that is just an Actor's nickname
     * floating overhead, and attached to some parent Actor.
     */
    function Nametag(context, properties) {
        Entity.call(this, context, properties);
        
        this.isRenderable = true; // Add this entity to the render queue

        this.fontFamily = properties.fontFamily || 'sans-serif';
        this.fontColor = properties.fontColor || '#000000';
        this.fontHeight = properties.fontHeight || 14;

        // Move our Z-order up to the UI layer
        this.position[2] = NICKNAME_ZORDER;
        
        this.updateText = this.updateText.bind(this);
        this.updatePosition = this.updatePosition.bind(this);
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
                .bind('move.Nametag, avatar.Nametag', this.updatePosition);

            this.updateText(entity.name);
            this.updatePosition();
        }
    };

    /**
     * Update displayed text to the new parent name.
     */
    Nametag.prototype.updateText = function() {
        
        if (this.parent.name.length < 1) { // No nickname, hide this entity
            this.visible = false;
            
        } else {
            // regenerate a name texture, unmanaged by resources (TODO: manage?)
            this.image = new FontImage(this.context, {
                text: this.parent.name,
                fontFamily: this.fontFamily,
                fontColor: this.fontColor,
                fontHeight: this.fontHeight
            });
        
            this.updatePosition();
        }
    };

    Nametag.prototype.updatePosition = function() {
        this.position[0] = 0;
        this.position[1] = 0;

        // If the parent actor has an avatar, 
        // move the nametag above it. 
        if (this.parent.avatar) {
            this.position[1] = this.parent.avatar.height + 10;
        } else {
            this.position[1] = 0;
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

    function Plugin(context, options) {

        this.context = context;

        this.fontFamily = options.fontFamily;
        this.fontColor = options.fontColor;
        this.fontHeight = options.fontHeight;

        this.onNewEntity = this.onNewEntity.bind(this);
        context.world.bind('add.entity', this.onNewEntity);

        // Also load for all existing actors
        for (var i = 0; i < context.world.renderableEntities.length; i++) {
            this.onNewEntity(context.world.renderableEntities[i]);
        }
    }

    Plugin.prototype.onNewEntity = function(entity) {

        if (entity instanceof Actor) {
            var nametag = new Nametag(this.context, {
                fontFamily: this.fontFamily,
                fontColor: this.fontColor,
                fontHeight: this.fontHeight
            });

            this.context.world.add(nametag);

            // Connect the nametag as a child of the actor
            entity.addChild(nametag);
        }
    };

    return Plugin;
});
