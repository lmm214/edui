window.addEventListener('load', function() {FastClick.attach(document.body);}, false);

var checkValue = localStorage.getItem("checkbox");

var localSolved = localStorage.getItem("localSolved");
if(localSolved > 0 ){
	var solved = localSolved,unsolved = 1362-localSolved;
}else{
	var solved = 0,unsolved = 1362;
}

var canvasID      = "canvasID";
var canvas_ele,canvas_cts,width,height
var mainbodyID    = "page_body";
var status1       = 0;
var totalQ = 1362;
var this_quad;
var id_array = new Array();
var show_sol = 1;
var quad, quad_c, quad_pos,quad_all, quad_prev, quad_all_prev;
var op_array = new Array('\u002B', '\u002D', '\u00D7', '\u00F7');
var op_focus,num_focus,this_order;

var num_rect,op_rect;
var rect_clock, rect_solved, rect_unsolved, rect_score;
var rect_tobe, rect_skip, rect_undo, rect_redo;
var rect_all; // rect_all is for game,  rect_QUIT_array is for quitting
var rect_sol, rect_no_sol;
var ep = 0.000001;

function new_quad(){
	var this_game = this_order[this_quad];
	//if(checkValue == "false"){
	//	quad_all = grab_quad_sol_563(this_game);
	//}else{
		quad_all = grab_quad_sol(this_game);
	//}
	localStorage.setItem("notes_game",this_game);
	localStorage.setItem("notes_all",quad_all);
	
	id_array.push(this_game);
	var quad1 = quad_all[0].split(",");
	quad = new Array();
	quad_c = new Array();
	for (ii = 3; ii >= 0; ii--) {
		thisone = Math.floor(Math.random()* (ii+1) );
		quad.push( Number(quad1[thisone]));

		quad_c.push( Number(quad1[thisone]));
		quad1.splice(thisone, 1);

	}
	quad_pos = new Array(0,1,2,3);
	op_focus = -1; // nothing on focus
	num_focus = -1; // nothing on focus
	past_steps = new Array();  //  no past yet
	future_steps = new Array(); // no future yet
}

function getNotesArray() {
    var notesArray = localStorage.getItem("notesArray");
    if (!notesArray) {
        notesArray = [];
        localStorage.setItem("notesArray", JSON.stringify(notesArray));
    } else {
        notesArray = JSON.parse(notesArray);
    }
    return notesArray;
}

function getNotesArray_563() {
    var notesArray = localStorage.getItem("notesArray_563");
    if (!notesArray) {
        notesArray = [];
        localStorage.setItem("notesArray_563", JSON.stringify(notesArray));
    } else {
        notesArray = JSON.parse(notesArray);
    }
    return notesArray;
}

function old_quad(){
	if(checkValue == "false"){
		var notesArray = getNotesArray_563();
	}else{
		var notesArray = getNotesArray();
	}
	var noteLth = notesArray.length;
	if( noteLth > 0 ){
		var note_now = Math.floor(Math.random() * (noteLth));
		var this_game = notesArray[note_now];
		localStorage.setItem("tobeing",1);
		if(checkValue == "false"){
			localStorage.setItem("notes_now_563",note_now);
		}else{
			localStorage.setItem("notes_now",note_now);
		}
		localStorage.setItem("notes_game",this_game);
	}else{
		var this_game = this_order[this_quad];
		localStorage.setItem("notes_game",this_game);
		this_quad++;
	}
	id_array.push(this_game);

	//if(checkValue == "false"){
	//	quad_all = grab_quad_sol_563(this_game);
	//}else{
		quad_all = grab_quad_sol(this_game);
	//}

	localStorage.setItem("notes_all",quad_all);

	var quad1 = quad_all[0].split(",");
	quad = new Array();
	quad_c = new Array();
	for (ii = 3; ii >= 0; ii--) {
		thisone = Math.floor(Math.random()* (ii+1) );
		quad.push( Number(quad1[thisone]));
		quad_c.push( Number(quad1[thisone]));
		quad1.splice(thisone, 1);
	}
	quad_pos = new Array(0,1,2,3);
	op_focus = -1; // nothing on focus
	num_focus = -1; // nothing on focus
	past_steps = new Array();  //  no past yet
	future_steps = new Array(); // no future yet
}

function solved1(solvedone){//提示
    var tobeing = localStorage.getItem("tobeing");
	var this_game = this_order[this_quad];

	id_array.push(this_game); // save the quad
	this_quad++;
	quad_all_prev = quad_all; quad_prev = quad_c;  
	var a = quad_all_prev[1].split(" ");
	if (solvedone){
		solved ++;
		localStorage.setItem("localSolved",solved);
	}
	unsolved --;
	if (show_sol == 1){
		status1 = 4;
	}
	localStorage.removeItem("tobeing");
	var key = this_game;
	if(checkValue == "false"){
		var notesArray = getNotesArray_563();
		notesArray.push(key);
		if(!tobeing) localStorage.setItem("notesArray_563", JSON.stringify(notesArray));
	}else{
		var notesArray = getNotesArray();
		notesArray.push(key);
		if(!tobeing) localStorage.setItem("notesArray", JSON.stringify(notesArray));
	}
	new_quad();
	game_draw(0);
}

function solved2(solvedone){ //正常解决
	//var checkValue = localStorage.getItem("checkbox");
	var tobeing = localStorage.getItem("tobeing");
	if(tobeing == 1){
		//移除待解题组
		if(checkValue == "false"){
			var notesArray = getNotesArray_563();
			var notes_now = localStorage.getItem("notes_now_563");
		}else{
			var notesArray = getNotesArray();
			var notes_now = localStorage.getItem("notes_now");
		}
		var key = notesArray[notes_now];
    	localStorage.removeItem(key);
    	for (var i = 0; i < notesArray.length; i++) {
    		if (key === notesArray[i]) {
    			notesArray.splice(i, 1);
    		}
    	}
    	if(checkValue == "false"){
			localStorage.setItem("notesArray_563", JSON.stringify(notesArray));
		}else{
			localStorage.setItem("notesArray", JSON.stringify(notesArray));
		}
    	localStorage.removeItem("tobeing");
	}

	var this_game = this_order[this_quad];
	id_array.push(this_game); // save the quad
	this_quad++;
	quad_all_prev = quad_all; quad_prev = quad_c;
	var a = quad_all_prev[1].split(" ");
	if (solvedone){
		solved ++;
		localStorage.setItem("localSolved",solved);
	}
	unsolved --;
	new_quad();
	game_draw(0);
}

function solved3(solvedone){ //待解
	old_quad();
	game_draw(0);
}

function calc(num1, op1, num2){	// caucluate num1 (op1) num2
	var num3 = 0.0;
	switch(op1){
		case 0: num3= num1 + num2; break;
		case 1: num3= num1 - num2;break;			 
		case 2: num3= num1 * num2;break;
		case 3: num3= num1 / num2;break;
	}
	if (Math.abs(num3 - Math.round (num3)) < ep) // num1 is integer
		return (Math.round(num3));
	else return (num3);
}

function game_order(){ // pick up the order of games
	var TOTAL_GAME = 1362;
	if(checkValue == "false") TOTAL_GAME = 562;
	var final_order = new Array();
	var listall = new Array();
	for (ii = 0; ii < TOTAL_GAME; ii++){
		listall.push(ii);
	}
	var thisone; 
	for (ii = TOTAL_GAME -1; ii >=0; ii--){
		thisone = Math.floor(Math.random()* (ii + 1) );
		final_order.push(listall[thisone]);
		listall.splice(thisone, 1);
	}
	return final_order;
}

function grab_quad_sol(this_id){
	var res = new Array();
	if(checkValue == "false"){
		var pos = the_location_563[this_id];
		//var pos = the_location[this_id];
	}else{
		var pos = the_location[this_id];
	}
	var ii = pos;
	while(the_string[ii] != "[") {ii--;}
	ii ++;
	res.push(the_string.substring(ii, pos));
	var jj = pos;
	while(the_string[jj] != "[") {jj++;}
	res.push(the_string.substring(pos + 2, jj-1));
	return res;
}

function ongame(regionID){
	if (regionID == -1) {return; } // clicked outside of the region
	if (regionID <4) { // click on one of the numbers
		var numrect_id = -1;
		var numfocus_id ;
		for (ii = 0; ii < quad.length; ii ++){
			if (regionID == quad_pos[ii]){ numrect_id = ii; }
			if (num_focus == quad_pos[ii]) {numfocus_id = ii;}
		}
		if (numrect_id < 0  || num_focus == regionID ){ return; }  // the region is gone already, or clicking on the already focused num
		else{
			if (op_focus < 0) {num_focus = regionID;}  // no op is chosen yet, change num_focus
			else{ // op is chosen, we'll do the calculation and do the logistics
				if (op_focus == 3 && Math.abs( quad[numrect_id])< ep) { return; }  // divided by 0
				else{
					past_steps.push(Array(quad.slice(0), quad_pos.slice(0), num_focus));
					quad[numrect_id] = calc( quad[numfocus_id], op_focus, quad[numrect_id]);
					num_focus = quad_pos[numrect_id];
					op_focus = -1;
					quad.splice(numfocus_id,1); 
					quad_pos.splice(numfocus_id,1);
					future_steps = new Array(); // nothing left to redo
				}
			}
		}
	}
	else if (regionID <8){ 
		var op_ID = regionID - 4;
		if (num_focus >=0 && quad.length > 1) {op_focus = op_ID;} // if some number is chosen and there are more than 2 nums left, then highlight the op
		else{return;} // no num is chosen, do nothing here
	}
	else if (regionID ==8){//undo
		if (past_steps.length>0 || op_focus >=0){ // there is something to undo
			if (op_focus >=0) {op_focus = -1;}  // change the choice of op
			else{
				future_steps.push(Array(quad.slice(0), quad_pos.slice(0),num_focus));
				var last_quads = past_steps.pop();
				quad = last_quads[0]; 
				quad_pos = last_quads[1];
				num_focus = last_quads[2];
			}
		}		
	}
	else if (regionID ==9){//redo
		if (future_steps.length >0){
			past_steps.push(Array(quad.slice(0), quad_pos.slice(0),num_focus));
			var next_quads = future_steps.pop();
			quad = next_quads[0]; 
			quad_pos = next_quads[1];
			num_focus = next_quads[2];
		}
	}
	else if (regionID ==10){//skip
		solved1(0); // didn't solve one.
	}
	else if (regionID ==11){//tobe
		solved3(0);
	}
}

function click_ID(x,y, rect_array){
	var total = rect_array.length;
	var ii ;
	for ( ii = 0; ii < total ; ii ++){
		if (x >= rect_array[ii][0] && x <= rect_array[ii][0] + rect_array[ii][2] && y >= rect_array[ii][1] && y <= rect_array[ii][1] + rect_array[ii][3]){
			return ii;
		}
	}
	return -1 ;
}

//边框
function draw_rect(rect1, color1, border_wid1, color2 ){
	canvas_cts.fillStyle = color1;   // button color
	canvas_cts.fillRect (rect1[0], rect1[1], rect1[2], rect1[3]);	
	canvas_cts.lineWidth   = border_wid1;
	canvas_cts.strokeStyle  = color2;   // button color
	if (border_wid1>0)
		canvas_cts.strokeRect(rect1[0] + border_wid1/ 2, rect1[1] + border_wid1/2, rect1[2] - border_wid1, rect1[3] - border_wid1);
}
function draw_rect_num(rect1, color1, border_wid1, color2 ){
	canvas_cts.fillStyle = color1;   // button color
	//canvas_cts.fillRect (rect1[0], rect1[1], rect1[2], rect1[3]);	
	canvas_cts.lineWidth   = border_wid1;
	canvas_cts.strokeStyle  = color2;   // button color
	canvas_cts.strokeRect(rect1[0] - border_wid1/ 2, rect1[1] - border_wid1/ 2, rect1[2] + border_wid1, rect1[3] + border_wid1);
}
function draw_text(xy_array, text1, fillstyle1, font1){
	canvas_cts.fillStyle = fillstyle1; // font color
	canvas_cts.font = font1; 
	canvas_cts.textAlign='center';
	canvas_cts.fillText(text1, xy_array[0], xy_array[1]);
}

function draw_text_center(xy_array, text1, fillstyle1, font1){
	canvas_cts.fillStyle = fillstyle1; // font color
	canvas_cts.font = font1; 
	canvas_cts.textAlign='center';
	canvas_cts.fillText(text1, xy_array[0] + width*0.1, xy_array[1] + height*0.15);
}

function draw_text_num(xy_array, text1, fillstyle1, font1){
	canvas_cts.fillStyle = fillstyle1; // font color
	canvas_cts.font = font1; 
	canvas_cts.textAlign='center';
	//canvas_cts.fillText(text1, xy_array[0], xy_array[1]);
	canvas_cts.fillText(text1, xy_array[0] + width*0.2, xy_array[1] + height*0.28);
}

function stroke_text(xy_array, text1, strokestyle1, font1){
	canvas_cts.strokeStyle = strokestyle1; // font color
	canvas_cts.font = font1; 
	canvas_cts.strokeText(text1, xy_array[0], xy_array[1]);
}
function stroke_text_center(xy_array, text1, strokestyle1, font1){
	canvas_cts.strokeStyle = strokestyle1; // font color
	canvas_cts.textAlign='center';
	canvas_cts.font = font1; 
	canvas_cts.strokeText(text1, xy_array[0] + width*0.2, xy_array[1] + height*0.28);
}

// given text string and the rect, return the ideal x,y and fontsize
function text_in_rect(rect1, text_string){
	var fontsize = rect1[2] /Math.max(5, text_string.length + 2) * 2.8;
	var y = rect1[1] + rect1[3]/1.8 + 0.2 *  fontsize ;
	var x = rect1[0] + rect1[2]/2 - fontsize * text_string.length ;
	return (Array(x,y, fontsize));
}

function num_to_string (num1){
	var  result = "";
	if (Math.abs(num1 - Math.round (num1)) < ep) // num1 is integer
		return (result + num1);
	var ii = 2;
	var ii_mul_num1;
	while (1) {
		ii_mul_num1 = ii * num1;
		if (Math.abs(ii_mul_num1 - Math.round (ii_mul_num1)) < ep){
			return (result + Math.round(ii_mul_num1) + "/" + ii);
		}
		else 
			ii ++;
	}
	return result;
}

function start_game(){
	status1 = 1;
	localStorage.getItem('localSolved');
	//solved   = 0;
	unsolved = totalQ;
	this_quad = 0;
	this_order = game_order();
	new_quad ();
	show_sol = 1;
	
	var rect1 = new Array( 0,0, 2*width/5, 2*height/5);
	var rect2 = new Array( 3*width/5,0, 2*width/5, 2*height/5);
	var rect3 = new Array( 0,3*height/5, 2*width/5, 2*height/5);
	var rect4 = new Array( 3*width/5,3*height/5, 2*width/5, 2*height/5);
	num_rect  = new Array(rect1, rect2, rect3, rect4);  // the rects for the numbers
	rect_all  = new Array(rect1, rect2, rect3, rect4);   	

	rect1 = new Array( 2*width/5,height/5,width/5, height/5 );//+-*/
	rect2 = new Array( 3*width/5,2*height/5,width/5, height/5 );
	rect3 = new Array( 2*width/5,3*height/5,width/5, height/5 );
	rect4 = new Array( width/5,2*height/5,width/5, height/5 );
	op_rect = new Array(rect1, rect2, rect3, rect4);  // the rects for the numbers
	rect_all.push(rect1, rect2, rect3, rect4);	

	rect_undo = new Array( 0.1*width/5,2.1*height/5,0.8*width/5, 0.8*height/5 );
	rect_redo = new Array( 4.1*width/5,2.1*height/5,0.8*width/5, 0.8*height/5 );

	rect_solved = new Array(2*width/5,0,width/5, height/5);
	rect_skip = new Array( 2*width/5,3.9*height/5,width/5, height/5 );
	rect_tobe = new Array( 2.2*width/5,2.2*height/5,0.6*width/5, 0.6*height/5 );

	rect_all.push(rect_undo, rect_redo, rect_skip,rect_tobe); // rect 8,9,10,11

	rect_sol = new Array( width/10, height/10, 8*width/10, 8*height/10);
	rect_no_sol = new Array( width/5, 8*height/10, 6*height/10,  1.6*height/10);
							//x,不再出现x，宽度，
	game_draw(0);
}

function game_draw(isclock){
	if (status1 == 0){start_game();}
	draw_rect(Array(0,0, width, height), "#fff", 0, "#000");
	draw_rect(rect_solved ,  "#fff", 0, "#999");  		
	draw_text(Array(width*0.5,height*0.06), "已 解", "#666",Math.round(rect_solved[2]/6) +"px sans-serif");
	draw_text(Array(width*0.5,height*0.12), solved, "#366092",Math.round(rect_solved[2]/5) +"px sans-serif");
	draw_text(Array(width*0.5,height*0.16), "题", "#666",Math.round(rect_solved[2]/6) +"px sans-serif");

	draw_rect(rect_skip ,  "#fff", 0, "#999");
	draw_text_center(rect_skip, "提 示", "#999", Math.round(rect_skip[2]/5) +"px sans-serif");

	if(checkValue == "false"){
		var notesArray = getNotesArray_563();
	}else{
		var notesArray = getNotesArray();
	}
	var noteLth = notesArray.length;
	if(noteLth>0){
		var tobeing = localStorage.getItem("tobeing");
		var daijie_color ="#999";
		var daijie_num="#366092";
		if(tobeing == 1){
			draw_rect(rect_tobe ,  "#fff", 2, "#ec6941");
			daijie_color = "#ec6941";
			daijie_num = "#ec6941";
		}else{
			draw_rect(rect_tobe ,  "#eee", 0, "#ec6941");
		}
		draw_text(Array(width*0.5,height*0.48), "待 解", daijie_color, Math.round(rect_skip[2]/7) +"px sans-serif");
		draw_text(Array(width*0.5,height*0.53), notesArray.length,daijie_num , "bold " + Math.round(rect_skip[2]/6) +"px sans-serif");
	}else{
		draw_rect(rect_tobe ,  "#fff", 0, "#999");
		draw_text(Array(width*0.5,height*0.52), "\u21BB", "#999", Math.round(rect_skip[2]/4) +"px sans-serif");
	}

	var colorredo = "#366092";
	if (future_steps.length ==0){ colorredo = "#aaa";}
	draw_rect(rect_redo ,  "#fff", 0 , colorredo );
	draw_text_center(Array(4*width/5,1.85*height/5),"↬", colorredo ,Math.round(rect_redo[2]/3) +"px sans-serif");

	var colorundo = "#366092";
	if (past_steps.length ==0 && op_focus < 0 ){ colorundo = "#aaa";}
	draw_rect(rect_undo ,  "#fff", 0,colorundo);
	draw_text_center(Array(0,1.85*height/5), "↫",colorundo,Math.round(rect_undo[2]/3) +"px sans-serif");

	for (ii = 0; ii < 4; ii ++){// draw ops
		var op_rect1 = op_rect[ii];
		if (ii == op_focus){
			draw_rect(op_rect1,  "#fff", 0, "#366092");
			draw_text_center(op_rect1, op_array[ii] , "#366092", Math.round(op_rect1[2]) +"px sans-serif");
		}
		else{
			draw_rect(op_rect1,  "#366092", 0, "#366092");
			draw_text_center(op_rect1, op_array[ii] , "#fff", Math.round(op_rect1[2]) +"px sans-serif");
		}			
	}
	for (ii = 0; ii < quad.length; ii ++){ 
		var num_rect1 = num_rect[quad_pos[ii]];
		var text_string =  num_to_string (quad[ii]); 
  		var xy_fontsize = text_in_rect(num_rect1, text_string);
		if (quad_pos[ii] == num_focus){
			if (quad.length == 1){
				if (Math.abs(quad[0] - 24) < ep){
					solved2(1);
				}
				else{
					draw_rect(num_rect1,  "#fff", 6, "#ec6941"); 
					draw_text_num(num_rect1, text_string, "#ec6941", "bold " + xy_fontsize[2] + "px sans-serif");
				}
			}
			else{
				//选中数字边框
				draw_rect(num_rect1,  "#fff", 6, "#366092"); 
				draw_text_num(num_rect1, text_string, "#366092", "bold " + xy_fontsize[2] + "px sans-serif");
			}
		}
		else{
			draw_rect(num_rect1,  "#fff", 4, "#366092"); //#6c9ed9 darker
			stroke_text_center(num_rect1, text_string, "#366092", xy_fontsize[2] + "px sans-serif");
		}
	}	

	if (status1 == 4 && show_sol){ // show the solutions
		draw_rect(rect_sol, "#fff", 4, "#366092");
		draw_text(Array(width/2, rect_sol[3]*1.02 ), "点我 关闭", "#ec6941", "bold " + Math.round(rect_no_sol[3]/4) +"px sans-serif");
		draw_text(Array(width/2, rect_sol[3]*1.07 ), "(微信公众号：决战24点)", "#366092", "bold " + Math.round(rect_no_sol[3]/6) +"px sans-serif");

		draw_text(Array(width/2, rect_sol[1] * 0.6  + rect_sol[3] * 0.05 * 2.5 ),  quad_prev[0] + "  "+ quad_prev[1] + "  "+ quad_prev[2] + "  "+ quad_prev[3] +" 的所有解法", "#ec6941", "bold " + Math.round(rect_no_sol[3]/4) +"px sans-serif");

		var sol_vec = quad_all_prev[1].split(" ");
		if (sol_vec.length > 8){
			for (ii = 0; ii < sol_vec.length; ii +=2)
				 draw_text(Array(width*0.3, rect_sol[1] * 0.55  + rect_sol[3] * (0.05 *4.0+ ii/2 * 0.09) ), "["+ (ii +1) +"] " +sol_vec[ii], "#366092", Math.round(rect_no_sol[3]/4) +"px sans-serif");
			for (ii = 1; ii < sol_vec.length; ii +=2)
				 draw_text(Array(width*0.65, rect_sol[1] * 0.55  + rect_sol[3] * (0.05 *4.0+ (ii-1)/2 * 0.09) ), "["+ (ii +1) +"] " +sol_vec[ii], "#366092", Math.round(rect_no_sol[3]/4) +"px sans-serif");
		}
		else{
			for (ii = 0; ii < sol_vec.length; ii ++)
			 draw_text(Array(width/2, rect_sol[1]  + rect_sol[3] * (0.05 *4.0+ ii * 0.09) ),sol_vec[ii], "#366092", Math.round(rect_no_sol[3]/4) +"px sans-serif");
		}
	}

}

function onclick1 (e){
	var canvas = document.getElementById(canvasID);
    var x, y;
	var mainbody = document.getElementById(mainbodyID);
       if (e.pageX != undefined && e.pageY != undefined) {
  		x = e.pageX;
		y = e.pageY;
       }
       else {
		x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
		y = e.clientY + document.body.scrollTop  + document.documentElement.scrollTop;
       }
       x -= (canvas.offsetLeft + mainbody.offsetLeft);
       y -= (canvas.offsetTop + mainbody.offsetTop);  
	switch (status1){
		case  0: // on the init-game screen
			start_game ();
		break;
		case 1:
			var regionID = click_ID(x,y,rect_all);
			ongame(regionID);
			game_draw(0);
		break;
		case 3: //tobe
			status1=3;game_draw(0);
		break;
		case 4: //show solutions
			status1=1;game_draw(0);
		break;
		default : 
	}
}

function inputClick(){
    var isChecked = document.getElementById("checkbox").checked;
    document.getElementById("checkbox").checked = isChecked;
    localStorage.setItem("checkbox",isChecked);
    location.reload();
}


function init_game(){
	canvas_ele   =  document.getElementById(canvasID) ;
	canvas_ele.addEventListener("click", onclick1, false);
	canvas_ele.setAttribute('tabindex','0');
	canvas_ele.focus();
	width  = canvas_ele.width;
	height = canvas_ele.height;
	status1   = 0;
	canvas_cts = canvas_ele.getContext( "2d");
	game_draw(0);
}