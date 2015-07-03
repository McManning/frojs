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
    'resource/Image'
], function(Util, Image) {

    // Create an internal worker canvas used to render text to textures
    var workerCanvas = document.createElement('canvas');
    //document.querySelector('body').appendChild(workerCanvas);
    
    function FontImage(context, properties) {
        Image.call(this, context, properties);

        // TODO: Image tries to load an image source if properties.url.
        // Maybe stop that from being defined?

        this.fitToTexture = false; 
        this.text = properties.text || '';
        this.width = 0;
        this.height = 0;
        this.maxWidth = properties.maxWidth || 0;
        this.fontHeight = properties.fontHeight || 16;
        this.fontFamily = properties.fontFamily || '"Helvetica Neue", Helvetica, Arial, sans-serif';
        this.fontColor = properties.fontColor || 'rgb(0,0,0)';

        this.generateFontTexture();
        
        this.buildVertexBuffer();
        this.buildTextureBuffer();
    }

    FontImage.prototype = Object.create(Image.prototype);
    FontImage.prototype.constructor = FontImage;

    FontImage.prototype.generateFontTexture = function() {

        var ctx = workerCanvas.getContext('2d');
        var text = this.text;
        
        if (this.text.length < 1) {
            throw new Error('No text');
        }
        
        ctx.font = this.fontHeight + 'px ' + this.fontFamily;

        var w, h, textX, textY;
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

        h = this.fontHeight * textLines.length;

        if (w < 1 || h < 1) {
            throw new Error('Invalid canvas dimensions ' + w + 'x' + h);
        }
        
        workerCanvas.width = w;
        workerCanvas.height = h;

        // Clear canvas
        ctx.clearRect(0, 0, w, h);

        // Render text
        textX = w / 2;
        textY = 0; //h / 2;

        ctx.fillStyle = this.fontColor;
        ctx.textAlign = 'center';
        
        ctx.textBaseline = 'top'; // top/middle/bottom
        ctx.font = this.fontHeight + 'px ' + this.fontFamily;
        
        // draw lines
        for (var i = 0; i < textLines.length; i++) {

            textY = i * this.fontHeight;
            ctx.fillText(textLines[i], textX, textY);
        }

        // Convert canvas context to a texture
        this.texture = this.context.renderer.createTexture(workerCanvas);
        this.width = workerCanvas.width;
        this.height = workerCanvas.height;
    };

    FontImage.prototype.getTextureWidth = function() {
        return this.width;
    };

    FontImage.prototype.getTextureHeight = function() {
        return this.height;
    };

    FontImage.prototype.isLoaded = function() {
        return true;
    };

    return FontImage;
});
