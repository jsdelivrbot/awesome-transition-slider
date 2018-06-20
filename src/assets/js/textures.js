// #ifdef GL_ES
// precision medium float;
// #endif

//default mandatory variables
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

// custom varibles;
varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

// custom uniforms
uniform float uTransitionTimer;
uniform vec2 uResolution;

void main() {

  vec3 vertexPosition = aVertexPosition;

  gl_Position = uPMatrix * uMVMatrix * vec4(vertexPosition, 1.0);

  // varyings
  vTextureCoord = aTextureCoord;
  vVertexPosition = vertexPosition;
}



#ifdef GL_ES
precision mediump float;
#endif

varying vec3 vVertexPosition;
varying vec2 vTextureCoord;

// custom uniforms
uniform float uTransitionTimer;
uniform vec2 uResolution;

// our slides (could have been an array of int)
uniform int uActiveTexture;
uniform int uNextTexture;

// our textures samplers
// notice how it matches our data-sampler attributes
uniform sampler2D firstTexture;
uniform sampler2D secondTexture;
uniform sampler2D thirdTexture;
uniform sampler2D displacement;

void main( void ) {
          // our texture coords
          vec2 textureCoords = vec2(vTextureCoord.x, vTextureCoord.y);

// our displacement texture
vec4 displacementTexture = texture2D(displacement, textureCoords);

// our displacement factor is a float varying from 1 to 0 based on the timer
  float displacementFactor = 1.0 - (cos(uTransitionTimer / (120.0 / 3.141592)) + 1.0) / 2.0;

  // the effect factor will tell which way we want to displace our pixels
  // the farther from the center of the videos, the stronger it will be
  vec2 effectFactor = vec2((textureCoords.x - 0.5) * 0.75, (textureCoords.y - 0.5) * 0.75);

  // calculate our displaced coordinates to our first video
  vec2 firstDisplacementCoords = vec2(textureCoords.x - displacementFactor * (displacementTexture.r * effectFactor.x), textureCoords.y- displacementFactor * (displacementTexture.r * effectFactor.y));
  // opposite displacement effect on the second video
  vec2 secondDisplacementCoords = vec2(textureCoords.x - (1.0 - displacementFactor) * (displacementTexture.r * effectFactor.x), textureCoords.y - (1.0 - displacementFactor) * (displacementTexture.r * effectFactor.y));

// apply it on our active slide
vec4 firstDistortedColor;
if(uActiveTexture == 1) {
   firstDistortedColor = texture2D(firstTexture, firstDisplacementCoords);
}
else if(uActiveTexture == 2) {
   firstDistortedColor = texture2D(secondTexture, firstDisplacementCoords);
}
else if(uActiveTexture == 3) {
  firstDistortedColor = texture2D(thirdTexture, firstDisplacementCoords);
}

// apply it on our next slide
vec4 secondDistortedColor;
if(uNextTexture == 1) {
   secondDistortedColor = texture2D(firstTexture, secondDisplacementCoords);
}
else if(uNextTexture == 2) {
   secondDistortedColor = texture2D(secondTexture, secondDisplacementCoords);
}
else if(uNextTexture == 3) {
  secondDistortedColor = texture2D(thirdTexture, secondDisplacementCoords);
}

// mix both texture
vec4 finalColor = mix(firstDistortedColor, secondDistortedColor, displacementFactor);

// handling premultiplied alpha
finalColor = vec4(finalColor.rgb * finalColor.a, finalColor.a);

gl_FragColor = finalColor;
}
