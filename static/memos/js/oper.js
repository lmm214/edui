/**
 * open_action: 打开这个页面执行的操作
 * open_text：打开这页面需要复原的输入框的内容
 */

var apiUrl = localStorage.getItem('apiUrl') || ''
var memoLock = localStorage.getItem('memoLock') || ''

if (apiUrl) {
  $('#blog_info').hide()
  $('#apiUrl').val(apiUrl)
}
if(memoLock){
  if(memoLock !== "PUBLIC"){
    $('#locked').show()
    $('#unlock').hide()
  }else{
    $('#locked').hide()
    $('#unlock').show()
  }
}else{
  localStorage.setItem("memoLock","PUBLIC");
}

//监听输入结束，保存未发送内容到本地
$('#content').blur(function () {
  localStorage.setItem("contentNow", $('#content').val());
})


//监听拖拽事件，实现拖拽到窗口上传图片
initDrag()
//监听复制粘贴事件，实现粘贴上传图片
document.addEventListener('paste', function (e) {
  let photo = null
  if (e.clipboardData.files[0]) {
    photo = e.clipboardData.files[0]
  } else if (e.clipboardData.items[0] && e.clipboardData.items[0].getAsFile()) {
    photo = e.clipboardData.items[0].getAsFile()
  }

  if (photo != null) {
    uploadImage(photo)
  }
})

function initDrag() {
  var file = null
  var obj = $('#content')[0]
  obj.ondragenter = function (ev) {
    if (ev.target.className === 'common-editor-inputer') {
      $.message({
        message: '拖拽到窗口上传该图片',
        autoClose: false
      })
      $('body').css('opacity', 0.3)
    }

    ev.dataTransfer.dropEffect = 'copy'
  }
  obj.ondragover = function (ev) {
    ev.preventDefault() //防止默认事件拖入图片 放开的时候打开图片了
    ev.dataTransfer.dropEffect = 'copy'
  }
  obj.ondrop = function (ev) {
    $('body').css('opacity', 1)
    ev.preventDefault()
    var files = ev.dataTransfer.files || ev.target.files
    for (var i = 0; i < files.length; i++) {
        file = files[i]
    }
    uploadImage(file)
  }
  obj.ondragleave = function (ev) {
    ev.preventDefault()
    if (ev.target.className === 'common-editor-inputer') {
      console.log('ondragleave' + ev.target.tagName)
      $.message({
        message: '取消上传'
      })
      $('body').css('opacity', 1)
    }
  }
}

let relistNow = []
function uploadImage(data) {
  //显示上传中的动画……
  $.message({
    message: '上传图片中……',
    autoClose: false
  })
  //根据data判断是图片地址还是base64加密的数据
    const formData = new FormData()
    if (localStorage.getItem('apiUrl')) {
      formData.append('file', data)
      $.ajax({
        url: apiUrl.replace(/api\/memo/,'api/resource'),
        data: formData,
        type: 'post',
        cache: false,
        processData: false,
        contentType: false,
        dataType: 'json',

        success: function (result) {
          console.log(result)
          if (result.data.id) {
            //获取到图片
            relistNow.push(result.data.id)
            localStorage.setItem("resourceIdList", JSON.stringify(relistNow));
                $.message({
                  message: '上传成功'
                })
          } else {
            //发送失败
            localStorage.removeItem("resourceIdList");
                $.message({
                  message: '上传图片失败'
                })
          }
        }
      })
    } else {
      $.message({
        message: '所需要信息不足，请先填写好绑定信息'
      })
    }
}

$('#saveKey').click(function () {
  // 保存数据
  localStorage.setItem("apiUrl", $('#apiUrl').val());
  $.message({
    message: '保存信息成功'
  })
  $('#blog_info').hide()
})

$('#tags').click(function () {
  if (localStorage.getItem('apiUrl')) {
      var tagUrl = apiUrl.replace(/api\/memo/,'api/tag')
      var tagDom = ""
      $.get(tagUrl,function(data,status){
        var arrData = data.data
        $.each(arrData, function(i,obj){
          tagDom += '<span class="item-container">#'+obj+'</span>'
        });
        //console.log(tagDom)
        $("#taglist").html(tagDom).slideToggle(500)
      });
    } else {
      $.message({
        message: '请先填写好 API 链接'
      })
    }
})

$('#unlock,#locked').click(function () {
    var nowlock = localStorage.getItem('memoLock')
    var lockDom = '<span class="item-lock'+ (nowlock == 'PUBLIC' ? ' lock-now' : '')+'" data-type="PUBLIC">公开</span><span class="item-lock'+ (nowlock == 'PRIVATE' ? ' lock-now' : '')+'" data-type="PRIVATE">仅自己</span><span class="item-lock'+ (nowlock == 'PROTECTED' ? ' lock-now' : '')+'" data-type="PROTECTED">登录可见</span>'
    $("#visibilitylist").html(lockDom).slideToggle(500)
})
$(document).on("click",".item-lock",function () {
    _this = $(this)[0].dataset.type
    if(_this !== "PUBLIC"){
      $('#locked').show()
      $('#unlock').hide()
    }else{
      $('#locked').hide()
      $('#unlock').show()
    }
    localStorage.setItem("memoLock", _this);
        $.message({
          message: '设置成功，当前为： '+ _this
        })
        $('#visibilitylist').hide()
})

$(document).on("click",".item-container",function () {
  var tagHtml = $(this).text()+" "
  add(tagHtml);
})

$('#newtodo').click(function () {
  var tagHtml = "\n- [ ] "
  add(tagHtml);
})

$('#upres').click(async function () {
  $('#inFile').click()
})

$('#inFile').on('change', function(data){
  var fileVal = $('#inFile').val();
  var file = null
  if(fileVal == '') {
    return;
  }
  file= this.files[0];
  uploadImage(file)
});

function add(str) {
  var tc = document.getElementById("content");
  var tclen = tc.value.length;
  tc.focus();
  if(typeof document.selection != "undefined"){
    document.selection.createRange().text = str;
  }else{
    tc.value = 
      tc.value.substr(0, tc.selectionStart) +
      str +
      tc.value.substring(tc.selectionStart, tclen);
  }
}

$('#blog_info_edit').click(function () {
  $('#blog_info').slideToggle()
})

//发送操作
$('#content_submit_text').click(function () {
  var contentVal = $('#content').val()
  if(contentVal){
    sendText()
  }else{
    $.message({message: '写点什么，再记呗？'})
  }
})

function sendText() {
  if (localStorage.getItem('apiUrl')) {
      $.message({message: '发送中～～'})
      //$("#content_submit_text").attr('disabled','disabled');
      let content = $('#content').val()
      $.ajax({
        url:apiUrl,
        type:"POST",
        data:JSON.stringify({
          'content': content,
          'visibility': localStorage.getItem('memoLock') || '',
          'resourceIdList': JSON.parse(localStorage.getItem("resourceIdList")) || [],
        }),
        contentType:"application/json;",
        dataType:"json",
        success: function(result){
              //发送成功
              console.log(result)
              localStorage.removeItem("resourceIdList");
                  $.message({
                    message: '发送成功！😊'
                  })
                  //$("#content_submit_text").removeAttr('disabled');
                  $('#content').val('')
      },error:function(err){//清空open_action（打开时候进行的操作）,同时清空open_content
                localStorage.removeItem("resourceIdList");
                  $.message({
                    message: '网络问题，发送失败！😭（记得点下小锁图标，设置一下状态哦）'
                  })
              },
      })
    } else {
      $.message({
        message: '请先填写好 API 链接'
      })
    }
}  