// ==UserScript==
// @name        wnacg-Viewer
// @description wnacg-Viewer
// @version     2.0
// @author      MrDaDaDo
// @match       https://www.wnacg.com/photos-slide-aid-*.html
// @match       https://www.wnacg.org/photos-slide-aid-*.html
// @require     https://code.jquery.com/jquery-3.3.1.min.js
// ==/UserScript==

(() => {
    const $ = window.jQuery;

    const go = (imageSrcList) => {
        $("#shareBox, #control_block, #mask_panel, #cite_vote, #page_scale, .header, .footer").remove();

        const $parent = $("#img_list").parent();
        const title = document.title.replace(' - 列表 - 紳士漫畫-專註分享漢化本子|邪惡漫畫', '');
        $("#img_list, #img_load").remove();

        const $favDiv = $('<div id="fav-div" style="text-align: center"></div>');
        $parent.append($favDiv);
        initAddToFavBtn($favDiv);

        const $imgDiv = $('<div id="wnacg-viewer-img-list"></div>');
        $parent.append($imgDiv);

        $imgDiv.append(`<div id="wnacg-viewer-title" style="text-align:center;color:#999;padding-bottom:10px;font-size:26px;"><span>${title}</span></div>`);
        imageSrcList.forEach((imageSrc, i) => {
            $imgDiv.append(genImageDivHtml(imageSrc, i + 1, imageSrcList.length));
        });
    };

    const initAddToFavBtn = async ($parent) => {
        const data = await $.get("https://www.wnacg.com/users-users_fav.html");
        const regex = /<label class="nav_label">書架分類：<\/label>([\s\S]*?)<a class="btn_blue" href="\/\?ctl=users&act=favclass">管理分類<\/a>/;
        const match = data.match(regex);
        const favHtml = match[1];
        const favRegex = /users-users_fav-c-(\d+).html ">(.*?)</g;

        let favMatch;
        while ((favMatch = favRegex.exec(favHtml)) !== null) {
            const [$favId, $favName] = [favMatch[1], favMatch[2]];
            const $btnId = `add-to-fav-btn-${$favId}`;
            const $btn = $(`
    <input id="${$btnId}" type="button" style="
        display: inline-block;
        width: 80px;
        height: 40px;
        line-height: 40px;
        padding: 0;
        margin: 5px;
        font-size: 14px;
        font-family: 'Courier New', Courier, monospace;
        text-align: center;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    " value="${$favName}">
`);

            $btn.hover(
                function() {
                    $(this).css({
                        transform: 'scale(1.1)',
                    });
                },
                function() {
                    $(this).css({
                        transform: 'scale(1)',
                    });
                }
            );

            $parent.append($btn);

            $parent.append($btn);
            $(`#${$btnId}`).click(() => addToFav($favId));
        }
    };

    const addToFav = ($favId) => {
        const aid = window.location.href.match(/photos-slide-aid-(\d+)\.html/)[1];
        $.post(`https://www.wnacg.com/users-save_fav-id-${aid}.html`, { favc_id: $favId });
    };

    const parseImageSrcList = (feedXml) => {
        const result = [];
        const pattern = /src="\/\/(.*?)"/g;
        let m;
        while ((m = pattern.exec(feedXml)) !== null) {
            result.push(`//${m[1]}`);
        }
        return result;
    };

    const genImageDivHtml = (imageSrc, index, total) => `
        <div style="text-align:center;color:#999;padding-bottom:10px;font-size:13px;">
            <img src="${imageSrc}" width="960px"><br>
            <span>${index}/${total}</span>
        </div>
    `;

    const photosGgalleryScript = location.href.replace("photos-slide-aid", "photos-gallery-aid");
    $.get(photosGgalleryScript, (scripts) => {
        const imageSrcList = [];
        scripts.split("\n").forEach((script) => {
            if (script.includes("var imglist")) {
                imageSrcList.push(...script.match(/\/\/[^"]+/gm).map(urlString => urlString.replace("\\", "")));
            }
        });
        go(imageSrcList);
    });
})();
