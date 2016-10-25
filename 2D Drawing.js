/**
 * @author Jialei Li, K.R. Subrmanian, Zachary Wartell
 *@moreAuthoring Mathew Brien
 *
 */


/*****
 *
 * GLOBALS
 *
 *****/

// 'draw_mode' are names of the different user interaction modes.
var draw_mode = {DrawLines: 0, DrawTriangles: 1, DrawQuads:2, ClearScreen: 3, None: 4};
//if an object is selected
var selected = [];
var selected_index; //cursor to currently selected object in the selected array
//save last selected point, so we itterated over selected objects intead of re-searching for objects
var last_point = [null, null];
// 'curr_draw_mode' tracks the active user interaction mode
var curr_draw_mode = draw_mode.DrawLines;

// GL array buffers for points, lines, and triangles
var vBuffer_Pnt, vBuffer_Line;
var vBuffer_Tri;
var vBuffer_Quad;

// Array's storing 2D vertex coordinates of points, lines, triangles, etc.
// Each array element is an array of size 2 storing the x,y coordinate.
var points = [], line_verts = [], tri_verts = [], quad_verts = [];
var selected_points = [];
var line_colors = [], tri_colors = [],   quad_colors = [];
var draw_order = [];
// count number of points clicked for new line
var num_pts = 0;

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
    vBuffer_Tri = gl.createBuffer();
    if(!vBuffer_Tri){
      console.log("Failed to create triangle buffer");
      return -1;
    }

    vBuffer_Quad = gl.createBuffer();
    if(!vBuffer_Quad){
      console.log("Failed to create quad buffer");
      return -1;
    }
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
                changeButtons("LineButton");
            });
    document.getElementById("TriangleButton").addEventListener(
            "click",
            function () {
              if(curr_draw_mode != draw_mode.DrawTriangles){
                clearUndrawnPoints();//delete vertecies of undrawn shapes, and points
                drawObjects(gl,a_Position, u_FragColor);//redraw without points
              }
                curr_draw_mode = draw_mode.DrawTriangles;
                changeButtons("TriangleButton");
            });
            //event handler for QuadButton
    document.getElementById("QuadButton").addEventListener(
            "click",
            function(){
            if(curr_draw_mode != draw_mode.DrawQuads){
              clearUndrawnPoints(); //delete vertecies of undrawn shapes, and points
              drawObjects(gl,a_Position, u_FragColor);  //redraw without points
              }
            changeButtons("QuadButton");
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
                while(draw_order.length > 0)
                    draw_order.pop();
                gl.clear(gl.COLOR_BUFFER_BIT);

                curr_draw_mode = draw_mode.DrawLines;
            });
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
    selected_points = [];
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    // convert from canvas mouse coordinates to GL normalized device coordinates
    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

//if user left clicked, draw
if(ev.which == 1){
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
                draw_order.push("line");
            }
            break;
      case draw_mode.DrawTriangles:
        if(num_pts < 2){
          tri_verts.push([x, y]);
          num_pts++
        }
        else{
          tri_verts.push([x, y]);
          tri_colors.push([current_colors[0],current_colors[1],current_colors[2]]);
          num_pts = 0;
          points.length = 0;
          draw_order.push("triangle");
        }
        break;
      case draw_mode.DrawQuads:
      if(num_pts < 3){
        quad_verts.push([x, y]);
        num_pts++
      }
      else{
        var temp_verts = []; //get last 3 vertices
        for(var i = 0; i<3; i++)
        {
          temp_verts.push(quad_verts[quad_verts.length-1]);
          quad_verts.pop();
        }
        temp_verts.push([x, y]);//push last
        temp_verts = sortVerts(temp_verts); //sort vertices in clockwise order
        for(var i = 0; i<4; i++){
          quad_verts.push(temp_verts[i]);
        }
        quad_verts.push(temp_verts[0]);
        for(var i = 0; i<4; i++){
          temp_verts.pop();
        }
        quad_colors.push([current_colors[0],current_colors[1],current_colors[2]]);
        num_pts = 0;
        points.length = 0;
        draw_order.push("quad");
      }
  }

}

  if(ev.which == 3){
    if(last_point[0] == x && last_point[1] == y){
      selected_index = (selected_index + 1 ) % selected.length;
    }
    else{
      selected = [];
      last_point[0] = x;
      last_point[1] = y;
      //find any objects that might have been selected, add the type and index to selected array
      for(var i = 0; i < line_verts.length; i+=2 ){
        if(pointLineDist([x,y], line_verts[i],line_verts[i+1]) < .01){
          selected.push( {"type":"line", "index":i});
        }
      }
      var bcc = [] ; // barry centric coordinates alpha, beta, gama
      for(var i = 0; i<tri_verts.length; i+=3){
        bcc =   barycentric(tri_verts[i], tri_verts[i+1],tri_verts[i+2], [x,y]);
        if(inside(bcc[0],bcc[1], bcc[2])){
          selected.push( {"type":"triangle", "index":i});
        }
      }
      for(var i =0; i < quad_verts.length; i+=5){
        //check in each of the three triangles making up the quad
        bcc = barycentric(quad_verts[i], quad_verts[i+1],quad_verts[i+2], [x,y]);
        if(inside(bcc[0],bcc[1],bcc[2])){
          selected.push( {"type":"quad", "index":i});
        }
        else{
          bcc = barycentric(quad_verts[i+1], quad_verts[i+2],quad_verts[i+3], [x,y]);
          if(inside(bcc[0],bcc[1],bcc[2])){
            selected.push( {"type":"quad", "index":i});
          }
          else{
            bcc = barycentric(quad_verts[i+2], quad_verts[i+3],quad_verts[i+4], [x,y]);
            if(inside(bcc[0],bcc[1],bcc[2])){
              selected.push( {"type":"quad", "index":i});
            }
          }
        }
      }//end for(quad_verts)
      if(selected.length > 0)
          selected_index = 0;
    }//end else (for if point has not changed)
    if(selected.length >0){
      //show vertecies of selected object
      selected_points = [];
      if(selected[selected_index].type == "line" ){
        selected_points.push(line_verts[selected[selected_index].index]);
        selected_points.push(line_verts[selected[selected_index].index+1]);
      }
      if(selected[selected_index].type == "triangle"){
        selected_points.push(tri_verts[selected[selected_index].index]);
        selected_points.push(tri_verts[selected[selected_index].index+1]);
        selected_points.push(tri_verts[selected[selected_index].index+2]);
      }
      if(selected[selected_index].type == "quad"){
        selected_points.push(quad_verts[selected[selected_index].index]);
        selected_points.push(quad_verts[selected[selected_index].index+1]);
        selected_points.push(quad_verts[selected[selected_index].index+2]);
        selected_points.push(quad_verts[selected[selected_index].index+3]);
      }
    }
  }//end if (ev.which == 3)
  drawObjects(gl,a_Position, u_FragColor);
}//end handleMouseDown

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
    var L = 0; //line counter
    var T = 0; //triangle counter
    var Q = 0; //quad coutner

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

   for(var i = 0; i<draw_order.length; i++){
      //case, draw, update L, T, Q
      if(draw_order[i] == "line"){
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
        // set vertex data into buffer (inefficient)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(line_verts), gl.STATIC_DRAW);
        // share location with shader
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.uniform4f(u_FragColor, line_colors[L][0]/100, line_colors[L][1]/100, line_colors[L][2]/100, 1.0);
        gl.drawArrays(gl.LINES, L*2, 2);
        L++;
      }
      if(draw_order[i] == "triangle"){
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Tri);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(tri_verts), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.uniform4f(u_FragColor, tri_colors[T][0]/100, tri_colors[T][1]/100, tri_colors[T][2]/100, 1.0);
        gl.drawArrays(gl.TRIANGLES, T*3, 3);
        T++;
      }
      if(draw_order[i] == "quad"){
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Quad);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(quad_verts), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);
        gl.uniform4f(u_FragColor, quad_colors[Q][0]/100, quad_colors[Q][1]/100, quad_colors[Q][2]/100, 1.0);
        gl.drawArrays(gl.TRIANGLE_STRIP, Q*5, 5);
        Q++;
      }
    }
  // draw primitive creation vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Pnt);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
    gl.drawArrays(gl.POINTS, 0, points.length);

    // draw vertecies of seleted objects
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Pnt);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(selected_points), gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);
    gl.uniform4f(u_FragColor, 1.0, 0.0, 0.0, 1.0);
    gl.drawArrays(gl.POINTS, 0, selected_points.length);
}
