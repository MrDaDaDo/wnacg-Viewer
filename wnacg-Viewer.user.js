// ==UserScript==
// @name        wnacg-Viewer
// @description A wnacg-Viewer
// @version     2.3
// @author      MrDaDaDo
// @match       https://wnacg.com/*
// @match       https://www.wnacg.com/*
// @run-at      document-end
// @require     https://code.jquery.com/jquery-3.3.1.min.js
// @updateURL   https://github.com/MrDaDaDo/wnacg-Viewer/raw/main/wnacg-Viewer.user.js
// @downloadURL https://github.com/MrDaDaDo/wnacg-Viewer/raw/main/wnacg-Viewer.user.js
// @namespace   https://github.com/MrDaDaDo/wnacg-Viewer
// @license     GPL-3.0-or-later
// ==/UserScript==

(() => {
    const $ = window.jQuery;

    // *****albums*****
    const goAlbums = () => {
        $('.pic_box a').each((index, element) => {
            const $linkElement = $(element);
            const href = $linkElement.attr('href');
            $linkElement.attr('href', href.replace('index', 'slide'));
        });
    };

    // *****slide*****
    const goSlide = () => {
        const photosGalleryScriptUrl = location.href.replace('photos-slide-aid', 'photos-gallery-aid');
        $.get(photosGalleryScriptUrl, (scripts) => {
            const imageSrcList = scripts.split('\n')
                .filter(script => script.includes('var imglist'))
                .flatMap(script => script.match(/\/\/[^"]+/gm).map(urlString => urlString.replace('\\', '')));
            viewSlide(imageSrcList);
        });
    };

    const viewSlide = (imageSrcList) => {
        $('#shareBox, #control_block, #mask_panel, #cite_vote, #page_scale, .header, .footer').remove();

        const $parent = $('#img_list').parent();
        $('#img_list, #img_load').remove();

        const $favLabel = $('<label class="nav_list" style="display: block; text-align: center; margin: 0 auto;"></label>');
        $parent.append($favLabel);
        initAddToFavBtn($favLabel);

        const $imgDiv = $('<div id="wnacg-viewer-img-list"></div>');
        $parent.append($imgDiv);

        const title = document.title.replace(' - 列表 - 紳士漫畫-專註分享漢化本子|邪惡漫畫', '');
        const titleMatch = title.match(/^(.*?)\s*\[([^\[\]]+?)\]\s*(.*)$/);
        const [prefix, author, restTitle] = titleMatch ? titleMatch.slice(1, 4) : [title, null, ''];
        const $titleDiv = $('<div id="wnacg-viewer-title" style="text-align:center;color:#999;padding-bottom:10px;font-size:26px;"></div>');

        if (author) {
            const $link = $(`<a href="https://www.wnacg.com/search/?q=${author}&f=_all&s=create_time_DESC&syn=yes" target="_blank" style="color: #4A90E2;">${author}</a>`);
            $titleDiv.append(prefix).append(' [').append($link).append(`] ${restTitle}`);
        } else {
            $titleDiv.append(title);
        }
        $imgDiv.append($titleDiv);

        const batchSize = 10; // 每次載入的圖片數量
        let currentBatch = 0;

        const loadNextBatch = () => {
            const startIndex = currentBatch * batchSize;
            const endIndex = Math.min(startIndex + batchSize, imageSrcList.length);

            for (let i = startIndex; i < endIndex; i++) {
                $imgDiv.append(genImageDivHtml(imageSrcList[i], i + 1, imageSrcList.length));
            }

            currentBatch++;
            if (startIndex < imageSrcList.length) {
                setTimeout(loadNextBatch, 2000); // 可以根據需求調整延遲時間
            }
        };

        loadNextBatch();
    };

    const initAddToFavBtn = async ($parent) => {
        const data = await $.get('https://www.wnacg.com/users-users_fav.html');
        const regex = /<label class="nav_label">書架分類：<\/label>([\s\S]*?)<a class="btn_blue" href="\/\?ctl=users&act=favclass">管理分類<\/a>/;
        const match = data.match(regex);
        const favHtml = match[1];
        const favRegex = /users-users_fav-c-(\d+).html ">(.*?)</g;

        let favMatch;
        while ((favMatch = favRegex.exec(favHtml)) !== null) {
            const [favId, favName] = [favMatch[1], favMatch[2]];
            const btnId = `add-to-fav-btn-${favId}`;
            const $btn = $(`<a id="${btnId}">${favName}</a>`);
            $parent.append($btn);
            $(`#${btnId}`).click(() => addToFav(favId));
        }
    };

    const addToFav = (favId) => {
        const aid = window.location.href.match(/photos-slide-aid-(\d+)\.html/)[1];
        $.post(`https://www.wnacg.com/users-save_fav-id-${aid}.html`, { favc_id: favId })
            .done(() => {
                alert('加入書架成功');
            })
            .fail((error) => {
                alert(`發生錯誤: ${error.statusText}`);
            });
    };

    const genImageDivHtml = (imageSrc, index, total) => `
        <div style="text-align:center;color:#999;padding-bottom:10px;font-size:13px;">
            <img src="${imageSrc}" width="960px"><br>
            <span>${index}/${total}</span>
        </div>
    `;

    const url = window.location.href;
    if (url === 'https://www.wnacg.com/' || url.startsWith('https://www.wnacg.com/albums') || url.startsWith('https://www.wnacg.com/search')) {
        goAlbums();
    } else if (url.startsWith('https://www.wnacg.com/photos-slide-aid')) {
        goSlide();
    }
})();
