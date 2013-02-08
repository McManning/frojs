
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform vec4 uColor;

varying vec2 vTextureCoord;
varying vec4 vWorldCoord;

void main(void) {
	
	vWorldCoord = uMVMatrix * vec4(aVertexPosition, 1.0);
	vTextureCoord = aTextureCoord;

	gl_Position = uPMatrix * vWorldCoord;
	
	/*
		gl_Position is absolute screen position [0, 1] (ie: @ screen x = 800, gl_Position.x = 1)
		uMVMatrix * aVertexPos = is screen position in pixels (ie: x = (0, 800))
		aVertexPos = [0, 1], where 0 is the left edge of the object rendered
		gl_FragCoord (frag) = screen position, therefore same as uMVMatrix * aVertexPos?
	*/
}
