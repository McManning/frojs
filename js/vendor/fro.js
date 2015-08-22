(function () {/*!
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
define('EventHooks',[], function() {

    /**
     * A basic extension to bind event listeners to objects
     */
    return {
        bind: function(evt, obj, fn) {

            if (obj === null && fn === null) { // (evt)
                return this;
            } else if (typeof obj === 'function') { // (evt, fn)
                fn = obj;
                obj = this;
            } // otherwise, (evt, obj, fn)
            
            var namespaces = '';
            
            // Split multiple event bindings into multiple triggers
            var events = evt.split(',');
            
            for (var i = 0; i < events.length; i++) {
                
                // Clean up each bind
                evt = events[i].trim();

                // Check if the bind is namespaced
                if (evt.indexOf('.') >= 0) {
                    namespaces = evt.split('.');
                    evt = namespaces.shift();
                    namespaces.sort();
                    namespaces = namespaces.join('.');
                }
                
                if (typeof this._events === 'undefined') {
                    this._events = {};
                    this._events[evt] = [];
                    
                } else if (!(evt in this._events)) {
                    this._events[evt] = [];
                }
                
                this._events[evt].push({
                    callback: fn,
                    obj: obj,
                    namespaces: namespaces,
                });
            }
            
            return this;
        },
        
        unbind: function(evt, fn) {
            
            // TODO: Refactor all of this actual logic, it's outdated.

            var len;

            // @todo also allow (obj), (evt, obj) calls
            if (fn === null) { 
                if (typeof evt === 'function') { // (fn)
                    fn = evt;
                    evt = undefined;
                } else if (evt === null) { // ()
                    evt = undefined;
                    fn = undefined;
                } else { // (evt)
                    fn = undefined;
                }
            }
            
            if (typeof evt !== 'undefined') {
                
                if (evt in this._events) {
                    if (typeof fn !== 'undefined') {
                        // Remove a specific function reference for this event

                        len = this._events[evt].length;
                        while (len--) {
                            if (this._events[evt][len] === fn) {
                                this._events[evt].splice(len, 1);
                            }
                        }
                        
                    } else { 
                        // Remove all binds for this event
                        delete this._events[evt];
                    }
                }
                
            } else {
                
                if (typeof fn !== 'undefined') {

                    // Remove a specific function from all events
                    for (var e in this._events) {
                        if (this._events.hasOwnProperty(e)) {
                            len = this._events[e].length;
                            // TODO: wrong. Nice splice during an forin. :/
                            while (len--) {
                                if (this._events[e][len] === fn) {
                                    this._events[e].splice(len, 1);
                                }
                            }
                        }
                    }
                } else {
                    // Remove all binds
                    this._events = {};
                }
            }
            
            return this;
        },
        
        fire: function(evt, data) {
        
            var namespaces_re = null;
            
            if (~evt.indexOf('.')) {
                var namespaces = evt.split('.');
                evt = namespaces.shift();
                
                if (namespaces.length > 0) {
                    namespaces.sort();
                    namespaces_re = new RegExp( "(^|\\.)" +
                                    namespaces.join("\\.(?:.*\\.|)") +
                                    "(\\.|$)" );
                }
            }
            
            if (typeof this._events === 'undefined' || !(evt in this._events)) {
                return;
            }

            for (var e = 0; e < this._events[evt].length; e++) {
                var fn = this._events[evt][e];
                
                if (!namespaces_re || namespaces_re.test( fn.namespaces )) {
                    try {
                        fn.callback.apply( fn.obj, [data] );
                    } catch (exception) {
                        throw new Error('Exception during event [' + evt + ']: ' + exception.stack);
                    }
                }
            }
        }

    };

});

/* 
 * glMatrix.js - High performance matrix and vector operations for WebGL
 * version 0.9.6
 */
 
/*
 * Copyright (c) 2011 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

define('glMatrix',[], function() {

// Fallback for systems that don't support WebGL
if (typeof window.Float32Array !== 'undefined') {
	window.window.glMatrixArrayType = window.Float32Array;
} else if (typeof window.WebGLFloatArray !== 'undefined') {
	window.window.glMatrixArrayType = window.WebGLFloatArray; // This is officially deprecated and should dissapear in future revisions.
} else {
	window.window.glMatrixArrayType = Array;
}

/*
 * rect - 2D rectangle
 */
var rect = {};

rect.create = function(r) {
	var dest = new window.glMatrixArrayType(4);
	
	if (r) {
		dest[0] = r[0];
		dest[1] = r[1];
		dest[2] = r[2];
		dest[3] = r[3];
	}
	
	return dest;
}

rect.set = function(r, dest) {
	dest[0] = r[0];
	dest[1] = r[1];
	dest[2] = r[2];
	dest[3] = r[3];
	
	return dest;
};

rect.str = function(r) {
	return '[' + r[0] + ', ' + r[1] + ', ' + r[2] + ', ' + r[3] + ']'; 
};

rect.x2 = function(r) {
	return r[0] + r[2];
}

rect.y2 = function(r) {
	return r[1] + r[3];
}

rect.intersects = function(a, b) {
	return !( b[0] > a[0]+a[2]
	        || b[0]+b[2] < a[0]
	        || b[1] > a[1]+a[3]
	        || b[1]+b[3] < a[1]
	        );
}

/*
 * Returns:
 * dest if specified, a will be written to otherwise
 */
rect.intersection = function(a, b, dest) {
	if (!dest) { dest = a; }
	
	var x, y;
	x = Math.max(a[0], b[0]);
	y = Math.max(a[1], b[1]);
	dest[2] = Math.min(a[0]+a[2], b[0]+b[2]) - x;
	dest[3] = Math.min(a[1]+a[3], b[1]+b[3]) - y;
	
	return dest;
}

/*
 * vec3 - 3 Dimensional Vector
 */
var vec3 = {};

/*
 * vec3.create
 * Creates a new instance of a vec3 using the default array type
 * Any javascript array containing at least 3 numeric elements can serve as a vec3
 *
 * Params:
 * vec - Optional, vec3 containing values to initialize with
 *
 * Returns:
 * New vec3
 */
vec3.create = function(vec) {
	var dest = new window.glMatrixArrayType(3);
	
	if(vec) {
		dest[0] = vec[0];
		dest[1] = vec[1];
		dest[2] = vec[2];
	}
	
	return dest;
};

/*
 * vec3.set
 * Copies the values of one vec3 to another
 *
 * Params:
 * vec - vec3 containing values to copy
 * dest - vec3 receiving copied values
 *
 * Returns:
 * dest
 */
vec3.set = function(vec, dest) {
	dest[0] = vec[0];
	dest[1] = vec[1];
	dest[2] = vec[2];
	
	return dest;
};

vec3.equals = function(vec, vec2) {
	
	return vec[0] == vec2[0] 
		&& vec[1] == vec2[1] 
		&& vec[2] == vec2[2];
}

/*
 * vec3.add
 * Performs a vector addition
 *
 * Params:
 * vec - vec3, first operand
 * vec2 - vec3, second operand
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.add = function(vec, vec2, dest) {
	if(!dest || vec == dest) {
		vec[0] += vec2[0];
		vec[1] += vec2[1];
		vec[2] += vec2[2];
		return vec;
	}
	
	dest[0] = vec[0] + vec2[0];
	dest[1] = vec[1] + vec2[1];
	dest[2] = vec[2] + vec2[2];
	return dest;
};

/*
 * vec3.subtract
 * Performs a vector subtraction
 *
 * Params:
 * vec - vec3, first operand
 * vec2 - vec3, second operand
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.subtract = function(vec, vec2, dest) {
	if(!dest || vec == dest) {
		vec[0] -= vec2[0];
		vec[1] -= vec2[1];
		vec[2] -= vec2[2];
		return vec;
	}
	
	dest[0] = vec[0] - vec2[0];
	dest[1] = vec[1] - vec2[1];
	dest[2] = vec[2] - vec2[2];
	return dest;
};

/*
 * vec3.negate
 * Negates the components of a vec3
 *
 * Params:
 * vec - vec3 to negate
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.negate = function(vec, dest) {
	if(!dest) { dest = vec; }
	
	dest[0] = -vec[0];
	dest[1] = -vec[1];
	dest[2] = -vec[2];
	return dest;
};

/*
 * vec3.scale
 * Multiplies the components of a vec3 by a scalar value
 *
 * Params:
 * vec - vec3 to scale
 * val - Numeric value to scale by
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.scale = function(vec, val, dest) {
	if(!dest || vec == dest) {
		vec[0] *= val;
		vec[1] *= val;
		vec[2] *= val;
		return vec;
	}
	
	dest[0] = vec[0]*val;
	dest[1] = vec[1]*val;
	dest[2] = vec[2]*val;
	return dest;
};

/*
 * vec3.normalize
 * Generates a unit vector of the same direction as the provided vec3
 * If vector length is 0, returns [0, 0, 0]
 *
 * Params:
 * vec - vec3 to normalize
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.normalize = function(vec, dest) {
	if(!dest) { dest = vec; }
	
	var x = vec[0], y = vec[1], z = vec[2];
	var len = Math.sqrt(x*x + y*y + z*z);
	
	if (!len) {
		dest[0] = 0;
		dest[1] = 0;
		dest[2] = 0;
		return dest;
	} else if (len == 1) {
		dest[0] = x;
		dest[1] = y;
		dest[2] = z;
		return dest;
	}
	
	len = 1 / len;
	dest[0] = x*len;
	dest[1] = y*len;
	dest[2] = z*len;
	return dest;
};

/*
 * vec3.cross
 * Generates the cross product of two vec3s
 *
 * Params:
 * vec - vec3, first operand
 * vec2 - vec3, second operand
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.cross = function(vec, vec2, dest){
	if(!dest) { dest = vec; }
	
	var x = vec[0], y = vec[1], z = vec[2];
	var x2 = vec2[0], y2 = vec2[1], z2 = vec2[2];
	
	dest[0] = y*z2 - z*y2;
	dest[1] = z*x2 - x*z2;
	dest[2] = x*y2 - y*x2;
	return dest;
};

/*
 * vec3.length
 * Caclulates the length of a vec3
 *
 * Params:
 * vec - vec3 to calculate length of
 *
 * Returns:
 * Length of vec
 */
vec3.length = function(vec){
	var x = vec[0], y = vec[1], z = vec[2];
	return Math.sqrt(x*x + y*y + z*z);
};

/*
 * vec3.dot
 * Caclulates the dot product of two vec3s
 *
 * Params:
 * vec - vec3, first operand
 * vec2 - vec3, second operand
 *
 * Returns:
 * Dot product of vec and vec2
 */
vec3.dot = function(vec, vec2){
	return vec[0]*vec2[0] + vec[1]*vec2[1] + vec[2]*vec2[2];
};

/*
 * vec3.direction
 * Generates a unit vector pointing from one vector to another
 *
 * Params:
 * vec - origin vec3
 * vec2 - vec3 to point to
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.direction = function(vec, vec2, dest) {
	if(!dest) { dest = vec; }
	
	var x = vec[0] - vec2[0];
	var y = vec[1] - vec2[1];
	var z = vec[2] - vec2[2];
	
	var len = Math.sqrt(x*x + y*y + z*z);
	if (!len) { 
		dest[0] = 0; 
		dest[1] = 0; 
		dest[2] = 0;
		return dest; 
	}
	
	len = 1 / len;
	dest[0] = x * len; 
	dest[1] = y * len; 
	dest[2] = z * len;
	return dest; 
};

/*
 * vec3.lerp
 * Performs a linear interpolation between two vec3
 *
 * Params:
 * vec - vec3, first vector
 * vec2 - vec3, second vector
 * lerp - interpolation amount between the two inputs
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.lerp = function(vec, vec2, lerp, dest){
    if(!dest) { dest = vec; }
    
    dest[0] = vec[0] + lerp * (vec2[0] - vec[0]);
    dest[1] = vec[1] + lerp * (vec2[1] - vec[1]);
    dest[2] = vec[2] + lerp * (vec2[2] - vec[2]);
    
    return dest;
}

/*
 * vec3.str
 * Returns a string representation of a vector
 *
 * Params:
 * vec - vec3 to represent as a string
 *
 * Returns:
 * string representation of vec
 */
vec3.str = function(vec) {
	return '[' + vec[0] + ', ' + vec[1] + ', ' + vec[2] + ']'; 
};

/*
 * mat3 - 3x3 Matrix
 */
var mat3 = {};

/*
 * mat3.create
 * Creates a new instance of a mat3 using the default array type
 * Any javascript array containing at least 9 numeric elements can serve as a mat3
 *
 * Params:
 * mat - Optional, mat3 containing values to initialize with
 *
 * Returns:
 * New mat3
 */
mat3.create = function(mat) {
	var dest = new window.glMatrixArrayType(9);
	
	if(mat) {
		dest[0] = mat[0];
		dest[1] = mat[1];
		dest[2] = mat[2];
		dest[3] = mat[3];
		dest[4] = mat[4];
		dest[5] = mat[5];
		dest[6] = mat[6];
		dest[7] = mat[7];
		dest[8] = mat[8];
	}
	
	return dest;
};

/*
 * mat3.set
 * Copies the values of one mat3 to another
 *
 * Params:
 * mat - mat3 containing values to copy
 * dest - mat3 receiving copied values
 *
 * Returns:
 * dest
 */
mat3.set = function(mat, dest) {
	dest[0] = mat[0];
	dest[1] = mat[1];
	dest[2] = mat[2];
	dest[3] = mat[3];
	dest[4] = mat[4];
	dest[5] = mat[5];
	dest[6] = mat[6];
	dest[7] = mat[7];
	dest[8] = mat[8];
	return dest;
};

/*
 * mat3.identity
 * Sets a mat3 to an identity matrix
 *
 * Params:
 * dest - mat3 to set
 *
 * Returns:
 * dest
 */
mat3.identity = function(dest) {
	dest[0] = 1;
	dest[1] = 0;
	dest[2] = 0;
	dest[3] = 0;
	dest[4] = 1;
	dest[5] = 0;
	dest[6] = 0;
	dest[7] = 0;
	dest[8] = 1;
	return dest;
};

/*
 * mat4.transpose
 * Transposes a mat3 (flips the values over the diagonal)
 *
 * Params:
 * mat - mat3 to transpose
 * dest - Optional, mat3 receiving transposed values. If not specified result is written to mat
 *
 * Returns:
 * dest is specified, mat otherwise
 */
mat3.transpose = function(mat, dest) {
	// If we are transposing ourselves we can skip a few steps but have to cache some values
	if(!dest || mat == dest) { 
		var a01 = mat[1], a02 = mat[2];
		var a12 = mat[5];
		
        mat[1] = mat[3];
        mat[2] = mat[6];
        mat[3] = a01;
        mat[5] = mat[7];
        mat[6] = a02;
        mat[7] = a12;
		return mat;
	}
	
	dest[0] = mat[0];
	dest[1] = mat[3];
	dest[2] = mat[6];
	dest[3] = mat[1];
	dest[4] = mat[4];
	dest[5] = mat[7];
	dest[6] = mat[2];
	dest[7] = mat[5];
	dest[8] = mat[8];
	return dest;
};

/*
 * mat3.toMat4
 * Copies the elements of a mat3 into the upper 3x3 elements of a mat4
 *
 * Params:
 * mat - mat3 containing values to copy
 * dest - Optional, mat4 receiving copied values
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
mat3.toMat4 = function(mat, dest) {
	if(!dest) { dest = mat4.create(); }
	
	dest[0] = mat[0];
	dest[1] = mat[1];
	dest[2] = mat[2];
	dest[3] = 0;

	dest[4] = mat[3];
	dest[5] = mat[4];
	dest[6] = mat[5];
	dest[7] = 0;

	dest[8] = mat[6];
	dest[9] = mat[7];
	dest[10] = mat[8];
	dest[11] = 0;

	dest[12] = 0;
	dest[13] = 0;
	dest[14] = 0;
	dest[15] = 1;
	
	return dest;
}

/*
 * mat3.str
 * Returns a string representation of a mat3
 *
 * Params:
 * mat - mat3 to represent as a string
 *
 * Returns:
 * string representation of mat
 */
mat3.str = function(mat) {
	return '[' + mat[0] + ', ' + mat[1] + ', ' + mat[2] + 
		', ' + mat[3] + ', '+ mat[4] + ', ' + mat[5] + 
		', ' + mat[6] + ', ' + mat[7] + ', '+ mat[8] + ']';
};

/*
 * mat4 - 4x4 Matrix
 */
var mat4 = {};

/*
 * mat4.create
 * Creates a new instance of a mat4 using the default array type
 * Any javascript array containing at least 16 numeric elements can serve as a mat4
 *
 * Params:
 * mat - Optional, mat4 containing values to initialize with
 *
 * Returns:
 * New mat4
 */
mat4.create = function(mat) {
	var dest = new window.glMatrixArrayType(16);
	
	if(mat) {
		dest[0] = mat[0];
		dest[1] = mat[1];
		dest[2] = mat[2];
		dest[3] = mat[3];
		dest[4] = mat[4];
		dest[5] = mat[5];
		dest[6] = mat[6];
		dest[7] = mat[7];
		dest[8] = mat[8];
		dest[9] = mat[9];
		dest[10] = mat[10];
		dest[11] = mat[11];
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
	}
	
	return dest;
};

/*
 * mat4.set
 * Copies the values of one mat4 to another
 *
 * Params:
 * mat - mat4 containing values to copy
 * dest - mat4 receiving copied values
 *
 * Returns:
 * dest
 */
mat4.set = function(mat, dest) {
	dest[0] = mat[0];
	dest[1] = mat[1];
	dest[2] = mat[2];
	dest[3] = mat[3];
	dest[4] = mat[4];
	dest[5] = mat[5];
	dest[6] = mat[6];
	dest[7] = mat[7];
	dest[8] = mat[8];
	dest[9] = mat[9];
	dest[10] = mat[10];
	dest[11] = mat[11];
	dest[12] = mat[12];
	dest[13] = mat[13];
	dest[14] = mat[14];
	dest[15] = mat[15];
	return dest;
};

/*
 * mat4.identity
 * Sets a mat4 to an identity matrix
 *
 * Params:
 * dest - mat4 to set
 *
 * Returns:
 * dest
 */
mat4.identity = function(dest) {
	dest[0] = 1;
	dest[1] = 0;
	dest[2] = 0;
	dest[3] = 0;
	dest[4] = 0;
	dest[5] = 1;
	dest[6] = 0;
	dest[7] = 0;
	dest[8] = 0;
	dest[9] = 0;
	dest[10] = 1;
	dest[11] = 0;
	dest[12] = 0;
	dest[13] = 0;
	dest[14] = 0;
	dest[15] = 1;
	return dest;
};

/*
 * mat4.transpose
 * Transposes a mat4 (flips the values over the diagonal)
 *
 * Params:
 * mat - mat4 to transpose
 * dest - Optional, mat4 receiving transposed values. If not specified result is written to mat
 *
 * Returns:
 * dest is specified, mat otherwise
 */
mat4.transpose = function(mat, dest) {
	// If we are transposing ourselves we can skip a few steps but have to cache some values
	if(!dest || mat == dest) { 
		var a01 = mat[1], a02 = mat[2], a03 = mat[3];
		var a12 = mat[6], a13 = mat[7];
		var a23 = mat[11];
		
		mat[1] = mat[4];
		mat[2] = mat[8];
		mat[3] = mat[12];
		mat[4] = a01;
		mat[6] = mat[9];
		mat[7] = mat[13];
		mat[8] = a02;
		mat[9] = a12;
		mat[11] = mat[14];
		mat[12] = a03;
		mat[13] = a13;
		mat[14] = a23;
		return mat;
	}
	
	dest[0] = mat[0];
	dest[1] = mat[4];
	dest[2] = mat[8];
	dest[3] = mat[12];
	dest[4] = mat[1];
	dest[5] = mat[5];
	dest[6] = mat[9];
	dest[7] = mat[13];
	dest[8] = mat[2];
	dest[9] = mat[6];
	dest[10] = mat[10];
	dest[11] = mat[14];
	dest[12] = mat[3];
	dest[13] = mat[7];
	dest[14] = mat[11];
	dest[15] = mat[15];
	return dest;
};

/*
 * mat4.determinant
 * Calculates the determinant of a mat4
 *
 * Params:
 * mat - mat4 to calculate determinant of
 *
 * Returns:
 * determinant of mat
 */
mat4.determinant = function(mat) {
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];

	return	a30*a21*a12*a03 - a20*a31*a12*a03 - a30*a11*a22*a03 + a10*a31*a22*a03 +
			a20*a11*a32*a03 - a10*a21*a32*a03 - a30*a21*a02*a13 + a20*a31*a02*a13 +
			a30*a01*a22*a13 - a00*a31*a22*a13 - a20*a01*a32*a13 + a00*a21*a32*a13 +
			a30*a11*a02*a23 - a10*a31*a02*a23 - a30*a01*a12*a23 + a00*a31*a12*a23 +
			a10*a01*a32*a23 - a00*a11*a32*a23 - a20*a11*a02*a33 + a10*a21*a02*a33 +
			a20*a01*a12*a33 - a00*a21*a12*a33 - a10*a01*a22*a33 + a00*a11*a22*a33;
};

/*
 * mat4.inverse
 * Calculates the inverse matrix of a mat4
 *
 * Params:
 * mat - mat4 to calculate inverse of
 * dest - Optional, mat4 receiving inverse matrix. If not specified result is written to mat
 *
 * Returns:
 * dest is specified, mat otherwise
 */
mat4.inverse = function(mat, dest) {
	if(!dest) { dest = mat; }
	
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];
	
	var b00 = a00*a11 - a01*a10;
	var b01 = a00*a12 - a02*a10;
	var b02 = a00*a13 - a03*a10;
	var b03 = a01*a12 - a02*a11;
	var b04 = a01*a13 - a03*a11;
	var b05 = a02*a13 - a03*a12;
	var b06 = a20*a31 - a21*a30;
	var b07 = a20*a32 - a22*a30;
	var b08 = a20*a33 - a23*a30;
	var b09 = a21*a32 - a22*a31;
	var b10 = a21*a33 - a23*a31;
	var b11 = a22*a33 - a23*a32;
	
	// Calculate the determinant (inlined to avoid double-caching)
	var invDet = 1/(b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06);
	
	dest[0] = (a11*b11 - a12*b10 + a13*b09)*invDet;
	dest[1] = (-a01*b11 + a02*b10 - a03*b09)*invDet;
	dest[2] = (a31*b05 - a32*b04 + a33*b03)*invDet;
	dest[3] = (-a21*b05 + a22*b04 - a23*b03)*invDet;
	dest[4] = (-a10*b11 + a12*b08 - a13*b07)*invDet;
	dest[5] = (a00*b11 - a02*b08 + a03*b07)*invDet;
	dest[6] = (-a30*b05 + a32*b02 - a33*b01)*invDet;
	dest[7] = (a20*b05 - a22*b02 + a23*b01)*invDet;
	dest[8] = (a10*b10 - a11*b08 + a13*b06)*invDet;
	dest[9] = (-a00*b10 + a01*b08 - a03*b06)*invDet;
	dest[10] = (a30*b04 - a31*b02 + a33*b00)*invDet;
	dest[11] = (-a20*b04 + a21*b02 - a23*b00)*invDet;
	dest[12] = (-a10*b09 + a11*b07 - a12*b06)*invDet;
	dest[13] = (a00*b09 - a01*b07 + a02*b06)*invDet;
	dest[14] = (-a30*b03 + a31*b01 - a32*b00)*invDet;
	dest[15] = (a20*b03 - a21*b01 + a22*b00)*invDet;
	
	return dest;
};

/*
 * mat4.toRotationMat
 * Copies the upper 3x3 elements of a mat4 into another mat4
 *
 * Params:
 * mat - mat4 containing values to copy
 * dest - Optional, mat4 receiving copied values
 *
 * Returns:
 * dest is specified, a new mat4 otherwise
 */
mat4.toRotationMat = function(mat, dest) {
	if(!dest) { dest = mat4.create(); }
	
	dest[0] = mat[0];
	dest[1] = mat[1];
	dest[2] = mat[2];
	dest[3] = mat[3];
	dest[4] = mat[4];
	dest[5] = mat[5];
	dest[6] = mat[6];
	dest[7] = mat[7];
	dest[8] = mat[8];
	dest[9] = mat[9];
	dest[10] = mat[10];
	dest[11] = mat[11];
	dest[12] = 0;
	dest[13] = 0;
	dest[14] = 0;
	dest[15] = 1;
	
	return dest;
};

/*
 * mat4.toMat3
 * Copies the upper 3x3 elements of a mat4 into a mat3
 *
 * Params:
 * mat - mat4 containing values to copy
 * dest - Optional, mat3 receiving copied values
 *
 * Returns:
 * dest is specified, a new mat3 otherwise
 */
mat4.toMat3 = function(mat, dest) {
	if(!dest) { dest = mat3.create(); }
	
	dest[0] = mat[0];
	dest[1] = mat[1];
	dest[2] = mat[2];
	dest[3] = mat[4];
	dest[4] = mat[5];
	dest[5] = mat[6];
	dest[6] = mat[8];
	dest[7] = mat[9];
	dest[8] = mat[10];
	
	return dest;
};

/*
 * mat4.toInverseMat3
 * Calculates the inverse of the upper 3x3 elements of a mat4 and copies the result into a mat3
 * The resulting matrix is useful for calculating transformed normals
 *
 * Params:
 * mat - mat4 containing values to invert and copy
 * dest - Optional, mat3 receiving values
 *
 * Returns:
 * dest is specified, a new mat3 otherwise
 */
mat4.toInverseMat3 = function(mat, dest) {
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10];
	
	var b01 = a22*a11-a12*a21;
	var b11 = -a22*a10+a12*a20;
	var b21 = a21*a10-a11*a20;
		
	var d = a00*b01 + a01*b11 + a02*b21;
	if (!d) { return null; }
	var id = 1/d;
	
	if(!dest) { dest = mat3.create(); }
	
	dest[0] = b01*id;
	dest[1] = (-a22*a01 + a02*a21)*id;
	dest[2] = (a12*a01 - a02*a11)*id;
	dest[3] = b11*id;
	dest[4] = (a22*a00 - a02*a20)*id;
	dest[5] = (-a12*a00 + a02*a10)*id;
	dest[6] = b21*id;
	dest[7] = (-a21*a00 + a01*a20)*id;
	dest[8] = (a11*a00 - a01*a10)*id;
	
	return dest;
};

/*
 * mat4.multiply
 * Performs a matrix multiplication
 *
 * Params:
 * mat - mat4, first operand
 * mat2 - mat4, second operand
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.multiply = function(mat, mat2, dest) {
	if(!dest) { dest = mat }
	
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];
	
	var b00 = mat2[0], b01 = mat2[1], b02 = mat2[2], b03 = mat2[3];
	var b10 = mat2[4], b11 = mat2[5], b12 = mat2[6], b13 = mat2[7];
	var b20 = mat2[8], b21 = mat2[9], b22 = mat2[10], b23 = mat2[11];
	var b30 = mat2[12], b31 = mat2[13], b32 = mat2[14], b33 = mat2[15];
	
	dest[0] = b00*a00 + b01*a10 + b02*a20 + b03*a30;
	dest[1] = b00*a01 + b01*a11 + b02*a21 + b03*a31;
	dest[2] = b00*a02 + b01*a12 + b02*a22 + b03*a32;
	dest[3] = b00*a03 + b01*a13 + b02*a23 + b03*a33;
	dest[4] = b10*a00 + b11*a10 + b12*a20 + b13*a30;
	dest[5] = b10*a01 + b11*a11 + b12*a21 + b13*a31;
	dest[6] = b10*a02 + b11*a12 + b12*a22 + b13*a32;
	dest[7] = b10*a03 + b11*a13 + b12*a23 + b13*a33;
	dest[8] = b20*a00 + b21*a10 + b22*a20 + b23*a30;
	dest[9] = b20*a01 + b21*a11 + b22*a21 + b23*a31;
	dest[10] = b20*a02 + b21*a12 + b22*a22 + b23*a32;
	dest[11] = b20*a03 + b21*a13 + b22*a23 + b23*a33;
	dest[12] = b30*a00 + b31*a10 + b32*a20 + b33*a30;
	dest[13] = b30*a01 + b31*a11 + b32*a21 + b33*a31;
	dest[14] = b30*a02 + b31*a12 + b32*a22 + b33*a32;
	dest[15] = b30*a03 + b31*a13 + b32*a23 + b33*a33;
	
	return dest;
};

/*
 * mat4.multiplyVec3
 * Transforms a vec3 with the given matrix
 * 4th vector component is implicitly '1'
 *
 * Params:
 * mat - mat4 to transform the vector with
 * vec - vec3 to transform
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
mat4.multiplyVec3 = function(mat, vec, dest) {
	if(!dest) { dest = vec }
	
	var x = vec[0], y = vec[1], z = vec[2];
	
	dest[0] = mat[0]*x + mat[4]*y + mat[8]*z + mat[12];
	dest[1] = mat[1]*x + mat[5]*y + mat[9]*z + mat[13];
	dest[2] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14];
	
	return dest;
};

/*
 * mat4.multiplyVec4
 * Transforms a vec4 with the given matrix
 *
 * Params:
 * mat - mat4 to transform the vector with
 * vec - vec4 to transform
 * dest - Optional, vec4 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
mat4.multiplyVec4 = function(mat, vec, dest) {
	if(!dest) { dest = vec }
	
	var x = vec[0], y = vec[1], z = vec[2], w = vec[3];
	
	dest[0] = mat[0]*x + mat[4]*y + mat[8]*z + mat[12]*w;
	dest[1] = mat[1]*x + mat[5]*y + mat[9]*z + mat[13]*w;
	dest[2] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14]*w;
	dest[3] = mat[3]*x + mat[7]*y + mat[11]*z + mat[15]*w;
	
	return dest;
};

/*
 * mat4.translate
 * Translates a matrix by the given vector
 *
 * Params:
 * mat - mat4 to translate
 * vec - vec3 specifying the translation
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.translate = function(mat, vec, dest) {
	var x = vec[0], y = vec[1], z = vec[2];
	
	if(!dest || mat == dest) {
		mat[12] = mat[0]*x + mat[4]*y + mat[8]*z + mat[12];
		mat[13] = mat[1]*x + mat[5]*y + mat[9]*z + mat[13];
		mat[14] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14];
		mat[15] = mat[3]*x + mat[7]*y + mat[11]*z + mat[15];
		return mat;
	}
	
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	
	dest[0] = a00;
	dest[1] = a01;
	dest[2] = a02;
	dest[3] = a03;
	dest[4] = a10;
	dest[5] = a11;
	dest[6] = a12;
	dest[7] = a13;
	dest[8] = a20;
	dest[9] = a21;
	dest[10] = a22;
	dest[11] = a23;
	
	dest[12] = a00*x + a10*y + a20*z + mat[12];
	dest[13] = a01*x + a11*y + a21*z + mat[13];
	dest[14] = a02*x + a12*y + a22*z + mat[14];
	dest[15] = a03*x + a13*y + a23*z + mat[15];
	return dest;
};

/*
 * mat4.scale
 * Scales a matrix by the given vector
 *
 * Params:
 * mat - mat4 to scale
 * vec - vec3 specifying the scale for each axis
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.scale = function(mat, vec, dest) {
	var x = vec[0], y = vec[1], z = vec[2];
	
	if(!dest || mat == dest) {
		mat[0] *= x;
		mat[1] *= x;
		mat[2] *= x;
		mat[3] *= x;
		mat[4] *= y;
		mat[5] *= y;
		mat[6] *= y;
		mat[7] *= y;
		mat[8] *= z;
		mat[9] *= z;
		mat[10] *= z;
		mat[11] *= z;
		return mat;
	}
	
	dest[0] = mat[0]*x;
	dest[1] = mat[1]*x;
	dest[2] = mat[2]*x;
	dest[3] = mat[3]*x;
	dest[4] = mat[4]*y;
	dest[5] = mat[5]*y;
	dest[6] = mat[6]*y;
	dest[7] = mat[7]*y;
	dest[8] = mat[8]*z;
	dest[9] = mat[9]*z;
	dest[10] = mat[10]*z;
	dest[11] = mat[11]*z;
	dest[12] = mat[12];
	dest[13] = mat[13];
	dest[14] = mat[14];
	dest[15] = mat[15];
	return dest;
};

/*
 * mat4.rotate
 * Rotates a matrix by the given angle around the specified axis
 * If rotating around a primary axis (X,Y,Z) one of the specialized rotation functions should be used instead for performance
 *
 * Params:
 * mat - mat4 to rotate
 * angle - angle (in radians) to rotate
 * axis - vec3 representing the axis to rotate around 
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.rotate = function(mat, angle, axis, dest) {
	var x = axis[0], y = axis[1], z = axis[2];
	var len = Math.sqrt(x*x + y*y + z*z);
	if (!len) { return null; }
	if (len != 1) {
		len = 1 / len;
		x *= len; 
		y *= len; 
		z *= len;
	}
	
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	var t = 1-c;
	
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	
	// Construct the elements of the rotation matrix
	var b00 = x*x*t + c, b01 = y*x*t + z*s, b02 = z*x*t - y*s;
	var b10 = x*y*t - z*s, b11 = y*y*t + c, b12 = z*y*t + x*s;
	var b20 = x*z*t + y*s, b21 = y*z*t - x*s, b22 = z*z*t + c;
	
	if(!dest) { 
		dest = mat 
	} else if(mat != dest) { // If the source and destination differ, copy the unchanged last row
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
	}
	
	// Perform rotation-specific matrix multiplication
	dest[0] = a00*b00 + a10*b01 + a20*b02;
	dest[1] = a01*b00 + a11*b01 + a21*b02;
	dest[2] = a02*b00 + a12*b01 + a22*b02;
	dest[3] = a03*b00 + a13*b01 + a23*b02;
	
	dest[4] = a00*b10 + a10*b11 + a20*b12;
	dest[5] = a01*b10 + a11*b11 + a21*b12;
	dest[6] = a02*b10 + a12*b11 + a22*b12;
	dest[7] = a03*b10 + a13*b11 + a23*b12;
	
	dest[8] = a00*b20 + a10*b21 + a20*b22;
	dest[9] = a01*b20 + a11*b21 + a21*b22;
	dest[10] = a02*b20 + a12*b21 + a22*b22;
	dest[11] = a03*b20 + a13*b21 + a23*b22;
	return dest;
};

/*
 * mat4.rotateX
 * Rotates a matrix by the given angle around the X axis
 *
 * Params:
 * mat - mat4 to rotate
 * angle - angle (in radians) to rotate
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.rotateX = function(mat, angle, dest) {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	
	// Cache the matrix values (makes for huge speed increases!)
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];

	if(!dest) { 
		dest = mat 
	} else if(mat != dest) { // If the source and destination differ, copy the unchanged rows
		dest[0] = mat[0];
		dest[1] = mat[1];
		dest[2] = mat[2];
		dest[3] = mat[3];
		
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
	}
	
	// Perform axis-specific matrix multiplication
	dest[4] = a10*c + a20*s;
	dest[5] = a11*c + a21*s;
	dest[6] = a12*c + a22*s;
	dest[7] = a13*c + a23*s;
	
	dest[8] = a10*-s + a20*c;
	dest[9] = a11*-s + a21*c;
	dest[10] = a12*-s + a22*c;
	dest[11] = a13*-s + a23*c;
	return dest;
};

/*
 * mat4.rotateY
 * Rotates a matrix by the given angle around the Y axis
 *
 * Params:
 * mat - mat4 to rotate
 * angle - angle (in radians) to rotate
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.rotateY = function(mat, angle, dest) {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	
	if(!dest) { 
		dest = mat 
	} else if(mat != dest) { // If the source and destination differ, copy the unchanged rows
		dest[4] = mat[4];
		dest[5] = mat[5];
		dest[6] = mat[6];
		dest[7] = mat[7];
		
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
	}
	
	// Perform axis-specific matrix multiplication
	dest[0] = a00*c + a20*-s;
	dest[1] = a01*c + a21*-s;
	dest[2] = a02*c + a22*-s;
	dest[3] = a03*c + a23*-s;
	
	dest[8] = a00*s + a20*c;
	dest[9] = a01*s + a21*c;
	dest[10] = a02*s + a22*c;
	dest[11] = a03*s + a23*c;
	return dest;
};

/*
 * mat4.rotateZ
 * Rotates a matrix by the given angle around the Z axis
 *
 * Params:
 * mat - mat4 to rotate
 * angle - angle (in radians) to rotate
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.rotateZ = function(mat, angle, dest) {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	
	if(!dest) { 
		dest = mat 
	} else if(mat != dest) { // If the source and destination differ, copy the unchanged last row
		dest[8] = mat[8];
		dest[9] = mat[9];
		dest[10] = mat[10];
		dest[11] = mat[11];
		
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
	}
	
	// Perform axis-specific matrix multiplication
	dest[0] = a00*c + a10*s;
	dest[1] = a01*c + a11*s;
	dest[2] = a02*c + a12*s;
	dest[3] = a03*c + a13*s;
	
	dest[4] = a00*-s + a10*c;
	dest[5] = a01*-s + a11*c;
	dest[6] = a02*-s + a12*c;
	dest[7] = a03*-s + a13*c;
	
	return dest;
};

/*
 * mat4.frustum
 * Generates a frustum matrix with the given bounds
 *
 * Params:
 * left, right - scalar, left and right bounds of the frustum
 * bottom, top - scalar, bottom and top bounds of the frustum
 * near, far - scalar, near and far bounds of the frustum
 * dest - Optional, mat4 frustum matrix will be written into
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
mat4.frustum = function(left, right, bottom, top, near, far, dest) {
	if(!dest) { dest = mat4.create(); }
	var rl = (right - left);
	var tb = (top - bottom);
	var fn = (far - near);
	dest[0] = (near*2) / rl;
	dest[1] = 0;
	dest[2] = 0;
	dest[3] = 0;
	dest[4] = 0;
	dest[5] = (near*2) / tb;
	dest[6] = 0;
	dest[7] = 0;
	dest[8] = (right + left) / rl;
	dest[9] = (top + bottom) / tb;
	dest[10] = -(far + near) / fn;
	dest[11] = -1;
	dest[12] = 0;
	dest[13] = 0;
	dest[14] = -(far*near*2) / fn;
	dest[15] = 0;
	return dest;
};

/*
 * mat4.perspective
 * Generates a perspective projection matrix with the given bounds
 *
 * Params:
 * fovy - scalar, vertical field of view
 * aspect - scalar, aspect ratio. typically viewport width/height
 * near, far - scalar, near and far bounds of the frustum
 * dest - Optional, mat4 frustum matrix will be written into
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
mat4.perspective = function(fovy, aspect, near, far, dest) {
	var top = near*Math.tan(fovy*Math.PI / 360.0);
	var right = top*aspect;
	return mat4.frustum(-right, right, -top, top, near, far, dest);
};

/*
 * mat4.ortho
 * Generates a orthogonal projection matrix with the given bounds
 *
 * Params:
 * left, right - scalar, left and right bounds of the frustum
 * bottom, top - scalar, bottom and top bounds of the frustum
 * near, far - scalar, near and far bounds of the frustum
 * dest - Optional, mat4 frustum matrix will be written into
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
mat4.ortho = function(left, right, bottom, top, near, far, dest) {
	if(!dest) { dest = mat4.create(); }
	var rl = (right - left);
	var tb = (top - bottom);
	var fn = (far - near);
	dest[0] = 2 / rl;
	dest[1] = 0;
	dest[2] = 0;
	dest[3] = 0;
	dest[4] = 0;
	dest[5] = 2 / tb;
	dest[6] = 0;
	dest[7] = 0;
	dest[8] = 0;
	dest[9] = 0;
	dest[10] = -2 / fn;
	dest[11] = 0;
	dest[12] = -(left + right) / rl;
	dest[13] = -(top + bottom) / tb;
	dest[14] = -(far + near) / fn;
	dest[15] = 1;
	return dest;
};

/*
 * mat4.ortho
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * Params:
 * eye - vec3, position of the viewer
 * center - vec3, point the viewer is looking at
 * up - vec3 pointing "up"
 * dest - Optional, mat4 frustum matrix will be written into
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
mat4.lookAt = function(eye, center, up, dest) {
	if(!dest) { dest = mat4.create(); }
	
	var eyex = eye[0],
		eyey = eye[1],
		eyez = eye[2],
		upx = up[0],
		upy = up[1],
		upz = up[2],
		centerx = center[0],
		centery = center[1],
		centerz = center[2];

	if (eyex == centerx && eyey == centery && eyez == centerz) {
		return mat4.identity(dest);
	}
	
	var z0,z1,z2,x0,x1,x2,y0,y1,y2,len;
	
	//vec3.direction(eye, center, z);
	z0 = eyex - center[0];
	z1 = eyey - center[1];
	z2 = eyez - center[2];
	
	// normalize (no check needed for 0 because of early return)
	len = 1/Math.sqrt(z0*z0 + z1*z1 + z2*z2);
	z0 *= len;
	z1 *= len;
	z2 *= len;
	
	//vec3.normalize(vec3.cross(up, z, x));
	x0 = upy*z2 - upz*z1;
	x1 = upz*z0 - upx*z2;
	x2 = upx*z1 - upy*z0;
	len = Math.sqrt(x0*x0 + x1*x1 + x2*x2);
	if (!len) {
		x0 = 0;
		x1 = 0;
		x2 = 0;
	} else {
		len = 1/len;
		x0 *= len;
		x1 *= len;
		x2 *= len;
	};
	
	//vec3.normalize(vec3.cross(z, x, y));
	y0 = z1*x2 - z2*x1;
	y1 = z2*x0 - z0*x2;
	y2 = z0*x1 - z1*x0;
	
	len = Math.sqrt(y0*y0 + y1*y1 + y2*y2);
	if (!len) {
		y0 = 0;
		y1 = 0;
		y2 = 0;
	} else {
		len = 1/len;
		y0 *= len;
		y1 *= len;
		y2 *= len;
	}
	
	dest[0] = x0;
	dest[1] = y0;
	dest[2] = z0;
	dest[3] = 0;
	dest[4] = x1;
	dest[5] = y1;
	dest[6] = z1;
	dest[7] = 0;
	dest[8] = x2;
	dest[9] = y2;
	dest[10] = z2;
	dest[11] = 0;
	dest[12] = -(x0*eyex + x1*eyey + x2*eyez);
	dest[13] = -(y0*eyex + y1*eyey + y2*eyez);
	dest[14] = -(z0*eyex + z1*eyey + z2*eyez);
	dest[15] = 1;
	
	return dest;
};

/*
 * mat4.str
 * Returns a string representation of a mat4
 *
 * Params:
 * mat - mat4 to represent as a string
 *
 * Returns:
 * string representation of mat
 */
mat4.str = function(mat) {
	return '[' + mat[0] + ', ' + mat[1] + ', ' + mat[2] + ', ' + mat[3] + 
		', '+ mat[4] + ', ' + mat[5] + ', ' + mat[6] + ', ' + mat[7] + 
		', '+ mat[8] + ', ' + mat[9] + ', ' + mat[10] + ', ' + mat[11] + 
		', '+ mat[12] + ', ' + mat[13] + ', ' + mat[14] + ', ' + mat[15] + ']';
};

/*
 * quat4 - Quaternions 
 */
quat4 = {};

/*
 * quat4.create
 * Creates a new instance of a quat4 using the default array type
 * Any javascript array containing at least 4 numeric elements can serve as a quat4
 *
 * Params:
 * quat - Optional, quat4 containing values to initialize with
 *
 * Returns:
 * New quat4
 */
quat4.create = function(quat) {
	var dest = new window.glMatrixArrayType(4);
	
	if(quat) {
		dest[0] = quat[0];
		dest[1] = quat[1];
		dest[2] = quat[2];
		dest[3] = quat[3];
	}
	
	return dest;
};

/*
 * quat4.set
 * Copies the values of one quat4 to another
 *
 * Params:
 * quat - quat4 containing values to copy
 * dest - quat4 receiving copied values
 *
 * Returns:
 * dest
 */
quat4.set = function(quat, dest) {
	dest[0] = quat[0];
	dest[1] = quat[1];
	dest[2] = quat[2];
	dest[3] = quat[3];
	
	return dest;
};

/*
 * quat4.calculateW
 * Calculates the W component of a quat4 from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length. 
 * Any existing W component will be ignored. 
 *
 * Params:
 * quat - quat4 to calculate W component of
 * dest - Optional, quat4 receiving calculated values. If not specified result is written to quat
 *
 * Returns:
 * dest if specified, quat otherwise
 */
quat4.calculateW = function(quat, dest) {
	var x = quat[0], y = quat[1], z = quat[2];

	if(!dest || quat == dest) {
		quat[3] = -Math.sqrt(Math.abs(1.0 - x*x - y*y - z*z));
		return quat;
	}
	dest[0] = x;
	dest[1] = y;
	dest[2] = z;
	dest[3] = -Math.sqrt(Math.abs(1.0 - x*x - y*y - z*z));
	return dest;
}

/*
 * quat4.inverse
 * Calculates the inverse of a quat4
 *
 * Params:
 * quat - quat4 to calculate inverse of
 * dest - Optional, quat4 receiving inverse values. If not specified result is written to quat
 *
 * Returns:
 * dest if specified, quat otherwise
 */
quat4.inverse = function(quat, dest) {
	if(!dest || quat == dest) {
		quat[0] *= -1;
		quat[1] *= -1;
		quat[2] *= -1;
		return quat;
	}
	dest[0] = -quat[0];
	dest[1] = -quat[1];
	dest[2] = -quat[2];
	dest[3] = quat[3];
	return dest;
}

/*
 * quat4.length
 * Calculates the length of a quat4
 *
 * Params:
 * quat - quat4 to calculate length of
 *
 * Returns:
 * Length of quat
 */
quat4.length = function(quat) {
	var x = quat[0], y = quat[1], z = quat[2], w = quat[3];
	return Math.sqrt(x*x + y*y + z*z + w*w);
}

/*
 * quat4.normalize
 * Generates a unit quaternion of the same direction as the provided quat4
 * If quaternion length is 0, returns [0, 0, 0, 0]
 *
 * Params:
 * quat - quat4 to normalize
 * dest - Optional, quat4 receiving operation result. If not specified result is written to quat
 *
 * Returns:
 * dest if specified, quat otherwise
 */
quat4.normalize = function(quat, dest) {
	if(!dest) { dest = quat; }
	
	var x = quat[0], y = quat[1], z = quat[2], w = quat[3];
	var len = Math.sqrt(x*x + y*y + z*z + w*w);
	if(len == 0) {
		dest[0] = 0;
		dest[1] = 0;
		dest[2] = 0;
		dest[3] = 0;
		return dest;
	}
	len = 1/len;
	dest[0] = x * len;
	dest[1] = y * len;
	dest[2] = z * len;
	dest[3] = w * len;
	
	return dest;
}

/*
 * quat4.multiply
 * Performs a quaternion multiplication
 *
 * Params:
 * quat - quat4, first operand
 * quat2 - quat4, second operand
 * dest - Optional, quat4 receiving operation result. If not specified result is written to quat
 *
 * Returns:
 * dest if specified, quat otherwise
 */
quat4.multiply = function(quat, quat2, dest) {
	if(!dest) { dest = quat; }
	
	var qax = quat[0], qay = quat[1], qaz = quat[2], qaw = quat[3];
	var qbx = quat2[0], qby = quat2[1], qbz = quat2[2], qbw = quat2[3];
	
	dest[0] = qax*qbw + qaw*qbx + qay*qbz - qaz*qby;
	dest[1] = qay*qbw + qaw*qby + qaz*qbx - qax*qbz;
	dest[2] = qaz*qbw + qaw*qbz + qax*qby - qay*qbx;
	dest[3] = qaw*qbw - qax*qbx - qay*qby - qaz*qbz;
	
	return dest;
}

/*
 * quat4.multiplyVec3
 * Transforms a vec3 with the given quaternion
 *
 * Params:
 * quat - quat4 to transform the vector with
 * vec - vec3 to transform
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
quat4.multiplyVec3 = function(quat, vec, dest) {
	if(!dest) { dest = vec; }
	
	var x = vec[0], y = vec[1], z = vec[2];
	var qx = quat[0], qy = quat[1], qz = quat[2], qw = quat[3];

	// calculate quat * vec
	var ix = qw*x + qy*z - qz*y;
	var iy = qw*y + qz*x - qx*z;
	var iz = qw*z + qx*y - qy*x;
	var iw = -qx*x - qy*y - qz*z;
	
	// calculate result * inverse quat
	dest[0] = ix*qw + iw*-qx + iy*-qz - iz*-qy;
	dest[1] = iy*qw + iw*-qy + iz*-qx - ix*-qz;
	dest[2] = iz*qw + iw*-qz + ix*-qy - iy*-qx;
	
	return dest;
}

/*
 * quat4.toMat3
 * Calculates a 3x3 matrix from the given quat4
 *
 * Params:
 * quat - quat4 to create matrix from
 * dest - Optional, mat3 receiving operation result
 *
 * Returns:
 * dest if specified, a new mat3 otherwise
 */
quat4.toMat3 = function(quat, dest) {
	if(!dest) { dest = mat3.create(); }
	
	var x = quat[0], y = quat[1], z = quat[2], w = quat[3];

	var x2 = x + x;
	var y2 = y + y;
	var z2 = z + z;

	var xx = x*x2;
	var xy = x*y2;
	var xz = x*z2;

	var yy = y*y2;
	var yz = y*z2;
	var zz = z*z2;

	var wx = w*x2;
	var wy = w*y2;
	var wz = w*z2;

	dest[0] = 1 - (yy + zz);
	dest[1] = xy - wz;
	dest[2] = xz + wy;

	dest[3] = xy + wz;
	dest[4] = 1 - (xx + zz);
	dest[5] = yz - wx;

	dest[6] = xz - wy;
	dest[7] = yz + wx;
	dest[8] = 1 - (xx + yy);
	
	return dest;
}

/*
 * quat4.toMat4
 * Calculates a 4x4 matrix from the given quat4
 *
 * Params:
 * quat - quat4 to create matrix from
 * dest - Optional, mat4 receiving operation result
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
quat4.toMat4 = function(quat, dest) {
	if(!dest) { dest = mat4.create(); }
	
	var x = quat[0], y = quat[1], z = quat[2], w = quat[3];

	var x2 = x + x;
	var y2 = y + y;
	var z2 = z + z;

	var xx = x*x2;
	var xy = x*y2;
	var xz = x*z2;

	var yy = y*y2;
	var yz = y*z2;
	var zz = z*z2;

	var wx = w*x2;
	var wy = w*y2;
	var wz = w*z2;

	dest[0] = 1 - (yy + zz);
	dest[1] = xy - wz;
	dest[2] = xz + wy;
	dest[3] = 0;

	dest[4] = xy + wz;
	dest[5] = 1 - (xx + zz);
	dest[6] = yz - wx;
	dest[7] = 0;

	dest[8] = xz - wy;
	dest[9] = yz + wx;
	dest[10] = 1 - (xx + yy);
	dest[11] = 0;

	dest[12] = 0;
	dest[13] = 0;
	dest[14] = 0;
	dest[15] = 1;
	
	return dest;
}

/*
 * quat4.slerp
 * Performs a spherical linear interpolation between two quat4
 *
 * Params:
 * quat - quat4, first quaternion
 * quat2 - quat4, second quaternion
 * slerp - interpolation amount between the two inputs
 * dest - Optional, quat4 receiving operation result. If not specified result is written to quat
 *
 * Returns:
 * dest if specified, quat otherwise
 */
quat4.slerp = function(quat, quat2, slerp, dest) {
    if(!dest) { dest = quat; }
    
	var cosHalfTheta =  quat[0]*quat2[0] + quat[1]*quat2[1] + quat[2]*quat2[2] + quat[3]*quat2[3];
	
	if (Math.abs(cosHalfTheta) >= 1.0){
	    if(dest != quat) {
		    dest[0] = quat[0];
		    dest[1] = quat[1];
		    dest[2] = quat[2];
		    dest[3] = quat[3];
		}
		return dest;
	}
	
	var halfTheta = Math.acos(cosHalfTheta);
	var sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta*cosHalfTheta);

	if (Math.abs(sinHalfTheta) < 0.001){
		dest[0] = (quat[0]*0.5 + quat2[0]*0.5);
		dest[1] = (quat[1]*0.5 + quat2[1]*0.5);
		dest[2] = (quat[2]*0.5 + quat2[2]*0.5);
		dest[3] = (quat[3]*0.5 + quat2[3]*0.5);
		return dest;
	}
	
	var ratioA = Math.sin((1 - slerp)*halfTheta) / sinHalfTheta;
	var ratioB = Math.sin(slerp*halfTheta) / sinHalfTheta; 
	
	dest[0] = (quat[0]*ratioA + quat2[0]*ratioB);
	dest[1] = (quat[1]*ratioA + quat2[1]*ratioB);
	dest[2] = (quat[2]*ratioA + quat2[2]*ratioB);
	dest[3] = (quat[3]*ratioA + quat2[3]*ratioB);
	
	return dest;
}


/*
 * quat4.str
 * Returns a string representation of a quaternion
 *
 * Params:
 * quat - quat4 to represent as a string
 *
 * Returns:
 * string representation of quat
 */
quat4.str = function(quat) {
	return '[' + quat[0] + ', ' + quat[1] + ', ' + quat[2] + ', ' + quat[3] + ']'; 
}

	return {
	    rect: rect,
	    vec3: vec3,
	    mat3: mat3, 
	    mat4: mat4,
	    quat4: quat4
	};
});

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

// Stuff that have no real home


define('Utility',[
    'glMatrix'
], function(glMatrix) {

    var htmlEntityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };

    return {
        rect: glMatrix.rect,
        vec3: glMatrix.vec3,
        mat3: glMatrix.mat3, 
        mat4: glMatrix.mat4,
        quat4: glMatrix.quat4,

        /**
         * Utility method to escape HTML content from strings (chat, nicknames, etc)
         */
        escape: function(string) {
            return String(string).replace(/[&<>"'\/]/g, function (s) {
                return htmlEntityMap[s];
            });
        },

        /**
         * Utilize a worker canvas to split a block of text into multiple 
         * lines and populate the input `text` array.
         * 
         * @author http://delphic.me.uk/webgltext.html
         * 
         * @param {context} ctx Canvas context rendering the string
         * @param {string} textToWrite Text to be broken up into multiple lines
         * @param {number} maxWidth Maximum width of a single line of text
         * @param {array} text Split lines will be dumped into this array
         * 
         * @return {integer} final width of the rendered text
         */
        createMultilineText : function(ctx, textToWrite, maxWidth, text) {
            textToWrite = textToWrite.replace("\n"," ");
            var currentText = textToWrite;
            var futureText;
            var subWidth = 0;
            var maxLineWidth = 0;
            
            var wordArray = textToWrite.split(" ");
            var wordsInCurrent, wordArrayLength;
            wordsInCurrent = wordArrayLength = wordArray.length;
            
            // Reduce currentText until it is less than maxWidth or is a single word
            // futureText var keeps track of text not yet written to a text line
            while (ctx.measureText(currentText).width > maxWidth && wordsInCurrent > 1) {
                wordsInCurrent--;
                
                currentText = futureText = "";
                for (var i = 0; i < wordArrayLength; i++) {
                    if (i < wordsInCurrent) {
                        currentText += wordArray[i];
                        if (i+1 < wordsInCurrent) { currentText += " "; }
                    }
                    else {
                        futureText += wordArray[i];
                        if(i+1 < wordArrayLength) { futureText += " "; }
                    }
                }
            }
            
            text.push(currentText); // Write this line of text to the array
            maxLineWidth = Math.ceil(ctx.measureText(currentText).width);
            
            // If there is any text left to be written call the function again
            if (futureText) {
                subWidth = this.createMultilineText(ctx, futureText, maxWidth, text);
                if (subWidth > maxLineWidth) { 
                    maxLineWidth = subWidth;
                }
            }
            
            // Return the maximum line width
            return maxLineWidth;
        },

        /**
         * Retrieve information about the browser, and webGL support.
         */
        getBrowserReport: function(showPlugins, gl) {

            var report = '';

            // Gather whatever useful information we can about the browser
            report += "\nBrowser Details\n";
            if (window.navigator)
            {
                report += "* appName: " + window.navigator.appName + "\n";
                report += "* appVersion: " + window.navigator.appVersion + "\n";
                report += "* platform: " + window.navigator.platform + "\n";
                report += "* vendor: " + window.navigator.vendor + "\n";
                report += "* cookieEnabled: " + window.navigator.cookieEnabled + "\n";

                if (window.navigator.plugins && showPlugins) {
                    report += "* Plugins\n";
                    
                    for (var i = 0; i < window.navigator.plugins.length; i++) {
                        var name = window.navigator.plugins[i].name;
                        var file = window.navigator.plugins[i].filename;
                        report += "** *" + name + "* - " + file + "\n";
                    }
                }
            } else {
                report += "* !window.navigator\n";
            }

            report += "\nWebSocket Details\n";
            if ('WebSocket' in window) {
                report += "* WebSocket object support\n";
            } else if ('MozWebSocket' in window) {
                report += "* MozWebSocket object support\n";
            } else {
                report += "* No WebSocket support\n";
            }
            
            // Gather whatever useful information we can about WebGL support
            report += "\nWebGL Details\n";
            
            if (!gl && !window.gl) {
                // Load a temporary GL canvas
                var canvas = document.createElement('canvas');
                
                if ('getContext' in canvas) {
                    gl = canvas.getContext('webgl');
                    
                    if (!gl) {
                        gl = canvas.getContext('experimental-webgl');
                    }
                }
            }

            // If we still can't get a GL context loaded, assume 
            // the browser doesn't support it. 
            if (!gl) {

                report += "* No support\n";
                
            } else {
                
                report += "* VERSION: " + gl.getParameter(gl.VERSION) + "\n";
                report += "* VENDOR: " + gl.getParameter(gl.VENDOR) + "\n";
                report += "* RENDERER: " + gl.getParameter(gl.RENDERER) + "\n";
                report += "* SHADING_LANGUAGE_VERSION: " + gl.getParameter(gl.SHADING_LANGUAGE_VERSION) + "\n";
                
                // If a shader is running, record what shader (in case of rendering issues)
                var program = gl.getParameter(gl.CURRENT_PROGRAM);
                if (program) {
                    report += "* CURRENT_PROGRAM Log: " + gl.getProgramInfoLog(gl.getParameter(gl.CURRENT_PROGRAM)) + "\n";
                }
            }
            
            return report;
        },

        /**
         * Simple shim for $.extend() to provide some inheritance for objects.
         *
         * @param {object} target to extend
         * @param {object} source object to retrieve properties from
         *
         * @return {object}
         */
        extend: function(target, source) {
            Object.keys(source).map(function (prop) {
                if (!target.hasOwnProperty(prop)) {
                    target[prop] = source[prop];
                }
            });
            return target;
        },

        /**
         * Fast string hashing.
         *
         * @param {string} s
         *
         * @return {string}
         */
        hash: function(s) {
            var i, c, hash = 0,
                strlen = s.length;

            if (strlen === 0) {
                return hash;
            }

            for (i = 0; i < strlen; ++i) {
                c = s.charCodeAt(i);
                hash = ((hash << 5) - hash) + c;
                hash = hash & hash; // Convert to 32bit integer
            }

            return hash;
        }
    };

});

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

define('Timer',[], function() {

    /**
     * A self-correcting timer that can handle drift, as well as burst
     * processing when window.setTimeout does not execute at expected speeds
     * (e.g. the browser window is not focused).
     *
     * @param {function} callback when interval milliseconds have passed
     * @param {int} interval milliseconds between callbacks
     * @param {bool} lazy if true, will not perform burst calls when the 
     *                    browser does not respect setTimeout. Optional.
     */
    function Timer(callback, interval /*, lazy */) {

        this.callback = callback;
        this.interval = interval;
        //this.lazy = !!lazy;
        // TODO: Resolve laziness... 

        this.running = false;

        //this.actualRuns = 0;
    }

    Timer.prototype.tick = function() {
        if (!this.running) {
            return;
        }

        var now = Date.now();

        //console.log('plan   ' + (this.planned - this.lastRun));
        //console.log('drift  ' + (now - this.planned));
        //console.log('actual ' + (now - this.actual));

        this.callback(this, now - (this.planned - this.interval));

        //this.actualRuns++;

        // Check for catch-up
        this.lastRun = this.planned;
        this.planned += this.interval;

        while (this.planned < now) {
            
            //console.log('catch-up');

            // TODO: The delta passed in isn't actually 0. It could be
            // drift by a few milliseconds (or longer, depending on the callback)
            this.callback(this, 0);
            this.lastRun = this.planned;
            this.planned += this.interval;
            
            //this.actualRuns++;
        }

        //console.log(
        //    'actual ' + this.actualRuns + ' vs expected ' + 
        //    ((now - this.actual) / this.interval)
        //);

        // Note: binding this.run is done in each call, as we can't do this just
        // once. 
        this.timeout = window.setTimeout(this.tick.bind(this), this.planned - now);
    };

    /**
     * Start this timer after a stop(). The next time it 
     * fires will be now + this.interval milliseconds.
     */
    Timer.prototype.start = function() {
        if (!this.running) {
            this.running = true;
            this.planned = Date.now() + this.interval;
            this.lastRun = Date.now();
            //this.actual = Date.now();

            this.timeout = window.setTimeout(
                this.tick.bind(this), this.interval
            );
        }
    };

    /**
     * Stop this timer from processing. A stopped timer
     * will not attempt to play catch-up after start(). 
     */
    Timer.prototype.stop = function() {
        if (this.running) {
            this.running = false;
            window.clearTimeout(this.timeout);
        }
    };

    return Timer;
});

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

define('Audio',[
    'EventHooks',
    'Utility'
], function(EventHooks, Util) {

    function Audio(context) {
        // jshint unused:false
        Util.extend(this, EventHooks);

        this.audioContext = null;
        this.audioGainNode = null;
        this.ambientGainNode = null;

        try {
            // Fix up for prefixing
            window.AudioContext = window.AudioContext||window.webkitAudioContext;
            
            if (window.AudioContext) {
                this.audioContext = new window.AudioContext();
            }
        } catch (exception) {
            this.audioContext = null;
        }

        if (this.audioContext) {
            // More vendor corrections.
            if (!this.audioContext.createGain) {
                this.audioContext.createGain = this.audioContext.createGainNode;
            }

            // TODO: Necessary?
            if (!this.audioContext.createGain) {
                throw new Error('Failed to identify createGain() for audio context');
            }
            
            this.audioGainNode = this.audioContext.createGain();
            this.audioGainNode.connect(this.audioContext.destination);
            
            this.ambientGainNode = this.audioContext.createGain();
            this.ambientGainNode.connect(this.audioGainNode);
        }
    }

    /** 
     * Returns true if the audio API is available to use
     */
    Audio.prototype.isAvailable = function() {
        return this.audioContext !== null;
    };

    Audio.prototype.getAudioContext = function() {
        return this.audioContext;
    };
    
    Audio.prototype.setMasterVolume = function(volume) {
        
        if (volume > 1.0) {
            volume = 1.0;
        }
        
        if (this.audioContext && this.audioGainNode) {
            // Using an x-squared curve since simple linear (x) 
            // does not sound as good (via html5rocks.com)
            this.audioGainNode.gain.value = volume * volume;
            
            this.fire('setmaster', volume);
        }
    };
    
    Audio.prototype.getMasterVolume = function() {
    
        if (this.audioContext && this.audioGainNode) {
            // TODO: math is wrong, not the same as setMasterVolume
            return this.audioGainNode.gain.value;
        } else {
            return 0;
        }
    };
    
    Audio.prototype.setAmbientVolume = function(volume) {
        
        if (volume > 1.0) {
            volume = 1.0;
        }
        
        if (this.audioContext && this.audioGainNode) {
            // Using an x-squared curve since simple linear (x) 
            // does not sound as good (via html5rocks.com)
            this.ambientGainNode.gain.value = volume * volume;
            
            this.fire('setambient', volume);
        }
    };
    
    Audio.prototype.getAmbientVolume = function() {
        
        if (this.audioContext && this.audioGainNode) {
            // TODO: math is wrong, not the same as setAmbientVolume
            return this.ambientGainNode.gain.value;
        } else {
            return 0;
        }
    };
    
    Audio.prototype.addConnection = function(source, ambient) {
        
        if (this.audioContext) {
            if (ambient) {
                source.connect(this.ambientGainNode);
            } else { // connect directly to master
                source.connect(this.audioGainNode);
            }
        }
    };
    
    Audio.prototype.play = function(source) {
        
        if (this.audioContext) {
            source.start(0);
        }
    };
    
    Audio.prototype.stop = function(source) {
    
        if (this.audioContext) {
            source.stop(0);
        }
    };

    return Audio;
});    

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

define('Resources',[
    'EventHooks',
    'Utility'
], function(EventHooks, Util) {

    // TODO: Rewrite a lot of this. I don't like the error list, I don't like how
    // the error handling works in general, etc. This can be a lot simpler, and a lot
    // more elegant to use. 

    function Resources(context) {
        Util.extend(this, EventHooks); // Allow events to be fired from resource manager

        this.context = context;
        this.loaded = {};
        this.failed = {};
        // Canvas used for generating temporary texture sources
        // TODO: Do we still want this? We lose any type of asyncronous support
        // if resources have to wait on a canvas element to work.
        //scratchCanvas = document.createElement('canvas'),
        this.totalPreload = 0;
        this.completedPreload = 0;

        // Bind callbacks to this instance
        this.onPreloadResourceComplete = this.onPreloadResourceComplete.bind(this);
        this.onPreloadResourceError = this.onPreloadResourceError.bind(this);
    }

    Resources.prototype.preload = function(json) {
        this.totalPreload = 0;
        this.completedPreload = 0;
        
        if (json.hasOwnProperty('required')) {
            this.totalPreload += json.required.length;

            for (var i = 0; i < json.required.length; i++) {
                this._preloadResource(json.required[i]);
            }
        }
        
        // TODO: Support optional preloads 
        return this;
    };
    
    Resources.prototype.isPreloadComplete = function() {
        return this.totalPreload === this.completedPreload;
    };
    
    Resources.prototype._preloadResource = function(json) {

        var resource = this.load(json);
        if (resource.isLoaded()) {
            this.onPreloadResourceComplete(resource);
        } else {
            // Need to wait further for downloads/processing to complete
            resource
                .bind('onload', this.onPreloadResourceComplete)
                .bind('onerror', this.onPreloadResourceError);
        }
    };

    Resources.prototype.onPreloadResourceComplete = function(resource) {
        this.completedPreload++;
        this.fire('preload.status', resource);
        
        // If this was the last resource to download, fire a complete event
        if (this.completedPreload === this.totalPreload) {
            this.fire('preload.complete');
        }
    };

    Resources.prototype.onPreloadResourceError = function(resource) {
        // TODO: this.load() also adds it to this.loaded even though
        // it technically wasn't loaded. Re-evaluate this logic for failure
        // handling. 
        this.failed[resource._resourceId] = resource;
        this.fire('preload.error', resource);
    };
    
    Resources.prototype.isLoaded = function(id) {
        return this.loaded.hasOwnProperty(id);
    };

    /**
     * Load a resource by JSON definition. If the JSON definition matches
     * a previously loaded resource, this will immediately return a
     * reference to the old resource. If the returned resource's 
     * isLoaded() method returns true, it can be used immediately. Otherwise
     * the implementer must bind to it's 'onload' and 'onerror' events and
     * wait until it has been fully loaded.
     */
    Resources.prototype.load = function(json) {
        // Late-require fro so we don't get caught 
        // in a dependency cycle on import
        var fro = require('fro');

        // Validate JSON properties
        // TODO: Better validators
        if (!json.hasOwnProperty('type')) {
            throw new Error(
                'JSON resource is missing required attribute [type]: ' + 
                JSON.stringify(json)
            );
        }

        // Generate a unique ID from a hash of the JSON
        var id = Util.hash(JSON.stringify(json));
        var type = json.type;
        
        // If the resource can be shared between instances, and we already have it
        // loaded, just return the original resource.
        if (this.loaded.hasOwnProperty(id) && this.loaded[id].shareable) {
            return this.loaded[id];
        }

        if (!fro.resources.hasOwnProperty(type)) {
            this.failed[id] = json;
            throw new Error(
                'Cannot load [' + id + ']. No loader for type [' + 
                type + ']'
            );
        }

        var resource = new fro.resources[type](this.context, json);
        resource._resourceId = id;

        // If we can share it between instances, cache the results.
        if (resource.shareable) {
            this.loaded[id] = resource;
        }
        
        return resource;
    };

    return Resources;
});

/**
 * @license RequireJS text 2.0.14 Copyright (c) 2010-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
  define, window, process, Packages,
  java, location, Components, FileUtils */

define('text',['module'], function (module) {
    'use strict';

    var text, fs, Cc, Ci, xpcIsWindows,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = {},
        masterConfig = (module.config && module.config()) || {};

    text = {
        version: '2.0.14',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.lastIndexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                             name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || uPort === port);
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config && config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config && config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            // Do not load if it is an empty: url
            if (url.indexOf('empty:') === 0) {
                onLoad();
                return;
            }

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node &&
            !process.versions['node-webkit'] &&
            !process.versions['atom-shell'])) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback, errback) {
            try {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file[0] === '\uFEFF') {
                    file = file.substring(1);
                }
                callback(file);
            } catch (e) {
                if (errback) {
                    errback(e);
                }
            }
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status || 0;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        if (errback) {
                            errback(err);
                        }
                    } else {
                        callback(xhr.responseText);
                    }

                    if (masterConfig.onXhrComplete) {
                        masterConfig.onXhrComplete(xhr, url);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                if (line !== null) {
                    stringBuffer.append(line);
                }

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env &&
            typeof Components !== 'undefined' && Components.classes &&
            Components.interfaces)) {
        //Avert your gaze!
        Cc = Components.classes;
        Ci = Components.interfaces;
        Components.utils['import']('resource://gre/modules/FileUtils.jsm');
        xpcIsWindows = ('@mozilla.org/windows-registry-key;1' in Cc);

        text.get = function (url, callback) {
            var inStream, convertStream, fileObj,
                readData = {};

            if (xpcIsWindows) {
                url = url.replace(/\//g, '\\');
            }

            fileObj = new FileUtils.File(url);

            //XPCOM, you so crazy
            try {
                inStream = Cc['@mozilla.org/network/file-input-stream;1']
                           .createInstance(Ci.nsIFileInputStream);
                inStream.init(fileObj, 1, 0, false);

                convertStream = Cc['@mozilla.org/intl/converter-input-stream;1']
                                .createInstance(Ci.nsIConverterInputStream);
                convertStream.init(inStream, "utf-8", inStream.available(),
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

                convertStream.readString(inStream.available(), readData);
                convertStream.close();
                inStream.close();
                callback(readData.value);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            }
        };
    }
    return text;
});


define('text!shaders/main.vs',[],function () { return '\r\nattribute vec3 aVertexPosition;\r\nattribute vec2 aTextureCoord;\r\n\r\nuniform mat4 uMVMatrix;\r\nuniform mat4 uPMatrix;\r\nuniform vec4 uColor;\r\n\r\nvarying vec2 vTextureCoord;\r\nvarying vec4 vWorldCoord;\r\n\r\nvoid main(void) {\r\n    \r\n    vWorldCoord = uMVMatrix * vec4(aVertexPosition, 1.0);\r\n    vTextureCoord = aTextureCoord;\r\n\r\n    gl_Position = uPMatrix * vWorldCoord * vec4(1, -1, 0, 1);\r\n\r\n    /*\r\n        gl_Position is absolute screen position [0, 1] (ie: @ screen x = 800, gl_Position.x = 1)\r\n        uMVMatrix * aVertexPos = is screen position in pixels (ie: x = (0, 800))\r\n        aVertexPos = [0, 1], where 0 is the left edge of the object rendered\r\n        gl_FragCoord (frag) = screen position, therefore same as uMVMatrix * aVertexPos?\r\n    */\r\n}\r\n';});


define('text!shaders/main.fs',[],function () { return 'precision mediump float;\r\n\r\nvarying vec2 vTextureCoord;\r\nvarying vec4 vWorldCoord;\r\n\r\nuniform sampler2D uSampler;\r\nuniform vec2 uClip;\r\nuniform float uTime;\r\nuniform vec3 uCamera;\r\n\r\nvoid main(void) {\r\n    gl_FragColor = texture2D(uSampler, vTextureCoord + uClip);\r\n}\r\n';});

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

define('Renderer',[
    'Utility',
    'text!shaders/main.vs',
    'text!shaders/main.fs'
], function(Util, vertexShaderSource, fragmentShaderSource) {
    var mat4 = Util.mat4; 

    function Renderer(context, options) {

        this.canvas = options.canvas;
        this.usesWebGL = true; //options.useWebGL || true,
        this.shaders = [];
        this.currentShader = null;
        this.clearStyle = 'rgb(0,0,0)';
        this.gl = null;

        if (!this.canvas) {
            throw new Error('No canvas specified');
        }

        try {
            var ctx = this.canvas.getContext('webgl') || 
                      this.canvas.getContext('experimental-webgl');

            this.gl = ctx; //WebGLDebugUtils.makeDebugContext(canvasContext, undefined, validateNoneOfTheArgsAreUndefined);
            this.usesWebGL = true;
        } catch (e) {
            this.usesWebGL = false;
        }
        
        // No WebGL support, they can't play! (at least until we get canvas fallbacks :P)
        if (!this.gl) {
            throw new Error('No WebGL support');
        }

        // Configure WebGL to our canvas
        this.gl.viewportWidth = this.canvas.width;
        this.gl.viewportHeight = this.canvas.height;

        // Add some matrix manipulation helpers to our GL instance
        this.gl.mvMatrix = mat4.create();
        this.gl.pMatrix = mat4.create();
        this.gl.mvMatrixStack = [];
        
        this.gl.mvPopMatrix = function() {
            if (this.mvMatrixStack.length === 0) {
                throw new Error('Invalid popMatrix!');
            }
            this.mvMatrix = this.mvMatrixStack.pop();
        };
            
        this.gl.mvPushMatrix = function() {
            var copy = mat4.create();
            mat4.set(this.mvMatrix, copy);
            this.mvMatrixStack.push(copy);
        };
        
        // upload matrix changes to the graphics card, since GL doesn't track local changes
        var self = this;
        this.gl.setMatrixUniforms = function() {
            
            var shader = self.getCurrentShader();
        
            this.uniformMatrix4fv(shader.getUniform('uPMatrix'), false, this.pMatrix);
            this.uniformMatrix4fv(shader.getUniform('uMVMatrix'), false, this.mvMatrix);
        };
        
        /*
            From http://en.wikipedia.org/wiki/Alpha_compositing#Alpha_blending
            outA = srcA + dstA(1 - srcA)
            outRGB = srcRGB(srcA) + dstRGB*dstA(1 - srcA)
            
            Orgb = srgb * Srgb + drgb * Drgb
            Oa = sa * Sa + da * Da
            glBlendFuncSeparate(srgb, drgb, sa, da)
            
            TODO: eventually phase this out, since blending will work differently within the shader.
        */
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFuncSeparate(
            this.gl.SRC_ALPHA, 
            this.gl.ONE_MINUS_SRC_ALPHA, 
            this.gl.ONE, 
            this.gl.ONE_MINUS_SRC_ALPHA
        );
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

        if (options.hasOwnProperty('background')) {
            this.setClearColor(options.background);
        }

        // Load default shader

        // This is a slight hack to ensure renderer context is
        // defined prior to loading the shader resource
        context.renderer = this; 

        this.defaultShader = context.resources.load({
            id: 'shader:default',
            type: 'Shader',
            vertex: vertexShaderSource,
            fragment: fragmentShaderSource,
            uniforms: [
                'uTime',
                'uCamera',
                'uClip',
                'uSampler',
                'uMVMatrix',
                'uPMatrix'
            ],
            attributes: [
                'aVertexPosition',
                'aTextureCoord'
            ]
        });
    }

    Renderer.prototype.isWebGL = function() {
        return this.usesWebGL === true;
    };

    /**
     * Expose our GL context to other modules.
     */
    Renderer.prototype.getGLContext = function() {
        return this.gl;
    };

    /**
     * Expose our active canvas
     */
    Renderer.prototype.getCanvas = function() {
        return this.canvas;
    };

    Renderer.prototype.clear = function() {
    
        if (this.isWebGL()) {
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        } else {
            // TODO: Support!
            throw new Error('Not supported');
            //gl.fillStyle = clearStyle;
            //gl.fillRect(0, 0, gl.viewportWidth, gl.viewportHeight);
        }
    };
    
    Renderer.prototype.createTexture = function(image) {
        
        var texture,
            gl = this.gl;

        if (this.isWebGL()) {
            texture = gl.createTexture();

            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);  

            // Supporting non power of two textures
            // See: http://www.khronos.org/webgl/wiki/WebGL_and_OpenGL_Differences#Non-Power_of_Two_Texture_Support
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

            // Can't mipmap if want non-power-of-two via wrapping
            //gl.generateMipmap(gl.TEXTURE_2D); 

            gl.bindTexture(gl.TEXTURE_2D, null);
            
        } else {
            throw new Error('Not supported');
        }
        
        return texture;
    };
    
    /**
     * Set the clear color for the canvas. 
     *
     * @param vec3 color Color to use, RGB [0-255]
     */
    Renderer.prototype.setClearColor = function(color) {
        this.clearStyle = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';

        if (this.isWebGL()) {
            this.gl.clearColor(color[0]/255.0, color[1]/255.0, color[2]/255.0, 1.0);
        }
    };
    
    /** 
     * Set the current shader used by the renderer. 
     * 
     * @param ShaderResource shader
     */
    Renderer.prototype.useShader = function(shader) {

        // TODO: Maybe actually throw an error here?
        if (!shader) {
            shader = this.getDefaultShader();
        }

        this.currentShader = shader;
        this.gl.useProgram(shader.getProgram());
    };

    /**
     * Add a new shader to our list of available shaders
     * 
     * @param Shader shader The shader resource to add
     */
    Renderer.prototype.attachShader = function(shader) {
        this.shaders[shader.id] = shader;
    };
    
    Renderer.prototype.getCurrentShader = function() {
        return this.currentShader;
    };
    
    Renderer.prototype.getShader = function(id) {
        
        if (!this.shaders.hasOwnProperty(id)) {
            throw new Error('Shader [' + id + '] is not loaded');
        }
        
        return this.shaders[id];
    };
    
    Renderer.prototype.getDefaultShader = function() {

        return this.defaultShader;
    };

    Renderer.prototype.setDefaultShader = function(shader) {

        this.defaultShader = shader;
    };

    // @todo the functionality of changing active shaders.
    // Need to take in account that we probably need to link a vs/fs to 
    // the same program, causing duplicates if we have duplicates in sets.
    // (ie: shared vs's)

    return Renderer;
});

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

define('Camera',[
    'EventHooks',
    'Utility'
], function(EventHooks, Util) {
    var vec3 = Util.vec3,
        rect = Util.rect,
        mat4 = Util.mat4;

    // TODO: Make the camera an entity child, so follow is done just by parenting.
    // As well, if the child entity is destroyed, don't destroy the camera and instead
    // delink and re-associate with the world's root entity (when applicable)

    function Camera(context, options) {
        Util.extend(this, EventHooks); // Allow events to be fired from the camera
        // jshint unused:false
        // temp hint for options until I move init code over here.
        this.trackedEntity = null;
        this.position = options.position || vec3.create();
        this.zoom = 1.0; // Factor to this.zoom the viewport. TODO: disable (or implement?!) for canvas mode
        this.lastTrackedPosition = vec3.create();
        this.translation = vec3.create();
        this.bounds = rect.create();
        this.context = context;

        if (options.trackPlayer === true) {
            this.trackedEntity = this.context.player;
        }
        
        if (options.hasOwnProperty('bounds')) {
            this.setBounds(options.bounds);
        }

        this.updateTranslation();
    }

    Camera.prototype.setupViewport = function() {
        var gl = this.context.renderer.getGLContext();

        this.update();
    
        // If the canvas has changed size, resize our viewport
        if (gl.canvas.width !== gl.canvas.clientWidth ||
            gl.canvas.height !== gl.canvas.clientHeight) {

            // Update canvas size to match client size
            gl.canvas.width = gl.canvas.clientWidth;
            gl.canvas.height = gl.canvas.clientHeight;

            // Keep the viewport at a nice even number so pixels remain as expected
            gl.viewportWidth = 2 * Math.round(gl.canvas.width * 0.5);
            gl.viewportHeight = 2 * Math.round(gl.canvas.height * 0.5);

            // Re-orient our translation to match the new viewport
            this.applyBounds();
            this.updateTranslation();
        }
        
        if (this.context.renderer.isWebGL()) {

            gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
            
            // set up projection matrix
            // @todo don't I only have to do this once? Or only when this.zoom changes?
            mat4.ortho(0, gl.viewportWidth * this.zoom, 0, gl.viewportHeight * this.zoom, 0.0, -1000.0, gl.pMatrix);
            
            // set up model view matrix
            mat4.identity(gl.mvMatrix);
            
            // Translate origin away from our camera
            //var trans = vec3.create(this._position);
            //trans[0] *= -1;
            //trans[1] *= -1;
        
        } else {
            // @todo Canvas transformation reset and handling
            gl.setTransform(1, 0, 0, 1, 0, 0);
        }
        
        mat4.translate(gl.mvMatrix, this.translation);
        
        this.context.renderer.clear();
    };
        
    Camera.prototype.setBounds = function(r) {

        rect.set(r, this.bounds);
    };

    /**
     * Orders this camera to remain centered on a specific entity 
     * (Entity is defined as any object with a getPosition() method)
     */
    Camera.prototype.trackEntity = function(entity) {
        
        if (typeof entity.getPosition !== 'function') {
            throw 'Followed entity must have a getPosition() method.';
        }

        this.trackedEntity = entity;
        this.fire('follow', entity);
    };

    /** 
     * @return object|null
     */
    Camera.prototype.getTrackedEntity = function() {

        return this.trackedEntity;
    };

    /** 
     * Calculates the vector we need to translate the camera for rendering.
     * 
     * @return vec3
     */
    Camera.prototype.updateTranslation = function() {
        var gl = this.context.renderer.getGLContext();

        // @see http://www.opengl.org/archives/resources/faq/technical/transformations.htm#tran0030
        // for explaination about the 0.375 correction
        this.translation[0] = gl.viewportWidth * this.zoom * 0.5 - this.position[0]; //- 0.375; 
        this.translation[1] = gl.viewportHeight * this.zoom * 0.5 - this.position[1]; // + 0.375;
    };

    /**
     * Sets the center of this camera to the point defined
     * and unsets getTrackedEntity()
     *
     * @param {vec3} position (z-axis is ignored)
     */
    Camera.prototype.setCenter = function(position) {
        
        this.trackedEntity = null;

        this.position[0] = position[0];
        this.position[1] = position[1];
        
        this.applyBounds();
        this.updateTranslation();

        this.fire('move', this.position);
    };

    /**
     * @return vec3
     */
    Camera.prototype.getCenter = function() {

        return this.position;
    };
    
    /**
     * Updates the center of this camera to match the followed entity, if 
     * the followed entity has moved since our last check
     */
    Camera.prototype.update = function() {
        
        // If we're following an entity...
        if (this.trackedEntity) {
        
            var epos = this.trackedEntity.getPosition();
               
            // Ignore z-order
            epos[2] = 0;
            
            // If the entity moved since last we checked, move the camera
            if (!vec3.equals(this.lastTrackedPosition, epos)) {
                
                vec3.set(epos, this.lastTrackedPosition);
        
                // Update camera position
                vec3.set(epos, this.position);

                //vec3.scale(this._position, this.this.zoom);
                
                this.applyBounds();
                this.updateTranslation();

                this.fire('move', this.position);
            }
        }
    };
    
    Camera.prototype.canvasVec3ToWorld = function(position) {
        var gl = this.context.renderer.getGLContext();

        // TODO: reduce these equations
        // TODO: Equations are screwed. Resolve. 
        position[0] = Math.floor((position[0] - gl.viewportWidth * 0.5) * this.zoom + this.position[0]);
        position[1] = Math.floor((position[1] - gl.viewportHeight * 0.5) * this.zoom + this.position[1]);
        //position[1] = Math.floor((gl.viewportHeight - position[1] - gl.viewportHeight * 0.5 ) * this.zoom + this.position[1]);
    
        // off by 400 300 when zoom = 0.5
        // off by 200 150 REAL pixels when zoom = 2  (0.5x zoom)
        // width * this.zoom 
    };

    /**
     * Keeps camera position within the bounding box, if specified.
     */
    Camera.prototype.applyBounds = function() {
        var gl = this.context.renderer.getGLContext();

        if (this.bounds[0] !== this.bounds[2] && this.bounds[1] !== this.bounds[3]) {
        
            var w = gl.viewportWidth * this.zoom;
            var h = gl.viewportHeight * this.zoom;
            
            var x = this.position[0] - w * 0.5;
            var y = this.position[1] - h * 0.5;

            if (x < this.bounds[0]) {
                x = this.bounds[0];
            }
            
            if (x + w >= this.bounds[2]) {
                x = this.bounds[2] - w;
            }
            
            if (y < this.bounds[1]) {
                y = this.bounds[1];
            }
                
            if (y + h >= this.bounds[3]) {
                y = this.bounds[3] - h;
            }
                
            this.position[0] = x + w * 0.5;
            this.position[1] = y + h * 0.5;
        }
    };

    return Camera;
});

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

define('Input',[
    'EventHooks',
    'Utility'
], function(EventHooks, Util) {
    var vec3 = Util.vec3;
    
    // Shim for KeyEvent. Currently supported in Firefox, but not Chrome. 
    // http://www.w3.org/TR/2001/WD-DOM-Level-3-Events-20010410/DOM3-Events.html#events-Events-KeyEvent
    if (typeof window.KeyEvent === "undefined") {
        window.KeyEvent = {
            DOM_VK_CANCEL: 3,
            DOM_VK_HELP: 6,
            DOM_VK_BACK_SPACE: 8,
            DOM_VK_TAB: 9,
            DOM_VK_CLEAR: 12,
            DOM_VK_RETURN: 13,
            DOM_VK_ENTER: 14,
            DOM_VK_SHIFT: 16,
            DOM_VK_CONTROL: 17,
            DOM_VK_ALT: 18,
            DOM_VK_PAUSE: 19,
            DOM_VK_CAPS_LOCK: 20,
            DOM_VK_ESCAPE: 27,
            DOM_VK_SPACE: 32,
            DOM_VK_PAGE_UP: 33,
            DOM_VK_PAGE_DOWN: 34,
            DOM_VK_END: 35,
            DOM_VK_HOME: 36,
            DOM_VK_LEFT: 37,
            DOM_VK_UP: 38,
            DOM_VK_RIGHT: 39,
            DOM_VK_DOWN: 40,
            DOM_VK_PRINTSCREEN: 44,
            DOM_VK_INSERT: 45,
            DOM_VK_DELETE: 46,
            DOM_VK_0: 48,
            DOM_VK_1: 49,
            DOM_VK_2: 50,
            DOM_VK_3: 51,
            DOM_VK_4: 52,
            DOM_VK_5: 53,
            DOM_VK_6: 54,
            DOM_VK_7: 55,
            DOM_VK_8: 56,
            DOM_VK_9: 57,
            DOM_VK_SEMICOLON: 59,
            DOM_VK_EQUALS: 61,
            DOM_VK_A: 65,
            DOM_VK_B: 66,
            DOM_VK_C: 67,
            DOM_VK_D: 68,
            DOM_VK_E: 69,
            DOM_VK_F: 70,
            DOM_VK_G: 71,
            DOM_VK_H: 72,
            DOM_VK_I: 73,
            DOM_VK_J: 74,
            DOM_VK_K: 75,
            DOM_VK_L: 76,
            DOM_VK_M: 77,
            DOM_VK_N: 78,
            DOM_VK_O: 79,
            DOM_VK_P: 80,
            DOM_VK_Q: 81,
            DOM_VK_R: 82,
            DOM_VK_S: 83,
            DOM_VK_T: 84,
            DOM_VK_U: 85,
            DOM_VK_V: 86,
            DOM_VK_W: 87,
            DOM_VK_X: 88,
            DOM_VK_Y: 89,
            DOM_VK_Z: 90,
            DOM_VK_CONTEXT_MENU: 93,
            DOM_VK_NUMPAD0: 96,
            DOM_VK_NUMPAD1: 97,
            DOM_VK_NUMPAD2: 98,
            DOM_VK_NUMPAD3: 99,
            DOM_VK_NUMPAD4: 100,
            DOM_VK_NUMPAD5: 101,
            DOM_VK_NUMPAD6: 102,
            DOM_VK_NUMPAD7: 103,
            DOM_VK_NUMPAD8: 104,
            DOM_VK_NUMPAD9: 105,
            DOM_VK_MULTIPLY: 106,
            DOM_VK_ADD: 107,
            DOM_VK_SEPARATOR: 108,
            DOM_VK_SUBTRACT: 109,
            DOM_VK_DECIMAL: 110,
            DOM_VK_DIVIDE: 111,
            DOM_VK_F1: 112,
            DOM_VK_F2: 113,
            DOM_VK_F3: 114,
            DOM_VK_F4: 115,
            DOM_VK_F5: 116,
            DOM_VK_F6: 117,
            DOM_VK_F7: 118,
            DOM_VK_F8: 119,
            DOM_VK_F9: 120,
            DOM_VK_F10: 121,
            DOM_VK_F11: 122,
            DOM_VK_F12: 123,
            DOM_VK_F13: 124,
            DOM_VK_F14: 125,
            DOM_VK_F15: 126,
            DOM_VK_F16: 127,
            DOM_VK_F17: 128,
            DOM_VK_F18: 129,
            DOM_VK_F19: 130,
            DOM_VK_F20: 131,
            DOM_VK_F21: 132,
            DOM_VK_F22: 133,
            DOM_VK_F23: 134,
            DOM_VK_F24: 135,
            DOM_VK_NUM_LOCK: 144,
            DOM_VK_SCROLL_LOCK: 145,
            DOM_VK_COMMA: 188,
            DOM_VK_PERIOD: 190,
            DOM_VK_SLASH: 191,
            DOM_VK_BACK_QUOTE: 192,
            DOM_VK_OPEN_BRACKET: 219,
            DOM_VK_BACK_SLASH: 220,
            DOM_VK_CLOSE_BRACKET: 221,
            DOM_VK_QUOTE: 222,
            DOM_VK_META: 224
        };
    }

    /** 
     * Manager for application input, will translate keyboard/mouse events
     * to the GL canvas into hookable events 
     */
    function Input(context, options) {
        // jshint unused:false
        // temp hint for options
        Util.extend(this, EventHooks);

        this.pressedKeys = [];
        this.cursorPosition = vec3.create();
        this.context = context;
        this.canvasFocus = false;

        var canvas = context.renderer.getCanvas();

        // Allow the canvas to detect focus/blur events
        canvas.setAttribute('tabindex', -1);
        
        // Rebind methods in a way that forces `this` to scope to Input.
        // This way we can easily bind and unbind them to the DOM
        this.onCanvasFocus = this.onCanvasFocus.bind(this);
        this.onCanvasBlur = this.onCanvasBlur.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onWindowFocus = this.onWindowFocus.bind(this);
        this.onWindowBlur = this.onWindowBlur.bind(this);

        // TODO: window versus document?
        // TODO: There's a reason I bound mousedown to canvas and not document. Why?
        canvas.addEventListener('mousedown', this.onMouseDown);
        canvas.addEventListener('focus', this.onCanvasFocus);
        canvas.addEventListener('blur', this.onCanvasBlur);

        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('mousemove', this.onMouseMove);

        window.addEventListener('keyup', this.onKeyUp);
        window.addEventListener('keydown', this.onKeyDown);

        // TODO: Not firing?
        // Check out http://www.quirksmode.org/dom/events/blurfocus.html
        // May need to tabindex the window, but that's kinda gross. 
        window.onfocus = this.onWindowFocus; // addEventListener('focus', this.onWindowFocus);
        window.onblur = this.onWindowBlur; // addEventListener('blur', this.onWindowBlur);
    }

    Input.prototype.onKeyDown = function(e) {
        e = e || window.event;

        this.pressedKeys[e.keyCode] = true;
        
        this.fire('keydown', e);
        
        // Override pageup/pagedown events
        if (e.keyCode === window.KeyEvent.DOM_VK_PAGE_UP ||
            e.keyCode === window.KeyEvent.DOM_VK_PAGE_DOWN) {
            
            return false;
        }
    };

    Input.prototype.onKeyUp = function(e) {
        e = e || window.event;

        this.pressedKeys[e.keyCode] = false;
        
        this.fire('keyup', e);
    };

    Input.prototype.onMouseDown = function(e) {
        e = e || window.event;
        this.updateCursorPosition(e);
        
        this.fire('mousedown', e);
    };

    Input.prototype.onMouseUp = function(e) {
        e = e || window.event;
        this.updateCursorPosition(e);
        
        this.fire('mouseup', e);
    };
    
    Input.prototype.onMouseMove = function(e) {
        e = e || window.event;
        
        // Since this is a frequent event, it won't be fired to listeners just yet
        // Instead, they should set up timers and query when needed.
        this.updateCursorPosition(e);
    };
    
    Input.prototype.updateCursorPosition = function(e) {
        var canvas = this.context.renderer.getCanvas();
        var r = canvas.getBoundingClientRect();
        
        this.cursorPosition[0] = e.clientX - r.left;
        this.cursorPosition[1] = e.clientY - r.top;
    };
    
    /**
     * Canvas loses focus, kill inputs and certain events
     */
    Input.prototype.onCanvasBlur = function() {
        
        // Cancel any keypresses, since we won't pick up a keyup event 
        this.pressedKeys.length = 0;
        this.canvasFocus = false;
        
        this.fire('canvasblur');
    };

    /**
     * Canvas regained focus, reactivate inputs and certain events
     */
    Input.prototype.onCanvasFocus = function() {
    
        this.canvasFocus = true;
        this.fire('canvasfocus');
    };
    
    /**
     * Window loses focus, kill inputs and certain events
     */
    Input.prototype.onWindowBlur = function() {
    
        // Cancel any keypresses, since we won't pick up a keyup event 
        this.pressedKeys.length = 0;
        this.canvasFocus = false;
        
        this.fire('windowblur');
    };

    /**
     * Window regained focus, reactivate inputs and certain events
     */
    Input.prototype.onWindowFocus = function() {

        this.fire('windowfocus');
    };
    
    /** Returns true if the specified key is identified as being pressed */
    Input.prototype.isKeyDown = function(keycode) {

        return this.pressedKeys[keycode] === true;
    };
    
    /** Returns true if our canvas/GL context has input focus */
    Input.prototype.hasFocus = function() {

        return this.canvasFocus;
    };
    
    /**
     * Return a vec3 representing the cursor's current position on the canvas.
     *
     * @return {vec3} 
     */
    Input.prototype.getCursorPosition = function() {
        // TODO: Clip to the (0, 0) -> (gl.viewportWidth,gl.viewportHeight) 
        // as it doesn't currently.
        return vec3.create(this.cursorPosition);
    };

    return Input;
});

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

define('Enum',[
    'Utility'
], function(Util) {
    var vec3 = Util.vec3;
    
    /**
     * Common enumerations accessed throughout modules.
     */
    var Enum = {
        Direction : {
            // Numerics match keypad keys.
            NONE : 0,
            NORTH : 8,
            SOUTH : 2,
            EAST : 6,
            WEST: 4,
            
            NORTHEAST : 9,
            NORTHWEST : 7,
            SOUTHEAST : 3,
            SOUTHWEST : 1,

            /**
             * Converts an Enum.Direction to a character that could be serialized.
             *
             * @param {Enum.Direction} direction to convert
             *
             * @return {string}
             */
            toChar : function(direction) {
                 if (direction > 0 && direction < 10) {
                    return direction.toString();
                } else {
                    return '0';
                }
            },

            /**
             * Returns a direction if the character can be translated to 
             * a direction constant. If it cannot, will return Direction.NONE
             *
             * @return {Enum.Direction}
             */
            fromChar : function(ch) {
                var direction = parseInt(ch);
                if (direction > 0 && direction < 10) {
                    return direction;
                } else {
                    return this.NONE;
                }
            },

            /**
             * Returns a normalized vec3 of this direction.
             *
             * @param {Enum.Direction} direction
             *
             * @return {vec3}
             */
            toVec3 : function(direction) {
                var v = [0, 0];

                switch (direction) {
                    case this.NORTH: v = [0, -1]; break;
                    case this.NORTHEAST: v = [1, -1]; break;
                    case this.NORTHWEST: v = [-1, -1]; break;
                    case this.SOUTH: v = [0, 1]; break;
                    case this.SOUTHEAST: v = [1, 1]; break;
                    case this.SOUTHWEST: v = [-1, 1]; break;
                    case this.EAST: v = [1, 0]; break;
                    case this.WEST: v = [-1, 0]; break;
                }

                v[2] = 0;
                return vec3.create(v);
            },

            /**
             * Returns a direction from any arbitrary vec3.
             *
             * @param {vec3} vec
             *
             * @return {Enum.Direction}
             */
            fromVec3 : function(vec) {
                var normal = vec3.create(),
                    dir = this.NONE;

                vec3.normalize(vec, normal);

                if (normal[1] < 0) {
                    if (normal[0] > 0) {
                        dir = Enum.Direction.NORTHEAST;
                    } else if (normal[0] < 0) {
                        dir = Enum.Direction.NORTHWEST;
                    } else {
                        dir = Enum.Direction.NORTH;
                    }
                } else if (normal[1] > 0) {
                    if (normal[0] > 0) {
                        dir = Enum.Direction.SOUTHEAST;
                    } else if (normal[0] < 0) {
                        dir = Enum.Direction.SOUTHWEST;
                    } else {
                        dir = Enum.Direction.SOUTH;
                    }
                } else if (normal[0] > 0) {
                    dir = Enum.Direction.EAST;
                } else if (normal[0] < 0) {
                    dir = Enum.Direction.WEST;
                }

                return dir;
            }
        },

        Speed : {
            WALK : 4,
            RUN : 8
        },

        Action : {
            IDLE : 0,
            MOVE : 1,
            SIT : 2,
            JUMP : 3
        }
    };

    if (Object.freeze) {
        Object.freeze(Enum);
    }

    return Enum;
});

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

define('entity/Entity',[
    'EventHooks',
    'Utility'
], function(EventHooks, Util) {
    var vec3 = Util.vec3;

    /**
     * Base model for all entities in the world
     */
    function Entity(context, properties) {
        Util.extend(this, EventHooks);

        this.id = properties.id || null;
        this.isRenderable = false;
        this.visible = true; // Whether or not we should draw this entity for specific frames
        this.position = vec3.create(); // entity position, in world space
        this.offset = vec3.create(); // offset of translation from position
        this.translation = vec3.create(); // top left corner of the entity
        this.context = context;

        this.children = [];
        this.parent = null;
    }

    Entity.prototype.destroy = function() {

        // Fire a destroy event to any listeners 
        this.fire('destroy');

        // If we have a parent, detach ourselves from it
        if (this.parent) {
            this.parent.removeChild(this);
        }

        // Destroy children as well
        if (this.children) {
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].setParent(null);
                this.children[i].destroy();
            }
        }
        
        // Nuke the entity itself
        this.context.remove(this);
    };

    /**
     * Add a new entity as a child to this. Children entities
     * have their position always relative to the parent. Whereas
     * translation is their actual world position. 
     */
    Entity.prototype.addChild = function(entity) {
        this.children.push(entity);
        entity.setParent(this);
        this.fire('add', entity);
    };

    Entity.prototype.removeChild = function(entity) {
        var index = this.children.indexOf(entity);
        if (~index) {
            this.children.splice(index, 1);
            entity.setParent(null);
            this.fire('remove', entity);
        }
    };

    Entity.prototype.setParent = function(entity) {
        this.parent = entity;
        this.fire('parent', entity);
    };

    /**
     * Returns a new vec3 representing our position in local space.
     * If this entity does not have a parent, this is equivalent to
     * our position in world space. Otherwise, it is relative to 
     * the parent's position.
     */
    Entity.prototype.getPosition = function() {

        return vec3.create(this.position);
    };

    /** 
     * Returns a new vec3 representing our position in world space.
     *
     * @return {vec3} 
     */
    Entity.prototype.getWorldPosition = function() {

        var pos = this.getPosition();
        if (this.parent) {
            vec3.add(pos, this.parent.getWorldPosition());
        }

        return pos;
    };

    /**
     * Set the entity's position in local space. 
     * Accepts either an (x,y) pair or an (x,y,z) 
     * to also specify the z-order.
     *
     * @param {vec3} position
     */
    Entity.prototype.setPosition = function(position) {

        this.position[0] = Math.floor(position[0]);
        this.position[1] = Math.floor(position[1]);

        if (position.length > 2) {
            this.position[2] = Math.floor(position[2]);
        }

        this.updateTranslation();
    };

    Entity.prototype.getOffset = function() {
        return this.offset;
    };

    /**
     * Set the offset coordinates (in pixels) that our
     *  image renders from our position in local space. 
     *
     * @param {vec3} offset
     */
    Entity.prototype.setOffset = function(offset) {
        this.offset[0] = Math.floor(offset[0]);
        this.offset[1] = Math.floor(offset[1]);

        this.updateTranslation();
    };

    /**
     * @param {rect} r
     */
    Entity.prototype.getBoundingBox = function(r) {
        r[0] = 0;
        r[1] = 0;
        r[2] = 0;
        r[3] = 0;
    };

    Entity.prototype.getRenderable = function() {
        return this.isRenderable;
    };

    Entity.prototype.setRenderable = function(b) {
        this.isRenderable = b;
    };

    Entity.prototype.updateTranslation = function() {
        
        // update world render translation appropriately
        var pos = this.getWorldPosition();
        
        vec3.subtract(pos, this.offset);

        // If translation changes, update translation of children as well
        if (!vec3.equals(pos, this.translation)) {
            vec3.set(pos, this.translation);

            for (var i = 0; i < this.children.length; i++) {
                this.children[i].updateTranslation();
            }
        }
    };

    /**
     * @return {boolean} 
     */
    Entity.prototype.collides = function(r) {
        // jshint unused: false
    };

    return Entity;
});

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

define('resource/Resource',[
    'EventHooks',
    'Utility'
], function(EventHooks, Util) {

    /**
     * Base model for all resources
     */
    function Resource(context, properties) {
        Util.extend(this, EventHooks);

        if (!this.validateMetadata(properties)) {
            // TODO: better error handling
            throw new Error('Malformed resource metadata');
        }

        this.shareable = true;
        this.context = context;
        this.properties = properties;
    }

    /**
     * Returns true if the resource has fully loaded.
     *
     * @return {boolean}
     */
    Resource.prototype.isLoaded = function() {
        throw Error('Method must be implemented by an inherited resource type.');
    };

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return {boolean}
     */
    Resource.prototype.validateMetadata = function(metadata) {
        // jshint unused: false
        throw Error('Method must be implemetned by an inherited resource type.');
    };

    return Resource;
});

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

define('resource/Animation',[
    'resource/Resource',
    'Utility',
    'Timer'
], function(Resource, Util, Timer) {
    var rect = Util.rect;

    // Minimum allowed display time for each frame.
    var MINIMUM_FRAME_MS = 100;

    /** 
     * Definition of an animation/spritesheet. 
     * Handles setting framesets, animation timing, looping, etc. 
     */
    function Animation(context, properties) {
        Resource.call(this, context, properties);

        this.shareable = false; // CANNOT be cached/reused as 
                                // each instance has a unique state.
        this.url = properties.url;
        this.width = properties.width;
        this.height = properties.height;
        this.autoplay = !!properties.autoplay; // Optional, default false
        this.keyframes = properties.keyframes;
        this.clip = rect.create();
        this.keyframe = null; // So that setKeyframe() to 'undefined' forces default.

        // Initialize keyframe-tracking properties and reset
        this.setKeyframe();

        // Load an image resource. Note that we load this 
        // as a sub-resource so that we can load cached images
        // if another Animation instance already uses the same source.
        this.image = context.resources.load({
            type: 'Image',
            url: properties.url,
            width: properties.width,
            height: properties.height,
            shader: properties.shader,
            fitToTexture: false
        });

        // Create an animation timer for this animation
        this.onTimer = this.onTimer.bind(this);
        this.animateTimer = new Timer(this.onTimer, this.delay);

        this.onImageReady = this.onImageReady.bind(this);
        this.onImageError = this.onImageError.bind(this);

        // If we're still loading this image, bind events and wait
        if (!this.image.isLoaded()) {
            this.image.bind('onload', this.onImageReady);
            this.image.bind('onerror', this.onImageError);
        } else {
            this.onImageReady();
        }
    }

    Animation.prototype = Object.create(Resource.prototype);
    Animation.prototype.constructor = Animation;

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return {boolean}
     */
    Animation.prototype.validateMetadata = function(metadata) {

        // TODO: More validation rules!
        var requiredKeys = [
            'width', 'height', 'url', 'keyframes'
        ];
        
        for (var i = 0; i < requiredKeys.length; i++) {
            if (!metadata.hasOwnProperty(requiredKeys[i])) {
                return false;
            }
        }

        return true;
    };

    /** 
     * Increment which frame of the current animation is rendered.
     *
     * @param {boolean} forceLoop even if the frameset set loop to false
     */
    Animation.prototype.next = function(forceLoop) {
        
        // If our animation somehow lost the keyframe, play default
        if (!this.keyframes.hasOwnProperty(this.keyframe)) {
            this.setKeyframe();
        }

        // if we hit the end of the animation, loop (if desired)
        if (this.keyframes[this.keyframe].frames.length <= this.index + 1) {
            if (this.keyframes[this.keyframe].loop || forceLoop) {
                this.index = 0;
            } else {
                this.index -= 2;
            }
        }
        
        // Get the frame index (of the source image) to render
        this.frame = this.keyframes[this.keyframe].frames[this.index];
        //console.log('frame ' + this.frame + ' on ' + Date.now());

        // pull out the delay for the next frame
        this.delay = this.keyframes[this.keyframe].frames[this.index+1];

        // Limit frame display time so nobody can set a ridiculously short delay
        this.delay = Math.max(this.delay, MINIMUM_FRAME_MS);

        // pull out the frame number for the next frame
        this.index += 2;

        this.updateTextureClip();
    };

    /**
     * Set the active keyframe and reset the animation from the beginning.
     * This method will try to gracefully degrade down to something that works
     *
     * @param {string} key to apply 
     * @param {boolean} force true will ignore a match with the current keyframe
     */
    Animation.prototype.setKeyframe = function(key) {

        // If they change the keyframe, or force a set, try to set.
        if (this.keyframe !== key) {

            if (key && this.keyframes.hasOwnProperty(key)) {
                this.keyframe = key;
                this.reset();
            } else {
                // Default active keyframe to the first one found
                this.keyframe = Object.keys(this.keyframes)[0];
            }
        }
    };

    /**
     * Returns true if the input keyframe key exists in this animation.
     *
     * @param {string} key
     *
     * @return {boolean}
     */
    Animation.prototype.hasKeyframe = function(key) {

        return this.keyframes.hasOwnProperty(key);
    };

    /**
     * Reset the current animation to the beginning of the frameset.
     */
    Animation.prototype.reset = function() {

        this.index = 0;
        this.frame = 0;
        this.next(false);
    };

    /** 
     * Recalculate the source rect of our texture based on the current row/frame 
     */
    Animation.prototype.updateTextureClip = function() {

        if (this.image) {
            var framesPerRow = Math.floor(this.image.getTextureWidth() / this.width);
            
            var x = this.frame % framesPerRow;
            var y = (this.frame - x) / framesPerRow;

            //var x = this.getWidth() * this.frame;
            //var y = this.getHeight() * this.currentRow;
            
            // Update texture clip
            this.clip[0] = x * this.width;
            this.clip[1] = y * this.height;
        }
    };

    /**
     * Returns true if the underlying Image resource has fully loaded.
     *
     * @return {boolean}
     */
    Animation.prototype.isLoaded = function() {

        return this.image.isLoaded();
    };

    Animation.prototype.onImageReady = function() {
        this.reset();

        if (this.autoplay) {
            this.play();
        }

        // Notify listeners
        this.fire('onload', this);
    };

    Animation.prototype.onImageError = function() {
        // TODO: Stuff!
        this.fire('onerror', this);
    };

    Animation.prototype.render = function(position) {

        // Just render a clip of our source image
        if (this.image) {
            this.image.render(position, 0.0, this.clip);
        }
    };

    Animation.prototype.onTimer = function(timer) {
        
        this.next(false);

        // Update timer interval to the next frames display time
        timer.interval = this.delay;

        // TODO: Probably not use Timers engine. The whole deal is that
        // Timers is steady, so if there's a delay in processing, it'll
        // re-run the callback constantly until it catches up. Animations
        // don't matter, and we can skip playback of a few frames. Although
        // I guess it technically doesn't know how many to skip, and this
        // would prevent slowdown and instead actually skip.
    };

    /**
     * Start automatic playback of the active keyframe animation.
     */
    Animation.prototype.play = function() {
        this.animateTimer.interval = this.delay;
        this.animateTimer.start();
    };

    /**
     * Stop playback of the current keyframe animation.
     */
    Animation.prototype.stop = function() {

        this.animateTimer.stop();
    };
    
    Animation.prototype.isPlaying = function() {

        return this.animateTimer.running;
    };

    return Animation;
});

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

define('entity/Actor',[
    'Enum',
    'Utility',
    'Timer',
    'entity/Entity',
    'resource/Animation'
], function(Enum, Util, Timer, Entity, Animation) {
    var vec3 = Util.vec3,
        rect = Util.rect;

    var MOVEMENT_DISTANCE = 16;

    // TODO: Movement speed is too dependent on this value
    var THINK_INTERVAL_MS = 50; 

    function Actor(context, properties) {
        Entity.call(this, context, properties);
        
        this.isRenderable = true; // Add this entity to the render queue

        this.step = 0;
        this.name = '';
        this.action = properties.action || Enum.Action.IDLE;
        this.speed = properties.speed || Enum.Speed.WALK;
        this.direction = properties.direction || Enum.Direction.SOUTH;
        this.buffer = '';

        this.destination = vec3.create();
        this.directionNormal = vec3.create();
        
        this.setPosition(properties.position || [0, 0, 0]);
        this.setName(properties.name || '');
        
        // Create a think timer for this avatar
        this.onThink = this.onThink.bind(this);
        this.thinkTimer = new Timer(this.onThink, THINK_INTERVAL_MS);
        this.thinkTimer.start();

        if (properties.hasOwnProperty('avatar') && 
            Object.keys(properties.avatar).length > 0) {

            this.setAvatar(properties.avatar);
        }
    }

    Actor.prototype = Object.create(Entity.prototype);
    Actor.prototype.constructor = Actor;

    Actor.prototype.destroy = function() {
        if (this.thinkTimer) {
            this.thinkTimer.stop();
        }

        Entity.prototype.destroy.call(this);
    };

    /**
     * Set the display name of this Actor. This triggers a `name`
     * event that can be handled by all plugins as appropriate
     * (to update a nameplate, or send to the chatbox, etc).
     * 
     * @param {string} name to change to
     */
    Actor.prototype.setName = function(name) {
        this.name = name;
        this.fire('name', this);
    };

    /** 
     * Set our avatar from JSON properties passed into
     * an underlying Animation resource. 
     *
     * @param {object} properties for an Animation
     */
    Actor.prototype.setAvatar = function(properties) {
        var avatar = this.context.resources.load(properties);

        console.log('Set Avatar for ' + this.name);
        
        // If it needs to load external resources, hook for errors
        if (!avatar.isLoaded()) {
        
            // Bind and wait for the image to be loaded
            var self = this;
            avatar
                .bind('onload', function() {
                    self.setAvatarFromResource(avatar);
                })
                .bind('onerror', function() {
                    // TODO: do something, revert, load default, etc.
                    throw new Error('Failed to load prop image for [' + self.id + ']');
                });
        } else {
            // load in
            this.setAvatarFromResource(avatar);
        }
    };

    /**
     * Sets this.avatar to the new Animation or Image object, and reconfigures
     * the actor's properties as appropriate (resize, animation reset, etc)
     *
     * @param {Animation|Image} resource to use as an avatar
     */
    Actor.prototype.setAvatarFromResource = function(resource) {
        this.avatar = resource;
        
        this.offset[0] = this.avatar.width * 0.5;
        this.offset[1] = this.avatar.height;
        this.updateTranslation();
        
        this.recalculateAvatarRow();

        this.fire('avatar', this);
    };

    /**
     * Adds actions to our buffer to be processed by the actor.
     *
     * @param {string} buffer content to append to the current buffer
     */
    Actor.prototype.addToActionBuffer = function(buffer) {
        this.fire('add.buffer', buffer);    
        this.buffer += buffer;
    };

    /**
     * Send a `say` message to everyone. This triggers a `say` event
     * event that can be handled by all plugins as appropriate
     * (to create word bubbles, or dialog, etc).
     *
     * @param {string} message to send
     */
    Actor.prototype.say = function(message) {

        this.fire('say', {
            entity: this,
            message: message
        });
    };

    Actor.prototype.render = function() {

        if (this.avatar) {
            this.avatar.render(this.translation, 0.0);
        }
    };

    /**
     * @param {Enum.Direction} direction to test 
     * @return {boolean}
     */
    Actor.prototype.canMove = function(direction) {

        // TODO: test the points between current location and target (x, y)
        // For now, it assumes the distance is close enough to be negligible
        
        var normal = Enum.Direction.toVec3(direction);
        vec3.scale(normal, MOVEMENT_DISTANCE);

        // Collision rectangle is a 16x16 (@todo generate into this.collisions?)
        // TODO: optimize rect creation
        var r = rect.create([
                    this.position[0] + normal[0] - 4,
                    this.position[1] + normal[1] - 8,
                    8, 8
                ]);
        
        return !(this.context.isRectBlocked(r, this));
    };

    /** 
     * Returns true if our current position does not match up with 
     *  our current destination
     *  
     * @return {boolean}
     */
    Actor.prototype.isMoving = function() {

        var pos = this.getPosition();

        // TODO: referencing action buffer???
        return (pos[0] !== this.destination[0] ||
                pos[1] !== this.destination[1]);
    };

    /**
     * @param {rect} r
     */
    Actor.prototype.getBoundingBox = function(r) {
        // TODO: factor in rotations and scaling
        
        var pos = this.position;

        if (this.avatar) {
            r[0] = pos[0] - this.offset[0];
            r[1] = pos[1] - this.offset[1];
            r[2] = this.avatar.width;
            r[3] = this.avatar.height;
        } else {
            r[0] = pos[0] - this.offset[0];
            r[1] = pos[1] - this.offset[1];
            r[2] = 0;
            r[3] = 0;
        }
    };

    /**
     * Set the actor's position. Accepts either an (x,y) pair
     * or an (x,y,z) to also specify the z-order. This will
     * also stop any automatic walking to a destination. 
     *
     * @param {vec3} position
     */
    Actor.prototype.setPosition = function(position) {
        Entity.prototype.setPosition.call(this, position);

        vec3.set(this.position, this.destination);
        this.fire('move', this.position);
    };

    /** 
     * Set the actor's destination position that they will automatically
     * walk to. Accepts an (x,y) pair. TODO: Support z-order changing.
     *
     * @param {vec3} destination
     */
    Actor.prototype.setDestination = function(destination) {
        this.destination[0] = Math.floor(destination[0]);
        this.destination[1] = Math.floor(destination[1]);
    };

    /** 
     * Sets our current action (idle, sit, etc) and updates the avatar.
     *
     * @param {Enum.Action} action
     */
    Actor.prototype.setAction = function(action) { 
        this.action = action;
        this.recalculateAvatarRow();
    };

    /** 
     * Sets our current movement speed (walk/run).
     *
     * @param {Enum.Speed} speed
     */
    Actor.prototype.setSpeed = function(speed) {

        this.speed = speed;
    };

    /**
     * Sets our actors "close enough" direction, and updates the avatar
     * 
     * @param {Enum.Direction} dir
     */
    Actor.prototype.setDirection = function(dir) {
        this.direction = dir;
        this.recalculateAvatarRow();
    };

    /**
     * Shortcut to set the entire actor state from a 5-tuple
     *
     * @param {array} state 5-tuple
     */
    Actor.prototype.setState = function(state) {
        if (!Array.isArray(state) || state.length < 5) {
            throw Error('Invalid 5-tuple for Actor.setState()');
        }

        this.setPosition(state.splice(0, 3));
        this.setDirection(state[0]);
        this.setAction(state[1]);
    };

    /**
     * Retrieve a 5-tuple representing the actor state 
     * (x, y, z, direction, action)
     *
     * @return {array}
     */
    Actor.prototype.getState = function() {
        return [
            this.position[0], 
            this.position[1], 
            this.position[2],
            this.direction,
            this.action
        ];
    };
    
    Actor.prototype.onThink = function() {

        // Check for new actions on our buffer
        if (!this.isMoving()) {
            this.processActionBuffer();
        }

        // If we were moving, or new data on the buffer made us
        // start moving, process the actual movement. 
        if (this.isMoving()) {
            // Stop autoplay for the avatar, we'll let stepping handle it.
            if (this.avatar instanceof Animation) {
                this.avatar.stop();    
            }
            this.processMovement();
        } else {

            // Go into an idle stance if not already
            if (this.action === Enum.Action.MOVE) {
                this.setAction(Enum.Action.IDLE);
                
                // Start autoplaying the avatar again, if it's animated
                if (this.avatar instanceof Animation) {
                    this.avatar.play();
                }
            }
        }
    };

    /**
     * Walks through the buffer and perform the next action.
     */
    Actor.prototype.processActionBuffer = function() {
        
        var c, recheck, eraseCount, dir;

        if (this.buffer) {
            do {
            
                c = this.buffer.charAt(0);
                dir = Enum.Direction.fromChar(c);
                recheck = false;
                eraseCount = 1;
            
                if (dir !== Enum.Direction.NONE) { // moving in direction
                    this.stepInDirection(dir);
                    
                } else if (c === 'w') { // change speed to walk

                    this.setSpeed(Enum.Speed.WALK);
                    recheck = true;
                    
                } else if (c === 'r') { // change speed to run

                    this.setSpeed(Enum.Speed.RUN);
                    recheck = true;
                    
                } else if (c === 's') { // sit + 1 char for direction
                    
                    if (this.buffer.length > 1) {
                        dir = Enum.Direction.fromChar(this.buffer.charAt(1));
                        this.setDirection(dir);
                        eraseCount++;
                    }

                    this.setAction(Enum.Action.SIT);
                    
                } else if (c === 't') { // stand/turn + 1 char for direction
                    
                    if (this.buffer.length > 1) {
                        dir = Enum.Direction.fromChar(this.buffer.charAt(1));
                        this.setDirection(dir);
                        eraseCount++;
                    }

                    this.setAction(Enum.Action.IDLE);
                }

                this.buffer = this.buffer.substr(eraseCount);

            } while (recheck && this.buffer);
        }
    };

    /** 
     * Moves our actor in order to match up our current position with our destination
     */
    Actor.prototype.processMovement = function() {

        var position = this.getPosition();
        var direction = this.directionNormal;

        // Get the distance between our position and destination
        vec3.subtract(this.destination, position, direction);
        var distance = vec3.length(direction);
        
        // Create a normal vector from position to destination
        vec3.normalize(direction);
        
        // console.log('Distance: ' + distance);
        
        // If we have less distance to cover, just move the difference
        if (distance < this.speed) {
            vec3.scale(direction, distance);
            distance = 0;
        } else {
            vec3.scale(direction, this.speed);
            distance -= this.speed;
        }
        
        //console.log('Adjusted Distance: ' + distance);
        //console.log(direction);

        if (this.action !== Enum.Action.MOVE) {
            this.setAction(Enum.Action.MOVE);
        }
        
        if (distance > 0) { // Move toward destination
        
            direction[0] = Math.ceil(direction[0]);
            direction[1] = Math.ceil(direction[1]);
        
            vec3.add(position, direction);
            Entity.prototype.setPosition.call(this, position);
            
        } else { // close enough, just set
            
            vec3.set(this.destination, position);
            Entity.prototype.setPosition.call(this, position);
        }
        
        // If our relative direction changed, make sure we reflect that
        var d = Enum.Direction.fromVec3(direction);

        if (d !== this.direction) {
            this.setDirection(d);
        }

        // Animate the step
        // TODO: better logic here to delay step animations to every-other distance
        if (this.step < 2) {
            this.step++;
        } else {
            this.step = 0;
            
            if (this.avatar instanceof Animation) {
                this.avatar.next(true);
            }
            
            // Get the map to queue a resort of objects
            this.context.resort();
        }
        
        this.fire('move', this.position);
    };

    /** 
     * Determines what row to render based on a translation of our 
     * direction and current action.
     */
    Actor.prototype.recalculateAvatarRow = function() {
        var row;

        // If it's not an Animation, don't worry about this
        if (!(this.avatar instanceof Animation)) {
            return;
        }
        
        if (this.direction === Enum.Direction.NORTH ||
            this.direction === Enum.Direction.NORTHEAST ||
            this.direction === Enum.Direction.NORTHWEST) {

            row = 8;
        } else if (this.direction === Enum.Direction.SOUTH ||
            this.direction === Enum.Direction.SOUTHEAST ||
            this.direction === Enum.Direction.SOUTHWEST) {

            row = 2;
        } else if (this.direction === Enum.Direction.WEST) {

            row = 4;
        } else if (this.direction === Enum.Direction.EAST) {

            row = 6;
        } else { // default to south again, just in case

            row = 2;
        }

        var frame = 'stop_';

        if (this.action === Enum.Action.MOVE || !this.avatar.hasKeyframe(frame + row)) {
            frame = 'move_';
        }
        
        if (this.action === Enum.Action.SIT) {
            frame = 'act_';
            if (!this.avatar.hasKeyframe(frame + row)) {
                frame = 'move_';
            }
        }
        
        // Still doesn't exist, default to move_2
        if (!this.avatar.hasKeyframe(frame + row)) {
            frame = 'move_';
            row = '2';
        }

        //console.log('row ' + frame + row + ' ' + Date.now());
        this.avatar.setKeyframe(frame + row);
    };

    Actor.prototype.stepInDirection = function(direction) {
        
        vec3.set(this.getPosition(), this.destination);
        
        var normal = Enum.Direction.toVec3(direction);
        vec3.add(this.destination, vec3.scale(normal, MOVEMENT_DISTANCE));
    };

    return Actor;
});

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

define('Player',[
    'entity/Actor',
    'Enum',
    'Timer'
], function(Actor, Enum, Timer) {
     
    // Duration we allow the action buffer to fill up before
    // sending to the network. Remote clients will see our 
    // actions with roughly the same delay specified here. 
    var SEND_BUFFER_INTERVAL_MS = 2000;

    function Player(context, properties) {
        this.networkBuffer = '';

        // If our context has a network connection, start a timer
        // to transmit our network buffer
        // TODO: Player is initialized before network, so this will
        // always be false. But I don't want player after network
        // because we need to guarantee Player is setup for auth.
        // Better idea would be to just integrate into onThink,
        // rather than using a new timer. 
        if (context.network) {
            this.onBufferTimer = this.onBufferTimer.bind(this);
            this.bufferTimer = new Timer(this.onBufferTimer, SEND_BUFFER_INTERVAL_MS);
            this.bufferTimer.start();

            // If we are looking to join a server, cache the player avatar
            // and don't load it until the server gives the go-ahead.
            this.avatarForNetwork = properties.avatar;
            delete properties.avatar; 
        }

        Actor.call(this, context, properties);
    }

    Player.prototype = Object.create(Actor.prototype);
    Player.prototype.constructor = Player;

    Player.prototype.destroy = function() {
        if (this.bufferTimer) {
            this.bufferTimer.stop();
        }

        Actor.prototype.destroy.call(this);
    };

    Player.prototype.onThink = function() {

        this.checkInput();
        Actor.prototype.onThink.call(this);
    };

    Player.prototype.onBufferTimer = function() {

        if (this.networkBuffer.length > 0) {

            // Serialize our current state into 5-tuple
            var state = [
                this.position[0],
                this.position[1],
                this.position[2],
                this.direction,
                this.action
            ];

            this.context.network.emit('move', {
                buffer: this.networkBuffer,
                state: state
            });

            // Clear buffer to load another payload
            this.networkBuffer = '';
        }
    };

    Player.prototype.checkInput = function() {
        var input = this.context.input,
            cam = this.context.camera,
            buffer = '',
            dir = Enum.Direction.NONE,
            north, east, south, west;
        
        // Don't process additional actions if we are still moving
        // or the context is out of focus
        if (this.isMoving() || !input.hasFocus()) {
            return;
        }

        // Handle zoom (@todo move, this is just for testing)
        if (input.isKeyDown(window.KeyEvent.DOM_VK_PAGE_UP)) { // pgup: zoom in
        
            if (cam.zoom > 0.2) {
                cam.zoom -= 0.1;
                cam.updateTranslation();
            }

        } else if (input.isKeyDown(window.KeyEvent.DOM_VK_PAGE_DOWN)) { // pgdown: zoom out
        
            if (cam.zoom < 2.0) {
                cam.zoom += 0.1;
                cam.updateTranslation();
            }

        } else if (input.isKeyDown(window.KeyEvent.DOM_VK_HOME)) { // home: reset zoom
        
            cam.zoom = 1.0;
            cam.updateTranslation();
        }
        
        // Pull desired direction of movement
        // TODO: Rebindable settings!
        north = input.isKeyDown(window.KeyEvent.DOM_VK_W) || input.isKeyDown(window.KeyEvent.DOM_VK_UP);
        south = input.isKeyDown(window.KeyEvent.DOM_VK_S) || input.isKeyDown(window.KeyEvent.DOM_VK_DOWN);
        west = input.isKeyDown(window.KeyEvent.DOM_VK_A) || input.isKeyDown(window.KeyEvent.DOM_VK_LEFT);
        east = input.isKeyDown(window.KeyEvent.DOM_VK_D) || input.isKeyDown(window.KeyEvent.DOM_VK_RIGHT);

        if (north) {
            if (east) {
                dir = Enum.Direction.NORTHEAST;
            } else if (west) {
                dir = Enum.Direction.NORTHWEST;
            } else {
                dir = Enum.Direction.NORTH;
            }
        } else if (south) {
            if (east) {
                dir = Enum.Direction.SOUTHEAST;
            } else if (west) {
                dir = Enum.Direction.SOUTHWEST;
            } else {
                dir = Enum.Direction.SOUTH;
            }
        } else if (east) {
            dir = Enum.Direction.EAST;
        } else if (west) {
            dir = Enum.Direction.WEST;
        }

        // If we're trying to move in a direction, check for other modifiers
        // and whether or not it's even allowed. Update the buffer.
        if (dir !== Enum.Direction.NONE) {

            // Check for a sit in some direction
            if (input.isKeyDown(window.KeyEvent.DOM_VK_C) || input.isKeyDown(window.KeyEvent.DOM_VK_CONTROL)) {
                
                // Only accept if it's not the exact same action+direction
                if (this.action !== Enum.Action.SIT || this.direction !== dir) {
                    buffer += 's' + Enum.Direction.toChar(dir);
                }
            } else {

                // We want to move, check if we can actually do it
                if (this.canMove(dir)) {

                    // We can move, so check for a speed modifier first
                    if (input.isKeyDown(window.KeyEvent.DOM_VK_SHIFT)) {
                        if (this.speed !== Enum.Speed.RUN) {
                            buffer += 'r';
                        }
                    } else {
                        if (this.speed !== Enum.Speed.WALK) {
                            buffer += 'w';
                        }
                    }

                    // Finally append a step in the desired direction
                    buffer += Enum.Direction.toChar(dir);

                } else {
                    // Can't move, if we're not already facing that way, face that way.
                    if (this.direction !== dir) {
                        buffer += 't' + Enum.Direction.toChar(dir);
                    }
                }
            }
        }

        if (buffer.length > 0) {
            this.addToActionBuffer(buffer);
        }
    };

    /**
     * Override of Actor.addToActionBuffer to queue up the new
     * buffer to be sent to the network next tick.
     *
     * @param {string} buffer
     */
    Player.prototype.addToActionBuffer = function(buffer) {

        // Queue up the buffer to be sent to the network
        // TODO: Obvious timing issue, we add to the buffer
        // and if we send immediately, before the buffer is
        // even processed, the actor state will be incorrect.
        // (will send with the state before buffer processing).
        if (this.context.network) {
            this.networkBuffer += buffer;
        }

        Actor.prototype.addToActionBuffer.call(this, buffer);
    };

    /**
     * Override of Actor.say to send the message to the
     * network, if we're connected. Regardless if we are or not,
     * this will still fire Actor.say (and the `say` event).
     *
     * @param {string} message
     */
    Player.prototype.say = function(message) {
        
        if (this.context.network) {
            this.context.network.emit('say', {
                message: message
            });
        }

        Actor.prototype.say.call(this, message);
    };

    Player.prototype.setName = function(name) {

        // If we're connected to a server, name changes must
        // be validated by the server before being applied.
        if (this.context.network) {

            this.context.network.emit('name', {
                name: name
            });

        } else {
            // Pass directly to the Actor
            Actor.prototype.setName.call(this, name);
        }
    };

    /**
     * Override of Actor.setAvatar to send the message to the
     * network, if we're connected.
     *
     * @param {object} properties of an avatar Animation
     */
    Player.prototype.setAvatar = function(properties) {

        if (this.context.network) {
            this.context.network.emit('avatar', {
                metadata: properties
            });
        } else {
            Actor.prototype.setAvatar.call(this, properties);
        }
    };

    return Player;
});

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

define('entity/RemoteActor',[
    'Enum',
    'entity/Actor'
], function(Enum, Actor) {

    /**
     * Entity representation of another player in an online world.
     */
    function RemoteActor(context, properties) {
        Actor.call(this, context, properties);
    }

    RemoteActor.prototype = Object.create(Actor.prototype);
    RemoteActor.prototype.constructor = RemoteActor;

    RemoteActor.prototype.destroy = function() {

        Actor.prototype.destroy.call(this);
    };

    return RemoteActor;
});

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

define('Network',[
    'EventHooks',
    'Utility',
    'entity/Actor',
    'entity/RemoteActor',
    'Player'
], function(EventHooks, Util, Actor, RemoteActor, Player) {

    function Network(context, options) {
        Util.extend(this, EventHooks);

        // Lazily check for socket.io support
        if (!window.io) {
            throw Error('No socket.io support. :(');
        }

        if (!options.hasOwnProperty('server')) {
            throw Error('No server URI specified.');
        }

        this.context = context;
        this.server = options.server;
        this.token = options.token || null;
        this.room = options.room || null;
        this.clientId = null; // Retrieved from the server

        this.socket = window.io(this.server);

        // bind handlers for socket events
        var binds = {
            connect: this.onConnect,
            disconnect: this.onDisconnect,
            err: this.onErr,
            auth: this.onAuth,
            join: this.onJoin,
            leave: this.onLeave,
            say: this.onSay,
            move: this.onMove,
            name: this.onName,
            avatar: this.onAvatar
        };

        for (var evt in binds) {
            if (binds.hasOwnProperty(evt)) {
                this.socket.on(evt, binds[evt].bind(this));
            }
        }
    }

    /**
     * Wrapper around `socket.emit` for logging/overloading.
     *
     * @param {string} id 
     * @param {object} payload
     */
    Network.prototype.emit = function(id, payload) {

        this.socket.emit(id, payload);
    };

    Network.prototype.onConnect = function() {

        var player = this.context.player,
            avatar = null;

        if (player.hasOwnProperty('avatarForNetwork')) {
            avatar = player.avatarForNetwork;
        } else {
            throw new Error('Network onConnect without an avatar!');
        }

        // connected, emit authentication
        this.emit('auth', {
            token: this.token,
            room: this.room,
            name: player.name,
            avatar: avatar,
            state: player.getState()
        });
    };

    Network.prototype.onDisconnect = function(reason) {
        console.log(reason);
        this.clientId = null;
        this.fire('disconnect', reason);

        // Note; this is done here because onLeave also performs destroy().
        // it may be better to listen to disconnect() from World and call
        // it there...
        this.context.removeRemoteActors();
    };

    /**
     * Called when an error response is returned from the server.
     * In most cases, this occurs whenever the client sends a 
     * malformed message that cannot be accepted. 
     * 
     * @param {object} data `err` payload
     */
    Network.prototype.onErr = function(data) {
        // Payload: responseTo, message, developerMessage

        window.alert(data.message);
        console.log(data);
        this.fire('error', data);
    };

    /**
     * Called when the server accepts our authentication.
     * Server provides us our unique client ID and actual 
     * room name. 
     * 
     * @param {object} data `auth` payload
     */
    Network.prototype.onAuth = function(data) {
        // Payload: id, room

        this.clientId = data.id;
        this.room = data.room;

        // Update our local player's entity ID to match
        this.context.player.id = data.id;

        this.fire('authenticated', {
            id: data.id,
            room: data.room
        });
    };

    /**
     * 
     * 
     * @param {object} data `join` payload
     */
    Network.prototype.onJoin = function(data) {
        // Payload: id, name, avatar, position, action, direction

        if (data.id === this.clientId) {
            // Ourself is joining, so setup our Actor and link to Player
            
            // TODO: Resolve better. Do we want to create the actor if it
            // doesn't exist? Should we assume it exists? Should we verify
            // it's linked to context.player? Etc. 
            
            var player = this.context.player;

            if (!(player instanceof Player)) {
                throw new Error('Local Player instance does not exist');
            }

            Actor.prototype.setName.call(player, data.name);
            Actor.prototype.setState.call(player, data.state);
            Actor.prototype.setAvatar.call(player, data.avatar);

        } else {
            // It's a remote user. Setup and associate an Actor
            var actor = this.context.find(data.id);

            // Remote doesn't exist, create a new Actor
            if (!actor) {
                // TODO: Support other things like template inheritance?
                actor = new RemoteActor(this.context, {
                    id: data.id,
                    name: data.name,
                    avatar: data.avatar,
                    position: data.state.slice(0, 3),
                    direction: data.state[3],
                    action: data.state[4]
                });

                this.context.add(actor);
                this.fire('remote.join', {
                    actor: actor
                });
            } else {
                // TODO: What do we do here? They shouldn't re-send a join
                // if they already exist in our world. Update existing entity?
                throw new Error('Duplicate `join` for remote [' + data.id + ']');
            }
        }
    };

    /**
     * 
     * 
     * @param {object} data `leave` payload
     */
    Network.prototype.onLeave = function(data) {
        // Payload: id

        var actor = this.context.find(data.id);
        if (!(actor instanceof RemoteActor)) {
            // TODO: Appropriate error handling
            throw new Error('No Actor associated with remote [' + data.id + ']');
        }

        this.fire('remote.leave', {
            actor: actor
        });
        actor.destroy();
    };

    /**
     * 
     * 
     * @param {object} data `say` payload
     */
    Network.prototype.onSay = function(data) {
        // Payload: id, message

        var actor = this.context.find(data.id);
        if (actor instanceof Player) {
            // Because Player.say doesn't set, but sends the 
            // request to the server (to get this response),
            // we instead call the underlying Actor.say()
            Actor.prototype.say.call(actor, data.message);

        } else if (actor instanceof RemoteActor) {
            this.fire('remote.say', {
                actor: actor,
                message: data.message
            });
            actor.say(data.message);

        } else {
            // TODO: Appropriate error handling
            throw new Error('No Actor associated with remote [' + data.id + ']');
        } 
    };

    /**
     * 
     * @param {object} data `move` payload
     */
    Network.prototype.onMove = function(data) {

        var actor = this.context.find(data.id);
        if (actor instanceof Player) {
            Actor.prototype.addToActionBuffer.call(actor, data.buffer);

        } else if (actor instanceof RemoteActor) {
            this.fire('remote.say', {
                actor: actor,
                message: data.message
            });
            actor.addToActionBuffer(data.buffer);

        } else {
            // TODO: Appropriate error handling
            throw new Error('No Actor associated with remote [' + data.id + ']');
        } 

        // TODO: I can add to the buffer, but I don't
        // have a way to apply verifications. I'll need
        // to work that back in somehow...
    };
 
    /**
     * 
     * @param {object} data `name` payload
     */
    Network.prototype.onName = function(data) {

        var actor = this.context.find(data.id);
        if (actor instanceof Player) {
            Actor.prototype.setName.call(actor, data.name);

        } else if (actor instanceof RemoteActor) {
            this.fire('remote.name', {
                actor: actor,
                name: data.name
            });
            actor.setName(data.name);

        } else {
            // TODO: Appropriate error handling
            throw new Error('No Actor associated with remote [' + data.id + ']');
        } 
    };

    /**
     * 
     * @param {object} data `avatar` payload
     */
    Network.prototype.onAvatar = function(data) {

        var actor = this.context.find(data.id);
        if (actor instanceof Player) {
            Actor.prototype.setAvatar.call(actor, data.metadata);

        } else if (actor instanceof RemoteActor) {
            this.fire('remote.avatar', {
                actor: actor,
                metadata: data.metadata
            });
            actor.setAvatar(data.metadata);

        } else {
            // TODO: Appropriate error handling
            throw new Error('No Actor associated with remote [' + data.id + ']');
        } 
    };

    return Network;
});

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

define('World',[
    'EventHooks',
    'Utility',
    'Timer',
    'Audio',
    'Resources',
    'Renderer',
    'Camera',
    'Input',
    'Player',
    'Network',
    'entity/RemoteActor'
], function(EventHooks, Util, Timer, Audio, Resources, 
            Renderer, Camera, Input, Player, Network, RemoteActor) {

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

        // Load plugins before any modules
        this.loadPlugins(properties.plugins || {});

        // Initialise submodules
        this.resources = new Resources(this);

        this.audio = new Audio(this, properties.audio || {});
        this.renderer = new Renderer(this, properties.renderer || {});
        this.input = new Input(this, properties.input || {});

        // If we specify network settings, connect us to a server
        if (properties.hasOwnProperty('network')) {
            this.network = new Network(this, properties.network);
        }

        this.loadEntities(properties.world.entities || []);
        this.loadPlayer(properties.player);
        
        // Load after player/entities, in case we want to track an entity
        this.camera = new Camera(this, properties.camera || {});
    }

    World.prototype.loadPlugins = function(plugins) {

        var fro = require('fro');
        for (var name in plugins) {
            if (plugins.hasOwnProperty(name)) {

                // Check if the plugin method exists
                if (!fro.plugins.hasOwnProperty(name)) {
                    throw new Error('Plugin [' + name + '] is not registered.');
                }

                // If a plugin has just a boolean for enable, default properties to {}
                if (plugins[name] === true) {
                    plugins[name] = {};
                }

                if (plugins[name] !== false) {
                    this.plugins[name] = new fro.plugins[name](
                        this, 
                        plugins[name]
                    ); 
                }
            }
        }
    };

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
     * Removes all RemoteActor entities from this world. This would
     * be called when a disconnect from the server happens and we
     * need to clean up all players that were managed remotely. 
     */
    World.prototype.removeRemoteActors = function() {

        var i, entities = [], len = this.renderableEntities.length;
        for (i = 0; i < len; i++) {
            if (this.renderableEntities[i] instanceof RemoteActor) {
                entities.push(this.renderableEntities[i]);
            }
        }

        len = entities.length;
        for (i = 0; i < len; i++) {
            entities[i].destroy();
        }
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
        var len = this.renderableEntities.length;
        for (var i = 0; i < len; i++) {
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

define('entity/Prop',[
    'Utility',
    'entity/Entity'
], function(Util, Entity) {
    var rect = Util.rect;

    function Prop(context, properties) {
        Entity.call(this, context, properties);
        
        this.width = properties.w;
        this.height = properties.h;
        this.isRenderable = true; // Add this entity to the render queue
        this.collisions = [];
        this.collisionOffset = [0, 0];

        if (properties.hasOwnProperty('collisions')) {
            this.loadCollisions(properties.collisions);
        }

        if (properties.hasOwnProperty('offset')) {
            this.setOffset(properties.offset);
        }
        
        this.setPosition(properties.position);
        this.image = context.resources.load(properties.image);
        
        // If it needs to load external resources, hook for errors
        if (!this.image.isLoaded()) {
        
            // Bind and wait for the image to be loaded
            var self = this;
            this.image.bind('onerror', function() {
                // TODO: do something, revert, load default, etc.
                throw new Error('Failed to load prop image for [' + self.id + ']');
            });
        }
    }

    Prop.prototype = Object.create(Entity.prototype);
    Prop.prototype.constructor = Prop;

    /** 
     * Our loaded state depends on the loaded texture.
     *
     * @return {boolean}
     */
    Prop.prototype.isLoaded = function() {
        return this.image.isLoaded();
    };

    Prop.prototype.loadCollisions = function(collisions) {
        this.collisions = [];
        
        // Map collisions to rects
        for (var i = 0; i < collisions.length; i += 4) {
        
            var r = rect.create([
                    collisions[i],
                    collisions[i+1],
                    collisions[i+2],
                    collisions[i+3]
                ]);

            this.collisions.push(r);
        }
    };

    Prop.prototype.render = function() {
        this.image.render(this.translation, 0.0);
    };

    /**
     * @param {rect} r
     */
    Prop.prototype.getBoundingBox = function(r) {
        
        // @todo factor in rotations and scaling
        // and utilize this.renderable.getTopLeft(), getBottomRight(), etc
        
        // @todo z-axis cube?
        
        r[0] = this.translation[0];
        r[1] = this.translation[0];
        r[2] = this.width;
        r[3] = this.height;
    };

    /**
     * @param {rect} r rectangle in world space to test
     * @return {boolean}
     */
    Prop.prototype.collides = function(r) {
        
        // @todo solidity flag for the optional "collides with me but 
        // I'm not solid, so it's a trigger collide" or something... ?
        
        /*
            Collision rectangles are relative to this.collisionOffset,
            where, by default (0, 0) points to the top left corner of 
            the entity's AABB. A rectangle [0, 0, this.width, this.height]
            indicates that the entire AABB of the entity is considered solid.
            Whereas, if the entity mimics an Actor and it's offset is 
            set to [w/2, h], and collisionOffset = [w/2, h], then
            a rectangle of [-8, -8, 16, 16] wraps the entity's world space
            coordinates in a 16x16 collision box. Or, if collisioOffset is
            left unchanged, [w/2 - 8, h - 8, 16, 16] does the same work.
        */

        // @todo factor in z-axis
        
        var nr = rect.create(r);
        nr[0] = nr[0] - this.translation[0] + this.collisionOffset[0];
        nr[1] = nr[1] - this.translation[1] + this.collisionOffset[1];

        var collisions = this.collisions;
        if (collisions) {
        
            for (var index in collisions) {
                if (rect.intersects(nr, collisions[index])) {
                    return true;
                }
            }
        }
        
        return false;
    };

    return Prop;
});

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

define('entity/Sound',[
    'entity/Entity'
], function(Entity) {

    /**
     * Sound effect (or ambience) that can have a position in the world.
     */
    function Sound(context, properties) {
        Entity.call(this, context, properties);

        this.positional = properties.positional || false;
        this.loop = properties.loop || false;
        this.autoplay = properties.autoplay || true;
        this.ambient = properties.ambient || false;

        //this.sourceBuffer;
        //this.audioBuffer;
        //this.audioGainNode;
        
        // If this is a positional audio source, set some coordinates
        if (this.positional) {
            this.setPosition(properties.x, properties.y);
        }

        // If our audio driver is working, go load our source file 
        if (this.context.audio.isAvailable()) {

            // Use an internal gain node to control this single sound's volume
            this.audioGainNode = this.context.audio.getAudioContext().createGain();
            this.setVolume(properties.volume || 100);

            var resource = this.context.resources.load(properties.sound);
            
            if (resource.isLoaded()) {
            
                // Audio source is already loaded
                this.setBuffer(resource.getBuffer());
                
            } else {
                
                // Bind and wait for the audio source to load
                var self = this;
                resource.bind('onload', function() {

                    self.setBuffer(this.getBuffer());
                })
                .bind('onerror', function() {
                
                    // TODO: do something, revert, load default, etc
                });
            }
        }
    }

    Sound.prototype = Object.create(Entity.prototype);
    Sound.prototype.constructor = Sound;

    Sound.prototype.destroy = function() {
        
        // Stop the track, in case we were still playing
        this.stop();
        
        if (this.audioBuffer) {
            this.audioGainNode.disconnect(0);
            //this.audioBuffer.disconnect(0); // TODO is this necessary?
            //delete this.audioBuffer;
            this.audioGainNode = undefined;
        }
        
        Entity.prototype.destroy.call(this);
    };

    Sound.prototype.setBuffer = function(buffer) {
        this.sourceBuffer = buffer;

        if (this.autoplay) {
            this.play();
        }
    };

    Sound.prototype.setVolume = function(volume) {

        if (volume > 1.0) {
            volume = 1.0;
        }

        this.volume = volume;

        if (this.audioGainNode) {
            // Using an x-squared curve since simple linear (x) 
            // does not sound as good (via html5rocks.com)
            this.audioGainNode.gain.value = volume * volume;
        }
    };

    Sound.prototype.play = function() {
        
        // @todo scale volume based on position relative to camera
        
        this.stop();
        
        if (this.context.audio.isAvailable()) {
        
            // Each time we play, we need to generate a new audioBuffer object
            var source = this.context.audio.getAudioContext().createBufferSource();
            source.buffer = this.sourceBuffer;
            source.loop = this.loop;
            
            // Patch some cross-browser differences
            if (!source.start) {
                source.start = source.noteOn;
            }
                
            if (!source.stop) {
                source.stop = source.noteOff;
            }
                
            this.audioBuffer = source;

            this.audioBuffer.connect(this.audioGainNode);
            this.context.audio.addConnection(this.audioGainNode, this.ambient);
            
            this.context.audio.play(this.audioBuffer);
        }
    };

    Sound.prototype.stop = function() {

        if (this.audioBuffer) {
            this.context.audio.stop(this.audioBuffer);
            this.audioBuffer = undefined; // No longer playable source
        }
    };

    return Sound;
});

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

define('resource/Image',[
    'resource/Resource',
    'Utility'
], function(Resource, Util) {
    var mat4 = Util.mat4;

    /**
     * Built-in image resource type.
     */
    function Image(context, properties) {
        Resource.call(this, context, properties);
        /*
            Expected JSON parameters:
                url (optional) - image url
                width - texture dimensions
                height - texture dimensions
                shader (optional) - shader resource ID applied while rendering
                fitToTexture (optional) - whether the width/height should change based on the loaded texture dimensions
        */

        this.width = properties.width;
        this.height = properties.height;

        if (properties.hasOwnProperty('shader') && properties.shader) {
            this.shader = context.renderer.getShader(properties.shader);
        } else {
            this.shader = context.renderer.getDefaultShader();
        }

        this.fitToTexture = properties.fitToTexture || true;
        
        // If this image resource uses an external url, load it as a texture
        if (properties.hasOwnProperty('url')) {
            this.url = properties.url;
            
            this.image = new window.Image();
            this.image.crossOrigin = ''; // Enable CORS support (Sybolt#59)
            this.image.src = properties.url;
            
            var self = this;
            this.image.onload = function() {
                
                /* TODO: We assume all images loaded will be used as
                    textures, so here we would perform the conversion
                    and test for any errors that may occur
                */
                self.setupTexture(self.image);
                
                self.fire('onload', self);
            };
            
            // hook an error handler
            this.image.onerror = function() { 
                self.fire('onerror', self);
            };
        } else if (properties.hasOwnProperty('canvas')) {
            // Image source is a canvas element. 
            // Clone the canvas into a texture
            this.setupTexture(properties.canvas);
        }
    }
    
    Image.prototype = Object.create(Resource.prototype);
    Image.prototype.constructor = Image;

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return {boolean}
     */
    Image.prototype.validateMetadata = function(metadata) {
        var requiredKeys = [
            'width', 'height'
        ];
        
        for (var i = 0; i < requiredKeys.length; i++) {
            if (!metadata.hasOwnProperty(requiredKeys[i])) {
                return false;
            }
        }

        return true;
    };

    /**
     * Construct this.texture from this.img Image resource
     * and resource properties
     */
    Image.prototype.setupTexture = function(source) {

        this.texture = this.context.renderer.createTexture(source);
        this.buildVertexBuffer();
        this.buildTextureBuffer();
    };

    Image.prototype.isLoaded = function() {

        return !!this.texture;
    };

    Image.prototype.getTexture = function() {

        if (!this.texture) {
            this.setupTexture();
        }
        
        return this.texture;
    };

    /**
     * @param vec3 position Translation position.
     * @param float rotation Optional. Angle (in radians) to rotate.
     * @param vec2 clip Optional. Source (x, y) to render from.
     */
    Image.prototype.render = function(position, rotation, clip) {
        var gl = this.context.renderer.getGLContext();

        // If we have no source yet, skip render.
        if (!this.isLoaded()) {
            return;
        }

        if (!this.texture) {
            throw new Error('No texture loaded for image [' + this.id + ']');
        }

        // Switch shaders to the active one for this image
        this.context.renderer.useShader(this.shader);
        
        // Begin draw, setup
        gl.mvPushMatrix();
        
        mat4.translate(gl.mvMatrix, position);
        
        if (rotation) {
            mat4.rotateZ(gl.mvMatrix, rotation);
        }

        // Set up buffers to use
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);
        gl.vertexAttribPointer(this.shader.getAttrib('aVertexPosition'), 
                                this.vbuf.itemSize, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);
        gl.vertexAttribPointer(this.shader.getAttrib('aTextureCoord'), 
                                this.tbuf.itemSize, gl.FLOAT, false, 0, 0);

        this.shader.bindTexture('uSampler', this.texture);
        
        // @todo does the default texture also perform clipping? 
        // I wanted it to be scaled, but rendered fully.
        if (clip) {
        
            if (!this.image) {
                throw new Error('Texture [' + this.id + '] has no image source to clip');
            }

            var h = (this.height === 0) ? 1.0 : this.height / this.getTextureHeight();
            var x = clip[0] / this.getTextureWidth();
            var y = 1.0 - h - clip[1] / this.getTextureHeight();

            gl.uniform2f(this.shader.getUniform('uClip'), x, y);
        } else {
            gl.uniform2f(this.shader.getUniform('uClip'), 0, 0);
        }
        
        gl.setMatrixUniforms();
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vbuf.itemCount);

        // End draw, reset
        gl.mvPopMatrix();
    };

    Image.prototype.buildVertexBuffer = function() {
        var gl = this.context.renderer.getGLContext();

        if (this.vbuf) {
            gl.deleteBuffer(this.vbuf);
        }
        
        var w = this.width;
        var h = this.height;

        this.vbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuf);

        // triangle strip form (since there's no GL_QUAD)
        gl.bufferData(gl.ARRAY_BUFFER, 
            new window.glMatrixArrayType([
                w, h, //w, -h, // bottom right
                w, 0, //w, h, // top right
                0, h, //-w, -h, // bottom left
                0, 0 //-w, h // top left
            ]), gl.STATIC_DRAW);
            
        this.vbuf.itemSize = 2;
        this.vbuf.itemCount = 4;
    };

    Image.prototype.buildTextureBuffer = function() {
        var gl = this.context.renderer.getGLContext();

        if (this.tbuf) {
            gl.deleteBuffer(this.tbuf);
        }
        
        // Create texture mapping
        this.tbuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tbuf);

        var x = 0.0, y = 0.0, w = 1.0, h = 1.0;

        w = this.width / this.getTextureWidth();
        h = this.height / this.getTextureHeight();

        gl.bufferData(gl.ARRAY_BUFFER, 
                new window.glMatrixArrayType([
                    x+w, y,
                    x+w, y+h,
                    x, y,
                    x, y+h
                ]), gl.STATIC_DRAW);

        this.tbuf.itemSize = 2;
        this.tbuf.itemCount = 4;
    };

    Image.prototype.getTextureWidth = function() {
        if (this.image) {
            return this.image.width;
        } else {
            // Assume texture width is same as image width
            return this.width;
        }
    };

    Image.prototype.getTextureHeight = function() {
        if (this.image) {
            return this.image.height;
        } else {
            // Assume texture height is same as image height
            return this.height;
        }
    };

    return Image;
});

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

define('resource/FontImage',[
    'resource/Image',
    'Utility'
], function(Image, Util) {

    // Create an internal worker canvas used to render text to textures
    var workerCanvas = document.createElement('canvas');
    //document.querySelector('body').appendChild(workerCanvas);
    
    function FontImage(context, properties) {
        Image.call(this, context, properties);

        // TODO: Image tries to load an image source if properties.url.
        // Maybe stop that from being defined?

        this.fitToTexture = false;
        this.text = properties.text;
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

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return {boolean}
     */
    FontImage.prototype.validateMetadata = function(metadata) {

        // TODO: More validation rules!
        var requiredKeys = [
            'text'
        ];
        
        for (var i = 0; i < requiredKeys.length; i++) {
            if (!metadata.hasOwnProperty(requiredKeys[i])) {
                return false;
            }
        }

        return true;
    };

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
        // Always instantly loaded
        return true;
    };

    return FontImage;
});

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

define('resource/Json',[
    'resource/Resource'
], function(Resource) {

    /**
     * Built-in JSON resource type.
     * On load, this will issue a GET for a JSON file and validate
     * if it actually JSON.
     */

    function Json(context, properties) {
        Resource.call(this, context, properties);

        this.url = properties.url;
        
        var request = new window.XMLHttpRequest();
        request.open('GET', this.url, true);

        var self = this;
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                self.json = JSON.parse(request.responseText);
                self.fire('onload', this);
            } else {
                // We reached our target server, but it returned an error
                self.fire('onerror', this);
            }
        };

        request.onerror = function() {
            // There was a connection error of some sort
            self.fire('onerror', this);
        };

        request.send();
    }

    Json.prototype = Object.create(Resource.prototype);
    Json.prototype.constructor = Json;

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return {boolean}
     */
    Json.prototype.validateMetadata = function(metadata) {
        var requiredKeys = [
            'url'
        ];
        
        for (var i = 0; i < requiredKeys.length; i++) {
            if (!metadata.hasOwnProperty(requiredKeys[i])) {
                return false;
            }
        }

        return true;
    };

    Json.prototype.isLoaded = function() {
        return typeof this.json === 'object';
    };

    Json.prototype.getJson = function() {
        return this.json;
    };

    return Json;
});

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

define('resource/Shader',[
    'resource/Resource',
    'Utility'
], function(Resource, Util) {

    /**
     * Built-in shader resource type.
     */
    function Shader(context, properties) {
        Resource.call(this, context, properties);

        /*
            Expected JSON parameters:
            id - unique ID for referencing shaders in the renderer
            vertex - vertex shader source url
            fragment - fragment shader source url
            uniforms = [
                uniform names
            ],
            attributes = [
                attribute names
            ]
        */
        
        this.program = null;
        
        // Add some values expected of all shaders
        //this.attributes['aVertexPosition'] = false;
        //this.attribute['aTextureCoord'] = false;
        this.uniforms = [];
        this.uniforms.uPMatrix = false;
        this.uniforms.uMVMatrix = false;
        
        for (var u = 0; u < properties.uniforms.length; u++) {
            this.uniforms[properties.uniforms[u]] = false;
        }

        this.attributes = [];
        for (var a = 0; a < properties.attributes.length; a++) {
            this.attributes[properties.attributes[a]] = false;
        }

        // TODO: Eventually support url loading. For now, assume
        // the shaders are completely in memory
        this.fragmentShaderSource = properties.fragment;
        this.vertexShaderSource = properties.vertex;
        
        this.compileProgram();
        
        // TODO: move this?
        this.context.renderer.attachShader(this);
    }

    Shader.prototype = Object.create(Resource.prototype);
    Shader.prototype.constructor = Shader;

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return {boolean}
     */
    Shader.prototype.validateMetadata = function(metadata) {
        var requiredKeys = [
            'id', 'vertex', 'fragment'
        ];
        
        for (var i = 0; i < requiredKeys.length; i++) {
            if (!metadata.hasOwnProperty(requiredKeys[i])) {
                return false;
            }
        }

        return true;
    };

    /**
     * Loads uniforms and attribute locations from the shader program
     */
    Shader.prototype.bindParameters = function() {
        var gl = this.context.renderer.getGLContext();

        // TODO: error testing for non-existing uniforms/attributes?
        
        for (var u in this.uniforms) {
            if (this.uniforms.hasOwnProperty(u)) {
                this.uniforms[u] = gl.getUniformLocation(this.program, u);
            }
        }
        
        for (var a in this.attributes) {
            if (this.attributes.hasOwnProperty(a)) {
                this.attributes[a] = gl.getAttribLocation(this.program, a);
                gl.enableVertexAttribArray(this.attributes[a]);
            }
        }
    };

    Shader.prototype.compileProgram = function() {
        var gl = this.context.renderer.getGLContext();

        if (!this.vertexShaderSource || !this.fragmentShaderSource) {
            throw new Error('Program [' + this.id + '] missing shader sources');
        }
        
        if (this.program) {
            gl.deleteProgram(this.program);
        }
        
        this.program = gl.createProgram();
        
        // Compile Vertex Shader
        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, this.vertexShaderSource);
        gl.compileShader(vs);
        
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            throw new Error('Program ' + this.id + ' Vertex Shader Error: ' + 
                            gl.getShaderInfoLog(vs) + '\n' + 
                            Util.getBrowserReport(true, gl)
            );
        } else {
            gl.attachShader(this.program, vs);
        }
        
        // Compile Fragment Shader
        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, this.fragmentShaderSource);
        gl.compileShader(fs);
        
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            throw new Error('Program ' + this.id + ' Fragment Shader Error: ' + 
                            gl.getShaderInfoLog(fs) + '\n' + 
                            Util.getBrowserReport(true, gl)
            );
        } else {
            gl.attachShader(this.program, fs);
        }
        
        // Link and use
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('Could not initialize shaders: ' + 
                            gl.getProgramInfoLog(this.program) + '\n' + 
                            Util.getBrowserReport(true, gl)
            );
        }
        
        this.bindParameters();
    };

    Shader.prototype.isLoaded = function() {
        
        return true;
    };

    Shader.prototype.getAttrib = function(name) {
        if (!(name in this.attributes)) {
            throw new Error('Attribute ' + name + ' does not exist in program [' + this.id + ']');
        }
        
        return this.attributes[name];
    };

    Shader.prototype.getUniform = function(name) {
        if (!(name in this.uniforms)) {
            throw new Error('Uniform ' + name + ' does not exist in program [' + this.id + ']');
        }
        
        return this.uniforms[name];
    };

    Shader.prototype.getProgram = function() {
        return this.program;
    };

    Shader.prototype.bindTexture = function(uniform, texture) {
        var gl = this.context.renderer.getGLContext();

        // @todo the ability to bind multiple textures at once, and assign each
        // to a different texture index based on the uniform selected
        
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(this.getUniform(uniform), 0);
    };

    return Shader;
});

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

define('resource/Sound',[
    'resource/Resource'
], function(Resource) {

    /**
     * Built-in sound resource type.
     * On load, this will issue a GET for an audio clip supported
     * by the user's browser and buffer the contents. Note, this
     * does not attempt to determine support for track types. 
     */
    function Sound(context, properties) {
        Resource.call(this, context, properties);

        this.url = properties.url;
        this.buffer = null;
        
        var request = new window.XMLHttpRequest();
        request.open('GET', this.url, true);
        request.responseType = 'arraybuffer';
        
        // Decode asynchronously
        var self = this;
        request.onload = function() {
            var audioContext = context.audio.getAudioContext();
            if (audioContext) {
                
                audioContext.decodeAudioData(request.response, function(buffer) {

                    self.buffer = buffer;
                    self.fire('onload', self);
                    
                }, function() {
                    self.fire('onerror', self);
                });
                
            } else {
                self.fire('onerror', self);
            }
        };
        
        // hook an error handler for network errors
        request.onerror = function() { 
            self.fire('onerror', self);
        };
        
        request.send();
    }

    Sound.prototype = Object.create(Resource.prototype);
    Sound.prototype.constructor = Sound;

    /**
     * Returns whether the input metadata schema is acceptable. 
     *
     * @param {Object} metadata
     *
     * @return {boolean}
     */
    Sound.prototype.validateMetadata = function(metadata) {
        var requiredKeys = [
            'url'
        ];
        
        for (var i = 0; i < requiredKeys.length; i++) {
            if (!metadata.hasOwnProperty(requiredKeys[i])) {
                return false;
            }
        }

        return true;
    };

    Sound.isLoaded = function() {

        return !!this.buffer;
    };

    Sound.getBuffer = function() {

        return this.buffer;
    };

    return Sound;
});

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

define('fro',['require','World','Timer','Utility','Enum','entity/Entity','entity/Actor','entity/Prop','entity/RemoteActor','entity/Sound','resource/Animation','resource/FontImage','resource/Image','resource/Json','resource/Shader','resource/Sound'],function(require) {

    // Expose modules
    return {
        VERSION: '0.1.0',

        // Expose object constructors
        World: require('World'),
        Timer: require('Timer'),
        utils: require('Utility'),
        enum: require('Enum'),
        // Note: utils/enum naming conventions are intentional since
        // they're object literals, not constructor.

        // Expose entity types
        entities: {
            Entity: require('entity/Entity'),
            Actor: require('entity/Actor'),
            Prop: require('entity/Prop'),
            RemoteActor: require('entity/RemoteActor'),
            Sound: require('entity/Sound')
        },

        // Expose resource types
        resources: {
            Animation: require('resource/Animation'),
            FontImage: require('resource/FontImage'),
            Image: require('resource/Image'),
            Json: require('resource/Json'),
            Shader: require('resource/Shader'),
            Sound: require('resource/Sound')
        },

        // Expose an empty container for external plugins
        plugins: {}
    };
});

}());