QQShuru = {};
QQShuru.Util = {};
QQShuru.Util.Browser = {};
QQShuru.Util.Browser.isIE = (navigator.appName == "Microsoft Internet Explorer");

QQShuru.Util.Ajax = {};
QQShuru.Util.Ajax.get = function(a, c) {
    var b = document.createElement("script");
    b.setAttribute("charset", "utf-8");
    b.id = Math.random();
    document.getElementsByTagName("head")[0].appendChild(b);
    b.src = a + "&c=" + c;
    if (QQShuru.Util.Browser.isIE) {
        b.onreadystatechange = function() {
            if (b.readyState == "loaded") {
                document.getElementsByTagName("head")[0].removeChild(b)
            }
        }
    } else {
        b.onload = function() {
            document.getElementsByTagName("head")[0].removeChild(b)
        }
    }
};
QQShuru.Util.Event = {};
QQShuru.Util.Event.addEvent = function() {
    if (QQShuru.Util.Browser.isIE) {
        return function(b, c, a) {
            b.attachEvent("on" + c, a)
        }
    } else {
        return function(b, c, a, d) {
            b.addEventListener(c, a, d || false)
        }
    }
} ();
QQShuru.Util.Event.remEvent = function() {
    if (QQShuru.Util.Browser.isIE) {
        return function(b, c, a) {
            b.detachEvent("on" + c, a)
        }
    } else {
        return function(b, c, a, d) {
            b.removeEventListener(c, a, d || false)
        }
    }
} ();
QQShuru.Util.Event.getPoint = function(a) {
    if (QQShuru.Util.Browser.isIE) {
        return [a.x, a.y]
    } else {
        return [a.layerX, a.layerY]
    }
};
/*
    初始化函数
*   params:obj
*   obj={
*       canvasId:canvas的id  --required
*       lineColor:  默认#606060  ,
*       lineWidth:  默认10
*       clearBtnId:清空canvas按钮id
*       callback:func  每次请求后回调
*   }
*
*
*/
QQShuru.HWPanel = function(obj) {
    var o = QQShuru.Util.Browser.isIE;
    var m = QQShuru.Util.Event.addEvent;
    var j = QQShuru.Util.Event.remEvent;
    var B = QQShuru.Util.Event.getPoint;
    var h = document;
    var H = document.body;
    var z = document.documentElement;
    var f = [];
    var K = [];
    var O = [];

    var i = document.querySelector(obj.canvasId);
    var v = o ? 1 : 0;
    var a = 2;
    var N = i.clientHeight;//canvas宽度
    var R = i.clientHeight;//canvas高度
    var c = obj.lineColor?obj.lineColor:"#4285f4"; //线条颜色
    var y = obj.lineWidth?obj.lineWidth:3;//线条宽度
    var t = "round";//线头
    var J = !!i.getContext;
    if (J) {
        var Q = i.getContext("2d");
        Q.lineCap = t;
        Q.lineJoin = t;
        Q.lineWidth = y;
        Q.strokeStyle = c
    }
    var L = false;
    var P = false;
    var u = 0;
    var T = [];
    var r = 0;
    var e = [],
        d = [],
        I = [];
    var D = [],
        C = [];
    pointsDeltaXY = [];
    var k = [0, 0];

	function getX(obj){
		var parObj=obj;  
		var left=obj.offsetLeft;  
	 	while(parObj=parObj.offsetParent){  
	  		left+=parObj.offsetLeft;  
		}  
 		return left;  
	}  
  
	function getY(obj){  
		var parObj=obj;  
		var top=obj.offsetTop;  
		while(parObj = parObj.offsetParent){  
	 		top+=parObj.offsetTop;  
	 	}  
	 return top;  
	}
    //鼠标按下事件
    var l = function(W) {
        if (v !== W.button) {
            return
        }
        var Y = B(W);
        if (!Y) {
            return
        }
        L = true;
        r = 0;
        e = [];
        d = [];
        I = [];
        D = [];
        C = [];
        pointsDeltaXY = [];
        e[r] = Y[0];
        d[r] = Y[1];
        I[r * 2] = Y[0];
        I[r * 2 + 1] = Y[1];
        D[r] = Y[0];
        C[r] = Y[1];
        pointsDeltaXY[r * 2] = Y[0];
        pointsDeltaXY[r * 2 + 1] = Y[1];
        if (J) {
            Q.beginPath();
            Q.moveTo(Y[0], Y[1])
        }
        k[0] = Y[0];
        k[1] = Y[1];
        r++;
        if (o) {
            m(i, "losecapture", n);
            i.setCapture()
        } else {
            m(window, "blur", n)
        }
    };
	//触摸开始事件
	function onTouchStart(event) {
		lastX=event.touches[0].clientX;
	    lastY=event.touches[0].clientY;
		var top,left; 
	    top=getY(i);    
	    left=getX(i);    
		lastX= parseInt(lastX - left+document.body.scrollLeft);
		lastY = parseInt(lastY -top+document.body.scrollTop);
	
	        L = true;
	        r = 0;
	        e = [];
	        d = [];
	        I = [];
	        D = [];
	        C = [];
	        pointsDeltaXY = [];
	        e[r] = lastX;
	        d[r] = lastY;
	        I[r * 2] = lastX;
	        I[r * 2 + 1] = lastY;
	        D[r] = lastX;
	        C[r] = lastY;
	        pointsDeltaXY[r * 2] = lastX;
	        pointsDeltaXY[r * 2 + 1] = lastY;
	        if (J) {
	    Q.beginPath();
	    Q.moveTo(lastX, lastY)
	    }
	        k[0] = lastX;
	        k[1] = lastY;
	        r++;
	        if (o) {
	            m(i, "losecapture", n);
	            i.setCapture()
	        } else {
	            m(window, "blur", n)
	        }
	}
    //鼠标移动事件
    var A = function(W) {
        if (!L) {
            return
        }
        var Y = B(W);//坐标
        if (!Y) {
            return
        }
        e[r] = Y[0];
        d[r] = Y[1];
        I[r * 2] = Y[0];
        I[r * 2 + 1] = Y[1];
        D[r] = Y[0] - k[0];
        C[r] = Y[1] - k[1];
        pointsDeltaXY[r * 2] = D[r];
        pointsDeltaXY[r * 2 + 1] = C[r];
        if (J) {
            Q.lineTo(Y[0], Y[1]);
            Q.stroke()
        } else {
            var X = T[u].e.path;
            X.value = X.value.replace(" e", "," + Y[0] + "," + Y[1] + " e")
        }
        k[0] = Y[0];
        k[1] = Y[1];
        r++
    };

	//触摸滑动事件
	function onTouchMove(event) {
		var top,left;    
		top=getY(i);    
		left=getX(i);
	    event.preventDefault();
	    lastX=event.touches[0].clientX;
	    lastY=event.touches[0].clientY;
		lastX= parseInt(lastX - left+document.body.scrollLeft);
		lastY = parseInt(lastY -top+document.body.scrollTop);
	
	        e[r] = lastX;
	        d[r] = lastY;
	        I[r * 2] = lastX;
	        I[r * 2 + 1] = lastY;
	        D[r] = lastX - k[0];
	        C[r] = lastY - k[1];
	        pointsDeltaXY[r * 2] = D[r];
	        pointsDeltaXY[r * 2 + 1] = C[r];
	        if (J) {
		Q.lineTo(lastX,lastY);
	    Q.stroke()
	            } else {
	            var X = T[u].e.path;
	            X.value = X.value.replace(" e", "," + lastX + "," + lastY + " e")
	        }
	        k[0] = lastX;
	        k[1] = lastY;
	        r++
	}

    //鼠标松开事件
    var n = function(W) {
        if (!L) {
            return
        }
        L = false;
        if (1 === r) {
            if (!J) {
                T[u].e.style.visibility = "hidden"
            }
            return
        }
        if (J) {
            Q.closePath();
            var Z = i.cloneNode(false);
            Z.style.display = "none";
            Z.getContext("2d").drawImage(i, 0, 0);
            T[u] = {
                e: Z
            };
            Z = null
        }
        var aa = T[u];
        aa.count = r;
        aa.x = e.slice(0);
        aa.y = d.slice(0);
        aa.xy = I.slice(0);
        aa.deltaX = D.slice(0);
        aa.deltaY = C.slice(0);
        aa.deltaXY = pointsDeltaXY.slice(0);
        u++;
        var X = [];
        for (var Y = 0; Y < r; Y++) {
            X[Y] = "[" + e[Y] + ", " + d[Y] + "]"
        }
        if (o) {
            j(i, "losecapture", n);
            i.releaseCapture()
        } else {
            j(window, "blur", n)
        }
        if (1 === u) {
            i.className = "writting"
        }
        s(u);
    };
	//触摸结束
	function onTouchEnd(event) {
	
	        if (1 === r) {
	            if (!J) {
	                T[u].e.style.visibility = "hidden"
	            }
	            return
	        }
	        if (J) {
		Q.closePath();
	            var Z = i.cloneNode(false);
	            Z.style.display = "none";
	            Z.getContext("2d").drawImage(i, 0, 0);
	            T[u] = {
	                e: Z
	            };
	            Z = null
	        }
	        var aa = T[u];
	        aa.count = r;
	        aa.x = e.slice(0);
	        aa.y = d.slice(0);
	        aa.xy = I.slice(0);
	        aa.deltaX = D.slice(0);
	        aa.deltaY = C.slice(0);
	        aa.deltaXY = pointsDeltaXY.slice(0);
	        u++;
	        var X = [];
	        for (var Y = 0; Y < r; Y++) {
	            X[Y] = "[" + e[Y] + ", " + d[Y] + "]"
	        }
	        if (o) {
	            j(i, "losecapture", n);
	            i.releaseCapture()
	        } else {
	            j(window, "blur", n)
	        }
	        if (1 === u) {
	            i.className = "writting"
	        }
	        s(u);
	}
    //清空所有
    var V = function(W) {
        if (0 === u) {
            return
        }
        var ab = "";
        if (J) {
            Q.clearRect(0, 0, N, R)
        }
        for (var Z = 0; Z < u; Z++) {
            T[Z].e.style.visibility = "hidden"
        }
        u = 0;
        i.className = ""
    };
    var p = function(W, ab) {
        var aa = ab || W.length;
        var Z = "";
        var ad = "";
        for (var X = 0; X < aa; ++X) {
            var ac = W[X];
            ad = X ? ",eb,": "";
            var Y = ad + ac.deltaXY.join(",");
            Z += Y
        }
        return Z

    };
    this.ajax_callback = function(X) {
        obj.callback&&obj.callback(X)
    };
    QQShuru.HWPanel.ajax_callback = this.ajax_callback;
    var s = function(Y) {
        var Z = p(T, Y);
        var ab = "QQShuru.HWPanel.ajax_callback";
        var W = "https://handwriting.shuru.qq.com/cloud/cgi-bin/cloud_hw_pub.wsgi";
        var aa = "track_str=" + Z + "&cmd=0";
        var X = W + "?" + aa;
        QQShuru.Util.Ajax.get(X, ab)
    };

	//是否支持触摸
	var touchable = 'ontouchstart' in document;
	if (touchable) {
	    m(i, 'touchstart', onTouchStart);
	    m(i, 'touchmove', onTouchMove);
	    m(i, 'touchend', n);
	}else{
	    m(i, "mousedown", l);
	    m(i, "mousemove", A);
	    m(i, "mouseup", n);
	}

    m(i, "dblclick", V);
    m(i, "contextmenu",
        function(W) {
            o ? (W.returnValue = false) : W.preventDefault()
        });
    m(h, "mouseup", n);

    if(obj.clearBtnId){
        m(document.querySelector(obj.clearBtnId), "click", V);
    }
    this.clear=V;//暴露清空canvas的方法到外部
};