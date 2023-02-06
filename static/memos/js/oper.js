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
      apiUrl = localStorage.getItem('apiUrl')
      formData.append('file', data)
      $.ajax({
        url: apiUrl.replace(/api\/memo/,'api/resource/blob'),
        data: formData,
        type: 'post',
        cache: false,
        processData: false,
        contentType: false,
        dataType: 'json',

        success: function (result) {
          //console.log(result)
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

$('#getone').click(function () {
  getOne()
})

function getOne(){
  if (localStorage.getItem('apiUrl')) {
    apiUrl = localStorage.getItem('apiUrl')
    $("#randomlist").html('').hide()
        var getUrl = apiUrl+'&rowStatus=NORMAL&limit=1'
        $.get(getUrl,function(data){
          var getData = data.data[0]
          randDom(getData)
        });
} else {
    $.message({
      message: '请先填写好 API 链接'
    })
}
}

$('#tags').click(function () {
  if (localStorage.getItem('apiUrl')) {
    apiUrl = localStorage.getItem('apiUrl')
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

dayjs.extend(window.dayjs_plugin_relativeTime)
dayjs.locale('zh-cn')

$('#search').click(function () {
  if (localStorage.getItem('apiUrl')) {
    apiUrl = localStorage.getItem('apiUrl')
    $("#randomlist").html('').hide()
    var searchDom = ""
    const pattern = $("textarea[name=text]").val()
    if(pattern){
      $.get(apiUrl,function(data){
        const options = {keys: ['content']};
        const fuse = new Fuse(data.data, options);
        var searchData = fuse.search(pattern)
        for(var i=0;i < searchData.length;i++){
          searchDom += '<div class="random-item"><div class="random-time"><span id="random-link" data-id="'+searchData[i].item.id+'"><svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M864 640a32 32 0 0 1 64 0v224.096A63.936 63.936 0 0 1 864.096 928H159.904A63.936 63.936 0 0 1 96 864.096V159.904C96 124.608 124.64 96 159.904 96H384a32 32 0 0 1 0 64H192.064A31.904 31.904 0 0 0 160 192.064v639.872A31.904 31.904 0 0 0 192.064 864h639.872A31.904 31.904 0 0 0 864 831.936V640zm-485.184 52.48a31.84 31.84 0 0 1-45.12-.128 31.808 31.808 0 0 1-.128-45.12L815.04 166.048l-176.128.736a31.392 31.392 0 0 1-31.584-31.744 32.32 32.32 0 0 1 31.84-32l255.232-1.056a31.36 31.36 0 0 1 31.584 31.584L924.928 388.8a32.32 32.32 0 0 1-32 31.84 31.392 31.392 0 0 1-31.712-31.584l.736-179.392L378.816 692.48z" fill="#666" data-spm-anchor-id="a313x.7781069.0.i12" class="selected"/></svg></span><span id="random-delete" data-id="'+searchData[i].item.id+'"><svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M224 322.6h576c16.6 0 30-13.4 30-30s-13.4-30-30-30H224c-16.6 0-30 13.4-30 30 0 16.5 13.5 30 30 30zm66.1-144.2h443.8c16.6 0 30-13.4 30-30s-13.4-30-30-30H290.1c-16.6 0-30 13.4-30 30s13.4 30 30 30zm339.5 435.5H394.4c-16.6 0-30 13.4-30 30s13.4 30 30 30h235.2c16.6 0 30-13.4 30-30s-13.4-30-30-30z" fill="#666"/><path d="M850.3 403.9H173.7c-33 0-60 27-60 60v360c0 33 27 60 60 60h676.6c33 0 60-27 60-60v-360c0-33-27-60-60-60zm-.1 419.8l-.1.1H173.9l-.1-.1V464l.1-.1h676.2l.1.1v359.7z" fill="#666"/></svg></span>"'+dayjs(new Date(searchData[i].item.createdTs)*1000).fromNow()+'</div><div class="random-content">'+searchData[i].item.content.replace(/!\[.*?\]\((.*?)\)/g,' <img class="random-image" src="$1"/> ').replace(/\[(.*?)\]\((.*?)\)/g,' <a href="$2" target="_blank">$1</a> ')+'</div>'
          if(searchData[i].item.resourceList && searchData[i].item.resourceList.length > 0){
            var resourceList = searchData[i].item.resourceList;
            for(var j=0;j < resourceList.length;j++){
              var restype = resourceList[j].type.slice(0,5);
              if(restype == 'image'){
                searchDom += '<img class="random-image" src="'+apiUrl.replace(/api\/memo.*/,'')+'o/r/'+resourceList[j].id+'/'+resourceList[j].filename+'"/>'
              }
            }
          }
          searchDom += '</div>'
        }
        window.ViewImage && ViewImage.init('.random-image')
        $("#randomlist").html(searchDom).slideDown(500);
      });
    }else{
      $.message({
        message: '想搜点啥？'
      })
    }
  } else {
    $.message({
      message: '请先填写好 API 链接'
    })
  }
})

$('#random').click(function () {
  if (localStorage.getItem('apiUrl')) {
      apiUrl = localStorage.getItem('apiUrl')
      $("#randomlist").html('').hide()
      var nowTag = $("textarea[name=text]").val().replace(/#([^\s#]+)/,'$1') ;
      if( $("#taglist").is(':visible') && nowTag){
        var tagUrl = apiUrl+'&rowStatus=NORMAL&tag='+nowTag
        $.get(tagUrl,function(data){
          let randomNum = Math.floor(Math.random() * (data.data.length));
          var randomData = data.data[randomNum]
          randDom(randomData)
        })
      }else{
        var randomUrl1 = apiUrl.replace(/api\/memo/,'api/memo/amount')
        $.get(randomUrl1,function(data){
          let randomNum = Math.floor(Math.random() * (data.data)) + 1;
          var randomUrl2 = apiUrl+'&rowStatus=NORMAL&limit=1&offset='+randomNum
          $.get(randomUrl2,function(data){
            var randomData = data.data[0]
            randDom(randomData)
          });
        });
      }
    } else {
      $.message({
        message: '请先填写好 API 链接'
      })
    }
})

function randDom(randomData){
  apiUrl = localStorage.getItem('apiUrl')
  var randomDom = '<div class="random-item"><div class="random-time"><span id="random-link" data-id="'+randomData.id+'"><svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M864 640a32 32 0 0 1 64 0v224.096A63.936 63.936 0 0 1 864.096 928H159.904A63.936 63.936 0 0 1 96 864.096V159.904C96 124.608 124.64 96 159.904 96H384a32 32 0 0 1 0 64H192.064A31.904 31.904 0 0 0 160 192.064v639.872A31.904 31.904 0 0 0 192.064 864h639.872A31.904 31.904 0 0 0 864 831.936V640zm-485.184 52.48a31.84 31.84 0 0 1-45.12-.128 31.808 31.808 0 0 1-.128-45.12L815.04 166.048l-176.128.736a31.392 31.392 0 0 1-31.584-31.744 32.32 32.32 0 0 1 31.84-32l255.232-1.056a31.36 31.36 0 0 1 31.584 31.584L924.928 388.8a32.32 32.32 0 0 1-32 31.84 31.392 31.392 0 0 1-31.712-31.584l.736-179.392L378.816 692.48z" fill="#666" data-spm-anchor-id="a313x.7781069.0.i12" class="selected"/></svg></span><span id="random-delete" data-id="'+randomData.id+'"><svg class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M224 322.6h576c16.6 0 30-13.4 30-30s-13.4-30-30-30H224c-16.6 0-30 13.4-30 30 0 16.5 13.5 30 30 30zm66.1-144.2h443.8c16.6 0 30-13.4 30-30s-13.4-30-30-30H290.1c-16.6 0-30 13.4-30 30s13.4 30 30 30zm339.5 435.5H394.4c-16.6 0-30 13.4-30 30s13.4 30 30 30h235.2c16.6 0 30-13.4 30-30s-13.4-30-30-30z" fill="#666"/><path d="M850.3 403.9H173.7c-33 0-60 27-60 60v360c0 33 27 60 60 60h676.6c33 0 60-27 60-60v-360c0-33-27-60-60-60zm-.1 419.8l-.1.1H173.9l-.1-.1V464l.1-.1h676.2l.1.1v359.7z" fill="#666"/></svg></span>'+dayjs(new Date(randomData.createdTs)*1000).fromNow()+'</div><div class="random-content">'+randomData.content.replace(/!\[.*?\]\((.*?)\)/g,' <img class="random-image" src="$1"/> ').replace(/\[(.*?)\]\((.*?)\)/g,' <a href="$2" target="_blank">$1</a> ')+'</div>'
  if(randomData.resourceList && randomData.resourceList.length > 0){
    var resourceList = randomData.resourceList;
    for(var j=0;j < resourceList.length;j++){
      var restype = resourceList[j].type.slice(0,5);
      if(restype == 'image'){
        randomDom += '<img class="random-image" src="'+apiUrl.replace(/api\/memo.*/,'')+'o/r/'+resourceList[j].id+'/'+resourceList[j].filename+'"/>'
      }
    }
  }
  randomDom += '</div>'
  window.ViewImage && ViewImage.init('.random-image')
  $("#randomlist").html(randomDom).slideDown(500);
}

$(document).on("click","#random-link",function () {
  window.location.href =  apiUrl.replace(/api\/memo.*/,'')+"m/"+this.getAttribute('data-id');
})

$(document).on("click","#random-delete",function () {
  var memosId = this.getAttribute('data-id');
  var deleteUrl = apiUrl.replace(/api\/memo(.*)/,'api/memo/'+memosId+'$1')
  $.ajax({
    url:deleteUrl,
    type:"PATCH",
    data:JSON.stringify({
      'id': memosId,
      'rowStatus': "ARCHIVED"
    }),
    contentType:"application/json;",
    dataType:"json",
    success: function(result){
          $("#randomlist").html('').hide()
              $.message({
                message: '归档成功！😊'
              })
  },error:function(err){//清空open_action（打开时候进行的操作）,同时清空open_content
              $.message({
                message: '网络问题，归档失败！😭'
              })
          }
  })
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
    apiUrl = localStorage.getItem('apiUrl')
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
              getOne()
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