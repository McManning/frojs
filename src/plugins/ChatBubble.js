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
    'Utility',
    'Timer',
    'resource/Image',
    'entity/Entity',
    'entity/Actor'
], function(Util, Timer, Image, Entity, Actor) {

    // Create an internal worker canvas used to render textures
    var workerCanvas = document.createElement('canvas');
    document.querySelector('body').appendChild(workerCanvas);

    var BUBBLE_ZORDER = 999; // TODO: global UI_ZORDER
    
    // Default minimum time to live (in MS) for each bubble entity
    var BUBBLE_MIN_TTL = 3000;
    
    /**
     * New entity type that is just a message in a bubble
     * floating overhead some parent Actor.
     */
    function ChatBubble(context, properties) {
        Entity.call(this, context, properties);
        
        this.isRenderable = true; // Add this entity to the render queue

        this.text = properties.text;
        this.ttl = properties.ttl || 
            (BUBBLE_MIN_TTL * Math.ceil(this.text.length / 50));
        this.fontFamily = properties.fontFamily || 'sans-serif';
        this.fontColor = properties.fontColor || '#000000';
        this.fontSize = properties.fontSize || 14;
        this.maxWidth = properties.maxWidth || 256;
        this.minWidth = properties.minWidth || 25;
        this.padding = properties.padding || 7;
        this.radius = properties.radius || 8;
        this.backgroundColor1 = properties.backgroundColor1 || '#DDD';
        this.backgroundColor2 = properties.backgroundColor2 || '#FFF';
        this.strokeWidth = properties.strokeWidth || 1.5;
        this.strokeColor1 = properties.strokeColor1 || '#333';
        this.strokeColor2 = properties.strokecolor2 || '#333';

        // Move our Z-order up to the UI layer
        this.position[2] = BUBBLE_ZORDER;
        
        this.updatePosition = this.updatePosition.bind(this);

        // Create the actual bubble texture
        this.generateTexture();

        // Add a timeout to auto-destroy this entity once we reach TTL
        this.destroy = this.destroy.bind(this);

        this.destroyTimer = new Timer(this.destroy, this.ttl);
        this.destroyTimer.start();
    }

    ChatBubble.prototype = Object.create(Entity.prototype);
    ChatBubble.prototype.constructor = ChatBubble;

    ChatBubble.prototype.destroy = function() {
        if (this.destroyTimer) {
            this.destroyTimer.stop();
        }

        Entity.prototype.destroy.call(this);
    };

    ChatBubble.prototype.generateTexture = function() {
        
        var ctx = workerCanvas.getContext('2d');
        var text = this.text;
        
        if (text.length < 1) {
            throw new Error('No text');
        }
        
        ctx.font = this.fontSize + 'px ' + this.fontFamily;

        var w, h, textY;
        var textLines = [];
        
        // If we're wider than max width, calculate a wrap
        if (this.maxWidth && ctx.measureText(text).width > this.maxWidth) {
            w = Util.createMultilineText(ctx, text, this.maxWidth, textLines);
            
            if (w > this.maxWidth) {
                w = this.maxWidth;
            }
        } else {
            textLines.push(text);
            w = Math.ceil(ctx.measureText(text).width);
        }

        h = this.fontSize * textLines.length;

        // Add in padding for the bubble
        if (this.padding) {
            h += this.padding * 2;
            w += this.padding * 2;
        }

        var arrowHeight = this.fontSize / 2;
        
        h += arrowHeight;
        
        this.width = workerCanvas.width = w;
        this.height = workerCanvas.height = h;

        // Clear canvas
        ctx.clearRect(0, 0, w, h);


        //Padding for stroke dimensions
        w -= this.strokeWidth * 2;
        h -= this.strokeWidth * 2 + arrowHeight;

        var x = this.strokeWidth;
        var y = x;
        var r = x + w;
        var b = y + h;
        var m = x + w / 2;
        
        var radius = this.radius;
        
        // If we haven't specified a gradient, use a solid stroke color
        if (this.strokeColor1 === this.strokeColor2) {
        
            ctx.strokeStyle = this.strokeColor1;
            
        } else { // Render a linear gradient for the stroke
            
            // Set stroke style to a gradient
            var stGrd = ctx.createLinearGradient(0, 0, 0, h);
            stGrd.addColorStop(0, this.strokeColor1);
            stGrd.addColorStop(1, this.strokeColor2);
            
            ctx.strokeStyle = stGrd;
        }

        
        // Render a polygon via paths
        ctx.beginPath();

        ctx.lineWidth = this.strokeWidth;
        
        ctx.moveTo(x+radius, y); // top left top curve
        
        ctx.lineTo(r-radius, y); // top right top curve
        ctx.quadraticCurveTo(r, y, r, y+radius); // top right bottom curve
        ctx.lineTo(r, y+h-radius); // bottom right top curve
        ctx.quadraticCurveTo(r, b, r-radius, b); // bottom right bottom curve
        
        // Bottom arrow point
        ctx.lineTo(m - 4, b); // start point 
        ctx.lineTo(m - 4, b + arrowHeight); // part that sticks out
        ctx.lineTo(Math.max(x+radius, m - 20), b); // reconnecting point to the bubble bottom
        
        ctx.lineTo(x+radius, b); // bottom left bottom curve
        ctx.quadraticCurveTo(x, b, x, b-radius); // bottom left top curve
        ctx.lineTo(x, y+radius); // top left bottom curve
        ctx.quadraticCurveTo(x, y, x+radius, y); // top left top curve
        
        // If we haven't specified a gradient, use a solid background color
        if (this.backgroundColor1 === this.backgroundColor2) {
        
            ctx.fillStyle = this.backgroundColor1;
            
        } else { // Render a linear gradient for the background
            
            var bgGrd = ctx.createLinearGradient(0, 0, 0, h);
            bgGrd.addColorStop(0,this.backgroundColor1);
            bgGrd.addColorStop(1,this.backgroundColor2);
            
            ctx.fillStyle = bgGrd;
        }
        
        ctx.fill();
        ctx.stroke(); // draw

        // Render text
        ctx.fillStyle = this.fontColor;
        ctx.textAlign = 'center';
        
        ctx.textBaseline = 'middle'; // top/middle/bottom
        ctx.font = this.fontSize + 'px ' + this.fontFamily;
        
        var textTopPadding = this.padding + this.fontSize / 2;
        
        // draw lines
        for (var i = 0; i < textLines.length; i++) {
        
            textY = i * this.fontSize + textTopPadding;
            ctx.fillText(textLines[i], m, textY);
        }

        // Load a new image resource from the canvas
        this.image = new Image(this.context, {
            type: 'image',
            canvas: workerCanvas,
            width: this.width,
            height: this.height
        });
    };

    /**
     * Override to bind parent update events to also update this ChatBubble.
     *
     * @param {Entity} entity
     */
    ChatBubble.prototype.setParent = function(entity) {
        Entity.prototype.setParent.call(this, entity);

        if (entity) {
            entity.bind(
                'move.ChatBubble, avatar.ChatBubble', 
                this.updatePosition
            );

            this.updatePosition();
        }
    };

    /**
     * Update position to remain overhead the parent. This may be 
     * called when the parent's avatar changes dimensions. 
     */
    ChatBubble.prototype.updatePosition = function() {
        this.position[0] = 0;
        this.position[1] = 0;

        this.offset[1] = this.height * 0.5;

        // If the parent actor has an avatar, 
        // move the ChatBubble above it. 
        if (this.parent && this.parent.avatar) {
            this.position[1] = this.parent.avatar.height + 10;
        } else {
            this.position[1] = 0;
        }

        this.updateTranslation();
    };

    ChatBubble.prototype.render = function() {

        this.image.render(this.translation, 0.0);
    };

    /**
     * @param {rect} r
     */
    ChatBubble.prototype.getBoundingBox = function(r) {

        // TODO: factor in rotations and scaling
        // and utilize this.renderable.getTopLeft(), getBottomRight(), etc
        
        // TODO: this is incorrect. We center the (x, y)
        r[0] = this.position[0];
        r[1] = this.position[1];
        r[2] = this.image.width;
        r[3] = this.image.height;
    };

    function Plugin(context, options) {
        // jshint unused: false

        this.context = context;
        this.options = options;

        this.onNewEntity = this.onNewEntity.bind(this);
        this.onSay = this.onSay.bind(this);

        context.world.bind('add.entity', this.onNewEntity);

        // Also load for all existing actors
        for (var i = 0; i < context.world.renderableEntities.length; i++) {
            this.onNewEntity(context.world.renderableEntities[i]);
        }
    }

    Plugin.prototype.onNewEntity = function(entity) {

        if (entity instanceof Actor) {
            entity.bind('say', this.onSay);
        }
    };

    Plugin.prototype.onSay = function(data) {

        var properties = {
            text: data.message
        };

        // Extend with default bubble properties, if known
        Util.extend(properties, this.options);

        var bubble = new ChatBubble(this.context, properties);
        this.context.world.add(bubble);

        // Destroy any previous bubble created by the actor
        var i = data.entity.children.length;
        while (i--) {
            if (data.entity.children[i] instanceof ChatBubble) {
                data.entity.children[i].destroy();
            }
        }

        // Connect the bubble as a child of the actor
        data.entity.addChild(bubble);
    };

    return Plugin;
});
