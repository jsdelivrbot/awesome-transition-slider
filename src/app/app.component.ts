import { Component, OnInit, AfterViewInit } from '@angular/core';
import '../assets/js/curtains.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(){}

  ngAfterViewInit(){
    console.log('After init');

    console.log('This is working');
    // Canvas container
    const canvasContainer = document.getElementById('canvas');
    console.log('Canvas', canvasContainer);

    const slider = {
      activeTexture: 1,
      nextTexture: 1, // This will change only when we will click
      transitionTimer: 0,
      isAnimating: false // Flag to know if we are animating
    }
    console.log('slider', slider);


    // Set up our webGL context and append canvas to our wrapper
    const webGLCurtain: any = new Curtains('canvas');
    console.log('webGL', webGLCurtain)


    // Get our plane element
    const planeElements = document.getElementsByClassName('multi-textures');
    console.log('planeElement', planeElements);

    // Could be useful to get pixel ratio
    const pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1.0;
    console.log('pixelRatio', pixelRatio);

    // Some basic parameters
    // We don't need to sacrifice vertexShader and fragmentShaderID because we already passed it via the data attributes of the plane html element
    const params = {
    vertexShader: `
      #ifdef GL_ES
      precision mediump float;
      #endif

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
    `,
    vertexShaderID: "multiple-textures-vs", // our vertex shader ID
    fragmentShader: `
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
      uniform sampler2D fourthTexture;
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
        vec2 effectFactor = vec2((textureCoords.x - 1.0) * 1.0, (textureCoords.y - 0.0) * 0.0);

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
      else if(uActiveTexture == 4) {
        firstDistortedColor = texture2D(fourthTexture, firstDisplacementCoords);
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
      else if(uNextTexture == 4) {
        secondDistortedColor = texture2D(fourthTexture, secondDisplacementCoords);
      }

      // mix both texture
      vec4 finalColor = mix(firstDistortedColor, secondDistortedColor, displacementFactor);

      // handling premultiplied alpha
      finalColor = vec4(finalColor.rgb * finalColor.a, finalColor.a);

      gl_FragColor = finalColor;
      }
    `,
    fragmentShaderID: "multiple-textures-fs", // our framgent shader ID
      uniforms: {
        resolution: {
          name: 'uResolution',
          type: '2f',
          value: [pixelRatio * planeElements[0].clientWidth, pixelRatio * planeElements[0].clientHeight],
        },
        transitionTimer: {
          name: 'uTransitionTimer',
          type: '1f',
          value: 0,
        },
        activeTexture: {
          name: 'uActiveTexture',
          type: '1i', // int
          value: slider.activeTexture,
        },
        nextTexture: {
          name: 'uNextTexture',
          type: '1i', //int
          value: slider.nextTexture
        },
      },
    }

    console.log('params',params)

    const multiTexturePlane = webGLCurtain.addPlane(planeElements[0], params);

    console.log('multiTexturePlane', multiTexturePlane);

    // Create our plane
    // TODO need to look at making a separate function
    multiTexturePlane.onReady(function(){
      console.log('Plane running');
      // When the plane is ready we need to add a click event listener that will switch the active texture value

      // Listen to the links click
      const slideLinks = document.getElementsByClassName('change-slide');

      for(let i = 0; i < slideLinks.length; i++) {
        slideLinks[i].addEventListener('click', function(){
          // Get index of the slide to go
          const slideToGo = this.getAttribute('data-slide');
          console.log('slideToGo', slideToGo);
          // If we are not animating
          console.log('slide animating', slider.isAnimating);

          if(!slider.isAnimating){
            slider.nextTexture = slideToGo;
            console.log('slide texture', slider.nextTexture);
            slider.isAnimating = true;
            // Update our next texture uniform
            multiTexturePlane.uniforms.nextTexture.value = slider.nextTexture;
          }
        }, false);
      }

      // on resize, update the resolution uniform
         window.onresize = function() {
             multiTexturePlane.uniforms.resolution.value = [pixelRatio * planeElements[0].clientWidth, pixelRatio * planeElements[0].clientHeight];
         }

     }).onRender(function() {
          // handling the slideshow
          if(slider.isAnimating) {
               // increase timer
               slider.transitionTimer = Math.min(120, slider.transitionTimer + 1);
               // if time is up
               if(slider.transitionTimer >= 120) {
                  // stop animation
                  slider.isAnimating = false;
                  // update the active texture
                  slider.activeTexture = slider.nextTexture;
                  // update our active texture uniform
                 multiTexturePlane.uniforms.activeTexture.value = slider.activeTexture;
                 // reset timer
                 slider.transitionTimer = 0;
               }
          }


         // update our transition timer uniform
         multiTexturePlane.uniforms.transitionTimer.value = slider.transitionTimer;
     });
  }

  ngOnInit(){
    console.log('On init')
    // var vertexShaderSource = `
    //     #ifdef GL_ES
    //     precision medium float;
    //     #endif
    //
    //     //default mandatory variables
    //     attribute vec3 aVertexPosition;
    //     attribute vec2 aTextureCoord;
    //
    //     uniform mat4 uMVMatrix;
    //     uniform mat4 uPMatrix;
    //
    //     // custom varibles;
    //     varying vec3 vVertexPosition;
    //     varying vec2 vTextureCoord;
    //
    //     // custom uniforms
    //     uniform float uTransitionTimer;
    //     uniform vec2 uResolution;
    //
    //     void main() {
    //
    //       vec3 vertexPosition = aVertexPosition;
    //
    //       gl_Position = uPMatrix * uMVMatrix * vec4(vertexPosition, 1.0);
    //
    //       // varyings
    //       vTextureCoord = aTextureCoord;
    //       vVertexPosition = vertexPosition;
    //     }
    // `;
    //
    // var el = document.querySelector('div');
    // el.setAttribute('data-foo', 'Hello World!');
    //
    // var fragmentShaderSource = `
    //     #ifdef GL_ES
    //     precision mediump float;
    //     #endif
    //
    //     varying vec3 vVertexPosition;
    //     varying vec2 vTextureCoord;
    //
    //     // custom uniforms
    //     uniform float uTransitionTimer;
    //     uniform vec2 uResolution;
    //
    //     // our slides (could have been an array of int)
    //     uniform int uActiveTexture;
    //     uniform int uNextTexture;
    //
    //     // our textures samplers
    //     // notice how it matches our data-sampler attributes
    //     uniform sampler2D firstTexture;
    //     uniform sampler2D secondTexture;
    //     uniform sampler2D thirdTexture;
    //     uniform sampler2D displacement;
    //
    //     void main( void ) {
    //               // our texture coords
    //               vec2 textureCoords = vec2(vTextureCoord.x, vTextureCoord.y);
    //
    //     // our displacement texture
    //     vec4 displacementTexture = texture2D(displacement, textureCoords);
    //
    //     // our displacement factor is a float varying from 1 to 0 based on the timer
    //       float displacementFactor = 1.0 - (cos(uTransitionTimer / (120.0 / 3.141592)) + 1.0) / 2.0;
    //
    //       // the effect factor will tell which way we want to displace our pixels
    //       // the farther from the center of the videos, the stronger it will be
    //       vec2 effectFactor = vec2((textureCoords.x - 0.5) * 0.75, (textureCoords.y - 0.5) * 0.75);
    //
    //       // calculate our displaced coordinates to our first video
    //       vec2 firstDisplacementCoords = vec2(textureCoords.x - displacementFactor * (displacementTexture.r * effectFactor.x), textureCoords.y- displacementFactor * (displacementTexture.r * effectFactor.y));
    //       // opposite displacement effect on the second video
    //       vec2 secondDisplacementCoords = vec2(textureCoords.x - (1.0 - displacementFactor) * (displacementTexture.r * effectFactor.x), textureCoords.y - (1.0 - displacementFactor) * (displacementTexture.r * effectFactor.y));
    //
    //     // apply it on our active slide
    //     vec4 firstDistortedColor;
    //     if(uActiveTexture == 1) {
    //        firstDistortedColor = texture2D(firstTexture, firstDisplacementCoords);
    //     }
    //     else if(uActiveTexture == 2) {
    //        firstDistortedColor = texture2D(secondTexture, firstDisplacementCoords);
    //     }
    //     else if(uActiveTexture == 3) {
    //       firstDistortedColor = texture2D(thirdTexture, firstDisplacementCoords);
    //     }
    //
    //     // apply it on our next slide
    //     vec4 secondDistortedColor;
    //     if(uNextTexture == 1) {
    //        secondDistortedColor = texture2D(firstTexture, secondDisplacementCoords);
    //     }
    //     else if(uNextTexture == 2) {
    //        secondDistortedColor = texture2D(secondTexture, secondDisplacementCoords);
    //     }
    //     else if(uNextTexture == 3) {
    //       secondDistortedColor = texture2D(thirdTexture, secondDisplacementCoords);
    //     }
    //
    //     // mix both texture
    //     vec4 finalColor = mix(firstDistortedColor, secondDistortedColor, displacementFactor);
    //
    //     // handling premultiplied alpha
    //     finalColor = vec4(finalColor.rgb * finalColor.a, finalColor.a);
    //
    //     gl_FragColor = finalColor;
    //     }
    // `;
    //
    // console.log('This is working');
    // // Canvas container
    // const canvasContainer = document.getElementById('canvas');
    // console.log('Canvas', canvasContainer);
    //
    // const slider = {
    //   activeTexture: 1,
    //   nextTexture: 1, // This will change only when we will click
    //   transitionTimer: 0,
    //   isAnimating: false // Flag to know if we are animating
    // }
    // console.log('slider', slider);
    //
    // // Set up our webGL context and append canvas to our wrapper
    // const webGLCurtain: any = new Curtains("canvas");
    // console.log('webGL', webGLCurtain)
    //
    //
    // // Get our plane element
    // const planeElements = document.getElementsByClassName('multi-textures');
    // console.log('planeElement', planeElements);
    //
    // // Could be useful to get pixel ratio
    // const pixelRatio = window.devicePixelRatio ? window.devicePixelRatio : 1.0;
    // console.log('pixelRatio', pixelRatio);
    //
    // console.log(vertexShaderSource, 'shader Id')
    // // Some basic parameters
    // // We don't need to sacrifice vertexShader and fragmentShaderID because we already passed it via the data attributes of the plane html element
    // const params = {
    //   vertexShaderID: vertexShaderSource,
    //   fragmentShaderID: fragmentShaderSource,
    //   uniforms: {
    //     resolution: {
    //       name: 'uResolution',
    //       type: '2f',
    //       value: [pixelRatio * planeElements[0].clientWidth, pixelRatio * planeElements[0].clientHeight],
    //     },
    //     transitionTimer: {
    //       name: 'uTransitionTimer',
    //       type: '1f',
    //       value: 0,
    //     },
    //     activeTexture: {
    //       name: 'uActiveTexture',
    //       type: '1i', // int
    //       value: slider.activeTexture,
    //     },
    //     nextTexture: {
    //       name: 'uNextTexture',
    //       type: '1i', //int
    //       value: slider.nextTexture
    //     },
    //   },
    // }
    //
    // console.log('params',params)
    //
    // const multiTexturePlane = webGLCurtain.addPlane(planeElements[0], params);
    //
    // console.log('multiTexturePlane', multiTexturePlane);
    //
    // // Create our plane
    // // TODO need to look at making a separate function
    // multiTexturePlane.onReady(function(){
    //   console.log('Plane running');
    //   // When the plane is ready we need to add a click event listener that will switch the active texture value
    //
    //   // Listen to the links click
    //   const slideLinks = document.getElementsByClassName('change-slide');
    //
    //   for(let i = 0; i < slideLinks.length; i++) {
    //     slideLinks[i].addEventListener('click', function(){
    //       // Get index of the slide to go
    //       const slideToGo = this.getAttribute('data-slide');
    //       console.log('slideToGo', slideToGo);
    //       // If we are not animating
    //       console.log('slide animating', slider.isAnimating);
    //
    //       if(!slider.isAnimating){
    //         slider.nextTexture = slideToGo;
    //         console.log('slide texture', slider.nextTexture);
    //         slider.isAnimating = true;
    //         // Update our next texture uniform
    //         multiTexturePlane.uniforms.nextTexture.value = slider.nextTexture;
    //       }
    //     }, false);
    //   }
    //
    //   // on resize, update the resolution uniform
    //      window.onresize = function() {
    //          multiTexturePlane.uniforms.resolution.value = [pixelRatio * planeElements[0].clientWidth, pixelRatio * planeElements[0].clientHeight];
    //      }
    //
    //  }).onRender(function() {
    //       // handling the slideshow
    //       if(slider.isAnimating) {
    //            // increase timer
    //            slider.transitionTimer = Math.min(120, slider.transitionTimer + 1);
    //            // if time is up
    //            if(slider.transitionTimer >= 120) {
    //               // stop animation
    //               slider.isAnimating = false;
    //               // update the active texture
    //               slider.activeTexture = slider.nextTexture;
    //               // update our active texture uniform
    //              multiTexturePlane.uniforms.activeTexture.value = slider.activeTexture;
    //              // reset timer
    //              slider.transitionTimer = 0;
    //            }
    //       }
    //
    //
    //      // update our transition timer uniform
    //      multiTexturePlane.uniforms.transitionTimer.value = slider.transitionTimer;
    //  });


  } // End of OnInit
}
