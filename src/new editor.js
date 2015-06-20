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

/*

    New editor layer.
    
    Rather than a separate PropEditor tool, let's layer one on top of the World itself.
    
    It'll be an extension class that we can initialise over everything else. 
    
    First, we need a prop picker to select something...
    We'd also need a prop list, with a visibility toggle for each one..
    Possibly also prop groups, but.. ehhhhh. Fuck. (could just be metadata in the json per-prop instance)
    
    Props are based on a template->instance sort of interface. So we need to work with that. 
    
    Let's start with a visiblity toggler tool.
*/

function generateEntityPicker() {
    
    var html = '';

    // Generate list of editable entities on the map
    for (var i in fro.world._renderableEntities) {
        var entity = fro.world._renderableEntities[i];
        if (entity instanceof Map_Prop) {
            
            html += 
            '<div class="btn-group">'
                + '<a class="btn btn-inverse btn-small" href="javascript:editEntity(\'' + entity.id + '\');" >' + entity.id + '</a>'
                + '<a class="btn btn-inverse dropdown-toggle btn-small" data-toggle="dropdown" href="#"><span class="caret"></span></a>'
                + '<ul class="dropdown-menu">'
                    + '<li><a href="javascript:editEntity(\'' + entity.id + '\');" ><i class="icon-edit"></i> Edit</a></li>'
                    + '<li><a href="javascript:cloneEntity(\'' + entity.id + '\');" ><i class="icon-copy"></i> Clone</a></li>'
                    + '<li><a href="javascript:copyAsNewTemplate(\'' + entity.id + '\');" ><i class="icon-copy"></i> Copy Template</a></li>'
                    + '<li class="divider"></li>'
                    + '<li><a href="javascript:removeEntity(\'' + entity.id + '\');" ><i class="icon-remove"></i> Delete</a></li>'
                + '</ul>'
                + '<input type="checkbox" onclick="javascript:toggleVisibleEntity(\'' + entity.id + '\')" ' 
                + ((entity.visible == 1) ? 'checked="checked"' : '') + ' />'
            + '</div>';

        } else if (entity instanceof Map_Player) {
        
            html += 
            '<div class="btn-group">'
                + '<a class="btn btn-info btn-small" href="#">My Avatar</a>'
                + '<a class="btn btn-info dropdown-toggle btn-small" data-toggle="dropdown" href="#"><span class="caret"></span></a>'
                + '<ul class="dropdown-menu">'
                    + '<li><a href="javascript:????(\'' + entity.id + '\');" ><i class="icon-edit"></i> Toggle Collision?</a></li>'
                + '</ul>'
                + '<input type="checkbox" onclick="javascript:toggleVisibleEntity(\'' + entity.id + '\')" ' 
                + ((entity.visible == 1) ? 'checked="checked"' : '') + ' />'
            + '</div>';
        
        } else {
            // unhandled type. Eventually there will be lights & such here. 
        }
    }

    return html;
}

function editEntity(id) {
    // focus camera on this entity
    // enter edit mode 
}

function cloneEntity(id) {
    // create a copy of the entity, spawn near the origin and set as the focus.
    
    
}

function copyAsNewTemplate(id) {
    // create a copy of this entity, but don't use the same template. Instead,
    // create a new template (with the same properties) and use that.
}

function removeEntity(id) {
    
    var entity = fro.world.findEntity(id);
    
    fro.world.removeEntity(entity);
}

function toggleVisibleEntity(id) {

    // @todo Method does not exist. WE have a getEntity that uses eid, and 
    // props don't have EIDs.
    var entity = fro.world.findEntity(id);
    
    entity.visible = !entity.visible;
}

function saveEntity() {
    // called after editEntity. Push changes to our entity template to 
    // all others who are using the same thing. (collision, image, etc)
}





