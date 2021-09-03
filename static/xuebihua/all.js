var animationWriter;
var quizWriter;
var character;
function updateCharacter(character) {
    $("svg g").remove();
    animationWriter = HanziWriter.create('animation-target', character, {
        width: 360,
        height: 360,
        showCharacter: false
    });
    quizWriter = HanziWriter.create('quiz-target', character, {
        width: 360,
        height: 360,
        showCharacter: false,
        showHintAfterMisses: 1
    });
    animationWriter.animateCharacter();
    quizWriter.quiz();
    $('html,body').animate({scrollTop:0}, 0);
}

function callbackfunc(ret){
    var Cand = JSON.stringify(ret,["cand"]);
    character = JSON.parse(Cand).cand[0];
    $('#character-select').val(character)
}

function init() {
    QQShuru.HWPanel({
        canvasId:"#canvas",
        lineColor:"#4285f4",
        clearBtnId:"#clear",
        callback:callbackfunc
    });
}
$(function() {
    $('#character-submit').on('click', function(evt) {
        var character = $('#character-select').val();
        evt.preventDefault();
        updateCharacter(character);
        $('#clear').click();
        $('#canvasWrap').animate({top: '-300px'},100);
    });

    $('#character-shouxie').on('click', function() {
        $('#canvasWrap').animate({top: '48px'},200);
    });

    $('.wrapper ul li').on('click', function(evt) {
        var character = $(this).text();
        $('#character-select').val(character)
        evt.preventDefault();
        updateCharacter(character);
    });

    var $mainSidebar=$("#sidebar-main");
	$mainSidebar.simplerSidebar({
		align:"left",
		attr:"sidebar-main",
		top:48,
		selectors:{
            trigger:"#sidebar-main-trigger",
            quitter: "li"
		}
	});
});