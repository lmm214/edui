window.onload=function(){

        var board=document.getElementById('board'); //3X3棋盘

        var chooseX=document.getElementById('chooseX');//选择角色 X or O
        var chooseO=document.getElementById('chooseO');//选择角色 X or O

        var scope=document.getElementById('scope');
        var scopes=scope.getElementsByTagName('p');//得分统计

        var tic=document.getElementById('tic');    
        for (var i = 0; i < 9; i++) {tic.innerHTML+='<div id="box'+i+'" class="box" ></div>';}
        var boxes=tic.getElementsByTagName('div'); //循环加入方格元素，得到9宫格

        //默认角色选择及按键选择
        chooseX.checked='checked';
        var yourRole=chooseX.value;
        var cpuRole=chooseO.value;
        chooseX.onclick=function(){
            yourRole=chooseX.value;cpuRole=chooseO.value;}
        chooseO.onclick=function(){
            yourRole=chooseO.value;cpuRole=chooseX.value;}

        //得分板初始化，总比赛局数，cpu胜，人胜，平局次数
        var totalGames=0;
        var cpuWins=0;
        var youWins=0;
        var draw=0;

        //初始化下棋次序，默认人先下，初始化下棋的步数，初始化一个棋盘数组
        var whoTurn=true;
        var step=0;
        var board=[0,0,0,
                   0,0,0,
                   0,0,0];

        init();//初始化数据！！！

        // 初始化函数，每局结束之后调用
        function init(){
            chooseX.removeAttribute("disabled");//每次初始化的时候是可以选角色的，启用按钮
            chooseO.removeAttribute("disabled");//每次初始化的时候是可以选角色的，启用按钮
            whoTurn=true;
            step=0; //步数归零
            for (var i = 0; i < boxes.length; i++) {
                boxes[i].innerHTML='';
                board[i]=0;
            }       //九宫格归零，棋盘数组归零
            if(totalGames%2==1){
                chooseX.disabled="disabled";//电脑先手的时候，不可以再选角色了，禁用按钮  
                chooseO.disabled="disabled";//电脑先手的时候，不可以再选角色了，禁用按钮
                whoTurn=false;
                cpu();
            }//交替先手，

        }

        //循环给每个格子添加点击事件
        for (var i = 0; i < boxes.length; i++) {
            boxes[i].index=i; //每个格子添加索引自定义属性

            boxes[i].onclick=function(){

                chooseX.disabled="disabled";//人先手的话，只要一点击棋盘就不能换角色了，禁用按钮  
                chooseO.disabled="disabled";//人先手的话，只要一点击棋盘就不能换角色了，禁用按钮

                if(this.innerHTML){return false;};   //如果点击的格子有内容，就禁止点击
                if(!whoTurn){return false;}; //判断是谁的顺序，

                whoTurn=false;   //交出控制权
                step++;         //本步下完，步数加1
                board[this.index]=-1;    //棋盘数组标记成-1，即you
                this.innerHTML=yourRole;  //在相应位置放上role

                if(isDraw()){   //如果点击后，判断是平局的话    
                    draw++      //平局的变量自加
                    scopes[3].innerHTML=draw;  //平局的数据填充到页面上
                    scopes[0].innerHTML=totalGames=youWins+cpuWins+draw; //统计局数
                    alert(isDraw()+"!");   //弹出平局提示
                    init();          //本局结束初始化数据
                    return false;
                }
                                    
                if(isWin()){      //每次下完后判断是否赢了
                    youWins++;
                    scopes[2].innerHTML=youWins;
                    scopes[0].innerHTML=totalGames=youWins+cpuWins+draw; //统计局数
                    alert("您获胜了！")
                    init();
                    return false;
                }
                cpu();  //调用cpu，让电脑下棋 

            }
        }

        //电脑下棋的函数
        function cpu(){


            if(whoTurn){return false;}; 
            whoTurn=true;     //交出控制权
            
            //step等于1的时候，就是后手，判断中位有没有失，没失去，占住，失去，随机在四个角上占位
            if(step==1||step==0){   //step等于0，先手，直接占中
                step++;           //步数自加
                if(!boxes[4].innerHTML){
                    board[4]=1;
                    boxes[4].innerHTML=cpuRole;
                }else{
                    var mayArr=[0,2,6,8];
                    var n=mayArr[Math.floor(Math.random()*4)];
                    board[n]=1;
                    boxes[n].innerHTML=cpuRole;
                }
             
            }else{                //首轮结束，需要判断了
                step++;           //步数自加
                var n=think();
                board[n]=1;
                boxes[n].innerHTML=cpuRole;

                if(isDraw()){
                    draw++
                    scopes[3].innerHTML=draw;
                    scopes[0].innerHTML=totalGames=youWins+cpuWins+draw; //统计局数
                    alert(isDraw()+"!"); 
                    init();
                    return false;
                }
                
                if(isWin()){
                    cpuWins++;
                    scopes[1].innerHTML=cpuWins;
                    scopes[0].innerHTML=totalGames=youWins+cpuWins+draw; //统计局数
                    alert("电脑获胜")
                    init();
                    return false;
                }
            }
        }

        //判断胜利的函数，8种连成一线的可能
        function isWin(){
            if(Math.abs(board[0]+board[1]+board[2])==3){return true}
                if(Math.abs(board[3]+board[4]+board[5])==3){return true}
                    if(Math.abs(board[6]+board[7]+board[8])==3){return true}
                        if(Math.abs(board[0]+board[3]+board[6])==3){return true}
                            if(Math.abs(board[1]+board[4]+board[7])==3){return true}
                                if(Math.abs(board[2]+board[5]+board[8])==3){return true}
                                    if(Math.abs(board[0]+board[4]+board[8])==3){return true}
                                        if(Math.abs(board[2]+board[4]+board[6])==3){return true}
            return false;
        }

        //判断平局的函数，如果步数超过9，其没有胜利方，返回平局
        function isDraw(){
            if(step>=9&&!isWin()){return '这是一场平局！'}
        }

        //超过两步后，计算机需要计算思考，把空棋盘位，依次填入计算机及人的棋子，
        //判断是否可以胜利，返回可能胜利的位置，都没有就随机下；
        function think(){
            var you=-1;
            var cpu=-1;
            for (var i = 0; i < board.length; i++) {
                if(board[i]==0){
                    board[i]=-1;                
                    if(isWin()){
                        you=i;
                        board[i]=0;
                        break;
                    }
                    board[i]=0;
                }
            }
            for (var i = 0; i < board.length; i++) {
                if(board[i]==0){
                    board[i]=1;
                    if(isWin()){
                        cpu=i;         
                        board[i]=0;
                        break;
                    }
                    board[i]=0;
                }
            }
            if(cpu!=-1){return cpu;}else if(you!=-1){return you}else{
                var mayArr=[];
                for (var i = 0; i < board.length; i++) {
                    if(board[i]==0){
                       mayArr.push(i);
                    }
                }
                return mayArr[Math.floor(Math.random()*mayArr.length)];
            }
        }
}
