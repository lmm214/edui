
/* 
MIT license

I could not stop

Copyright (c) 2021 by Gerard Ferrandez (https://codepen.io/ge1doot/pen/WbWQOP)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

window.addEventListener('load', function () {
	var src = document.getElementById("images").getElementsByTagName("img"),
	img = function img (el,x,y) {
		var d = document.createElement("div");
		d.className     = "frame";
		d.style.left    = 50 * x + "%";
		d.style.top     = 50 * y + "%";
		var img         = document.createElement("img");
		img.className   = "img";
		img.src         = src[Math.floor(Math.random()*src.length)].src;
		img.onmousedown = function () {
			div(this.parentNode);
			this.parentNode.removeChild(this);
			randomSound();
		}
		d.appendChild(img);
		el.appendChild(d);
	},
	div = function div (el) {
		img(el,0,0);
		img(el,1,0);
		img(el,0,1);
		img(el,1,1);
	};
	div(document.getElementById("screen"));
	window.ondragstart = function() { return false; } 
}, false);