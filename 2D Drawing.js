/**
 * @author Jialei Li, K.R. Subrmanian, Zachary Wartell
 *
 *
 */


/*****
 *
 * GLOBALS
 *
 *****/

// 'draw_mode' are names of the different user interaction modes.
// \todo Student Note: others are probably needed...
var draw_mode = {DrawLines: 0, DrawTriangles: 1, DrawQuads:2, ClearScreen: 3, None: 4};

// 'curr_draw_mode' tracks the active user interaction mode
var curr_draw_mode = draw_mode.DrawLines;

// GL array buffers for points, lines, and triangles
// \todo Student Note: need similar buffers for other draw modes...
var vBuffer_Pnt, vBuffer_Line;

// Array's storing 2D vertex coordinates of points, lines, triangles, etc.
// Each array element is an array of size 2 storing the x,y coordinate.
// \todo Student Note: need similar arrays for other draw modes...
var points = [], line_verts = [], tri_verts = [], quad_verts = [];
var line_colors = [], tri_colors = [],   quad_colors = [];

// count number of points clicked for new line
var num_pts = 0;

// \todo need similar counters for other draw modes...

var current_colors = [0,100,0];
/*****
 *
 * MAIN
 *
 *****/
function main() {
    //math2d_test();

    /**
     **      Initialize WebGL Components
     **/

    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShadersFromID(gl, "vertex-shader", "fragment-shader")) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // create GL buffer objects
    vBuffer_Pnt = gl.createBuffer();
    if (!vBuffer_Pnt) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    vBuffer_Line = gl.createBuffer();
    if (!vBuffer_Line) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var skeleton=true;
    if(skeleton)
    {
        document.getElementById("App_Title").innerHTML += "-Skeleton";
    }

    // \todo create buffers for triangles and quads...

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);
    updateColor(current_colors);  //fill color preview canvas
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // get GL shader variable locations
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    /**
     **      Set Event Handlers
     **
     **  Student Note: the WebGL book uses an older syntax. The newer syntax, explicitly calling addEventListener, is preferred.
     **  See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     **/
    // set event handlers buttons
    document.getElementById("LineButton").addEventListener(
            "click",
            function () {
              if(curr_draw_mode != draw_mode.DrawLines){
                clearUndrawnPoints();//delete vertecies of undrawn shapes, and points
                drawObjects(gl,a_Position, u_FragColor);//redraw without points
              }
                curr_draw_mode = draw_mode.DrawLines;
            });

    document.getElementById("TriangleButton").addEventListener(
            "click",
            function () {
              if(curr_draw_mode != draw_mode.DrawTriangles){
                clearUndrawnPoints();//delete vertecies of undrawn shapes, and points
                drawObjects(gl,a_Position, u_FragColor);//redraw without points
              }
                curr_draw_mode = draw_mode.DrawTriangles;
            });
            //event handler for QuadButton
    document.getElementById("QuadButton").addEventListener(
            "click",
            function(){
            if(curr_draw_mode != draw_mode.DrawQuads){
              clearUndrawnPoints(); //delete vertecies of undrawn shapes, and points
              drawObjects(gl,a_Position, u_FragColor);  //redraw without points
              }
            console.log("quad " + draw_mode.DrawQuads);
            curr_draw_mode = draw_mode.DrawQuads;
          });
    document.getElementById("DeleteButton").addEventListener(
      "click",
      function(){
        console.log("TODO: do something when delete button is clicked")
      });
    document.getElementById("ClearScreenButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.ClearScreen;
                // clear the vertex arrays
                while (points.length > 0)
                    points.pop();
                while (line_verts.length > 0)
                    line_verts.pop();
                while (tri_verts.length > 0)
                    tri_verts.pop();
                while(quad_verts.length > 0)
                    quad_verts.pop();
                while(line_colors.length > 0)
                    line_colors.pop();
                while(tri_colors.length>0)
                    tri_colors.pop();
                while(quad_colors.length >0)
                    quad_colors.pop();
                gl.clear(gl.COLOR_BUFFER_BIT);

                curr_draw_mode = draw_mode.DrawLines;
            });

    //\todo add event handlers for other buttons as required....

    // Color sliders update global current color variable, and the color preview canvas
    document.getElementById("RedRange").addEventListener(
            "input",
            function () {
              current_colors[0] = document.getElementById("RedRange").value;
                updateColor(current_colors);
            });
    document.getElementById("GreenRange").addEventListener(
            "input",
            function () {
              current_colors[1] = document.getElementById("GreenRange").value;
                updateColor(current_colors);

            });
    document.getElementById("BlueRange").addEventListener(
            "input",
            function () {
              current_colors[2] = document.getElementById("BlueRange").value;
                updateColor(current_colors);
            });

    // init sliders
    //sliders are initialized from global current_colors variable;
    document.getElementById("RedRange").value = current_colors[0];
    document.getElementById("GreenRange").value = current_colors[1];
    document.getElementById("BlueRange").value = current_colors[2];

    // Register function (event handler) to be called on a mouse press
    canvas.addEventListener(
            "mousedown",
            function (ev) {
                handleMouseDown(ev, gl, canvas, a_Position, u_FragColor);
                });
}

/*****
 *
 * FUNCTIONS
 *
 *****/

/*
 * Handle mouse button press event.
 *
 * @param {MouseEvent} ev - event that triggered event handler
 * @param {Object} gl - gl context
 * @param {HTMLCanvasElement} canvas - canvas
 * @param {Number} a_Position - GLSL (attribute) vertex location
 * @param {Number} u_FragColor - GLSL (uniform) color
 * @returns {undefined}
 */
function handleMouseDown(ev, gl, canvas, a_Position, u_FragColor) {
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    // Student Note: 'ev' is a MouseEvent (see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)

    // convert from canvas mouse coordinates to GL normalized device coordinates
    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    if (curr_draw_mode !== draw_mode.None) {
        // add clicked point to 'points'
        points.push([x, y]);
    }

    // perform active drawing operation
    switch (curr_draw_mode) {
        case draw_mode.DrawLines:
            // in line drawing mode, so draw lines
            if (num_pts < 1) {
                // gathering points of new line segment, so collect points
                line_verts.push([x, y]);
                num_pts++;
            }
            else {
                // got final point of new line, so update the primitive arrays
                //push next vertex
                line_verts.push([x, y]);
                //push color
                line_colors.push([current_colors[0],current_colors[1],current_colors[2]]);
                num_pts = 0;
                points.length = 0;
            }
            break;
      case draw_mode.DrawTriangles:
        if(num_pts < 2){
          //
        }
        break;
  }
    drawObjects(gl,a_Position, u_FragColor);
}

/*
 * Draw all objects
 * @param {Object} gl - WebGL context
 * @param {Number} a_Position - position attribute variable
 * @param {Number} u_FragColor - color uniform variable
 * @returns {undefined}
 */
//if draw mode is changed, delete the vertices associated with undrawn lines, triangles, and quads
//remove the vertices of incomplete shapes from the respective vertex array
function clearUndrawnPoints(){
  if(num_pts > 0){
    switch(curr_draw_mode){
      case draw_mode.DrawLines:
          line_verts.splice(line_verts.length - num_pts, num_pts);
          break;
      case draw_mode.DrawTriangles:
            tri_verts.splice(tri_verts.length - num_pts, num_pts);
            break;
      case draw_mode.DrawQuads:
            quad_verts.splice(quad_verts.length - num_pts, num_pts);
            break;
    }
  }
  while(points.length > 0)
    points.pop();
  num_pts = 0;
}

function drawObjects(gl, a_Position, u_FragColor) {

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw lines
    //TODO // push color to array, draw each line the correct color
    if (line_verts.length) {
        // enable the line vertex
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
        // set vertex data into buffer (inefficient)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(line_verts), gl.STATIC_DRAW);
        // share location with shader
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        //for each line, get vertices and color
        for(var i = 0; i< line_colors.length; i++){
          //get matching color and line
          gl.uniform4f(u_FragColor, line_colors[i][0]/100, line_colors[i][1]/100, line_colors[i][2]/100, 1.0);
          // draw the lines
          gl.drawArrays(gl.LINES, i*2, 2);
        }
    }

   // \todo draw triangles

   // \todo draw quads

    // draw primitive creation vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Pnt);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
    gl.drawArrays(gl.POINTS, 0, points.length);
}

/**
 * Converts 1D or 2D array of Number's 'v' into a 1D Float32Array.
 * @param {Number[] | Number[][]} v
 * @returns {Float32Array}
 */
function flatten(v)
{
    var n = v.length;
    var elemsAreArrays = false;

    if (Array.isArray(v[0])) {
        elemsAreArrays = true;
        n *= v[0].length;
    }

    var floats = new Float32Array(n);

    if (elemsAreArrays) {
        var idx = 0;
        for (var i = 0; i < v.length; ++i) {
            for (var j = 0; j < v[i].length; ++j) {
                floats[idx++] = v[i][j];
            }
        }
    }
    else {
        for (var i = 0; i < v.length; ++i) {
            floats[i] = v[i];
        }
    }

    return floats;
}
