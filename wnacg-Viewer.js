// ==UserScript==
// @name         wnacg-Viewer
// @version      1.0
// @author       MrDaDaDo
// @include      /^https:\/\/www\.wnacg\.(org|com)\/photos-slide-aid-(\d)+\.html$/
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// ==/UserScript==

(function() {
    var $ = window.jQuery;
    var go = function(imageSrcList) {
        $("#shareBox").remove();
        $("#control_block").remove();
        $("#mask_panel").remove();
        $("#cite_vote").remove();
        $("#page_scale").remove();
        $(".header").remove();
        $(".footer").remove();
        var $parent = $("#img_list").parent();
        var title = document.title.replace(' - 列表 - 紳士漫畫-專註分享漢化本子|邪惡漫畫', '');
        $("#img_list").remove();
        $("#img_load").remove();
        var $div = $("<div id='wnacg-viewer-img-list'></div>");
        $parent.append($div);
        $div.append('<div id="wnacg-viewer-title" style="text-align:center;color:#999;padding-bottom:10px;font-size:26px;"><span>' + title + '</span></div>');
        for(var i = 0; i <imageSrcList.length; i++) {
            var imageSrc = imageSrcList[i];
            $div.append(genImageDivHtml(imageSrc, (i + 1), imageSrcList.length));
        }
    }
    var parseImageSrcList = function(feedXml) {
        var result = [];
        var pattern = /src="\/\/(.*?)"/g;
        var m;
        while (m = pattern.exec(feedXml)) {
            result.push("//" + m[1]);
        }
        return result;
    }
    var genImageDivHtml = function(imageSrc, index, total) {
        return '<div style="text-align:center;color:#999;padding-bottom:10px;font-size:13px;"><img src="' + imageSrc + '" width="960px"><br><span>' + index + '/' + total + '</span></div>';
    }
    var photosGgalleryScript = location.href.replace("photos-slide-aid", "photos-gallery-aid");
    $.get(photosGgalleryScript, function(scripts) {
        var imageSrcList = [];
        scripts.split("\n").forEach(function(script) {
            if(script.indexOf("var imglist") >= 0) {
                script.match(/\/\/[^"]+/gm).forEach(function(urlString) {
                    imageSrcList.push(urlString.replace("\\",""));
                });
            }
        });
        go(imageSrcList);
    });
})();