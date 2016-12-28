/*
\authors Jialei Li, Zachary Wartell

Usage:  

Within the HTML file source the following scripts:

    <script src="../lib/webgl-utils.js"></script>
    <script src="../lib/webgl-debug.js"></script>
    <script src="../lib/cuon-utils.js"></script>
    <script src="../lib/uncc_webgl_utils/uncc_webgl_utils.js"></script>
*/

/**
Create a GLSL program object and make it the current GLSL program using
HTML <script> elements with Element ID 'vshaderID' and 'fshaderID'

@param {Object} gl GL context

@param {String} vshaderID - HTML Element ID of <script> element containing a
vertex shader program 

@param {String} fshaderID - HTML Elemend ID of <script> element containing
fragment shader program 

 @return true, if the program object was created and successfully made current 
**/
function initShadersFromID(gl, vshaderID, fshaderID) {
  var vertElem = document.getElementById(vshaderID);
  if (!vertElem) { 
        alert("Unable to load vertex shader " + vshaderID);
        return false;
  }
  
  var fragElem = document.getElementById(fshaderID);
  if ( !fragElem ) { 
        alert("Unable to load vertex shader " + fshaderID);
        return false;
  }
  
  var program = createProgram(gl, vertElem.text, fragElem.text);
  if (!program) {
    console.log('Failed to create program');
    return false;
  }

  gl.useProgram(program);
  gl.program = program;

  return true;
}

/**
Initialize event handler for a mouse user interface for 3D object rotation

@param {Object} canvas - HTML 5 Canvas
@param {Number[]} currentAngle - Array of 2 numbers contain x and y rotation angles

REFERENCE:
-[Modified] Used without permission.  Code Listing 10.1 from Matsuda, Kouichi; Lea, Rodger. 
WebGL Programming Guide: Interactive 3D Graphics Programming with WebGL (OpenGL) (Kindle Location 7678). 
Pearson Education. Kindle Edition. 

**/
function mouseRotation_initEventHandlers(canvas, currentAngle) {
    var dragging = false;         // Dragging or not
    var lastX = -1, lastY = -1;   // Last position of the mouse

    canvas.onmousedown = function (ev) {   // Mouse is pressed
        var x = ev.clientX, y = ev.clientY;
        // Start dragging if a moue is in <canvas>
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x;
            lastY = y;
            dragging = true;
        }
    };
    
    canvas.onmouseup = function (ev) {
        dragging = false;
    }; // Mouse is releaseds

    canvas.onmousemove = function (ev) { // Mouse is moved
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var factor = 100 / canvas.height; // The rotation ratio
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            // Limit x-axis rotation angle to -90 to 90 degrees
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = currentAngle[1] + dx;
        }
        lastX = x, lastY = y;
    };
}