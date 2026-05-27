// ==UserScript==
// @name        wnacg-Viewer
// @description wnacg-Viewer 功能：1. 書架管理—快速加入/移除書架；2. 幻燈片模式—自動切換，優化圖片載入；3. 專輯鏈接自動更新—連結至下拉閱讀；4. 關鍵字搜尋—輕鬆查找相關作品。
// @version     2.8.0
// @author      MrDaDaDo
// @match       https://wnacg.com/*
// @match       https://www.wnacg.com/*
// @run-at      document-end
// @require     https://code.jquery.com/jquery-3.3.1.min.js
// @namespace   https://github.com/MrDaDaDo/wnacg-Viewer
// @license     GPL-3.0-or-later
// @downloadURL https://github.com/MrDaDaDo/wnacg-Viewer/raw/main/wnacg-Viewer.user.js
// @updateURL   https://github.com/MrDaDaDo/wnacg-Viewer/raw/main/wnacg-Viewer.user.js
// @resource     MY_CSS https://www.wnacg.com/themes/weitu/images/style.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

(() => {
    const $ = window.jQuery;

    try {
        const cssContent = GM_getResourceText("MY_CSS");
        if (cssContent) GM_addStyle(cssContent);
    } catch (e) { }

    const genFavBtnId = favId => `add-to-fav-btn-${favId}`;

    const getAid = () => window.location.href.match(/photos-slide-aid-(\d+)\.html/)[1];

    const addToFav = favId => {
        const aid = getAid();
        $.post(`https://www.wnacg.com/users-save_fav-id-${aid}.html`, { favc_id: favId })
            .done(() => {
                const $btn = $(`#${genFavBtnId(favId)}`);
                markFavBtnCur($btn);
                alert('加入書架成功');
                setIsInFav(aid, favId);
            })
            .fail(() => {
                alert('加入書架失敗');
            });
    };

    const deleteFav = (favId, link) => {
        const postData = {
            ajax: true,
            _t: Math.random(),
        };
        $.post(link, postData)
            .done(() => {
                alert('移出書架成功');
                const $btn = $(`#${genFavBtnId(favId)}`);
                unmarkFavBtnCur($btn);
                $btn.off('click').on('click', () => addToFav(favId));
            })
            .fail(() => {
                alert('移出書架失敗');
            });
    };

    const setIsInFav = async (aid, favId, page = 1) => {
        const data = await $.get(`https://www.wnacg.com/users-users_fav-page-${page}-c-${favId}.html`);
        if (data.indexOf(`photos-index-aid-${aid}.html`) >= 0) {
            const $btn = $(`#${genFavBtnId(favId)}`);
            markFavBtnCur($btn);
            $btn.off('click');
            const $data = $(data);
            $data.find('.box_cel.u_listcon').each(function () {
                const $div = $(this);
                const $targetLink = $div.find(`a[href*='photos-index-aid-${aid}.html']`);
                if ($targetLink.length > 0) {
                    const onclickValue = $div.find("a[onclick*='Mui.box.show']").attr('onclick');
                    const deleteLinkMatch = onclickValue.match(/Mui\.box\.show\('(.+?)'\)/);
                    if (deleteLinkMatch && deleteLinkMatch[1]) {
                        const deleteLink = deleteLinkMatch[1];
                        $btn.on('click', () => deleteFav(favId, deleteLink));
                    }
                }
            });
        } else if (data.indexOf('>後頁') >= 0) {
            setIsInFav(aid, favId, page + 1);
        } else {
            const $btn = $(`#${genFavBtnId(favId)}`);
            $btn.off('click').on('click', () => addToFav(favId));
        }
    };

    const favBtnStyle = {
        'display': 'inline-block',
        'cursor': 'pointer',
        'margin': '4px 6px',
        'padding': '6px 14px',
        'border': '1px solid #4A90E2',
        'border-radius': '4px',
        'color': '#4A90E2',
        'background': '#fff',
        'font-size': '14px',
        'text-decoration': 'none',
        'user-select': 'none',
    };

    const applyFavBtnStyle = $btn => {
        $btn.css(favBtnStyle);
        $btn.hover(
            function () { if (!$(this).hasClass('cur')) $(this).css('background', '#eaf3fc'); },
            function () { if (!$(this).hasClass('cur')) $(this).css('background', '#fff'); },
        );
    };

    const markFavBtnCur = $btn => {
        $btn.addClass('cur').css({ 'background': '#4A90E2', 'color': '#fff' });
    };

    const unmarkFavBtnCur = $btn => {
        $btn.removeClass('cur').css({ 'background': '#fff', 'color': '#4A90E2' });
    };

    const initAddToFavBtn = async ($parent) => {
        let data;
        try {
            data = await $.get('https://www.wnacg.com/users-users_fav.html');
        } catch (e) {
            $parent.append('<span style="color:#999;font-size:13px;">（書架功能需登入）</span>');
            return;
        }
        const regex = /<label class="nav_label">書架分類：<\/label>([\s\S]*?)<a class="btn_blue" href="\/\?ctl=users&act=favclass">管理分類<\/a>/;
        const match = data.match(regex);
        if (!match) {
            $parent.append('<span style="color:#999;font-size:13px;">（書架分類解析失敗，請確認已登入）</span>');
            return;
        }
        const favHtml = match[1];
        const favRegex = /users-users_fav-c-(\d+)\.html\s*">\s*(.*?)\s*</g;
        let favMatch;
        while ((favMatch = favRegex.exec(favHtml)) !== null) {
            const [favId, favName] = [favMatch[1], favMatch[2]];
            const btnId = genFavBtnId(favId);
            const $btn = $(`<a id="${btnId}">${favName}</a>`);
            $parent.append($btn);
            applyFavBtnStyle($btn);
            $btn.on('click', () => addToFav(favId));
            setIsInFav(getAid(), favId);
        }
    };

    const genImageDivHtml = (imageSrc, index, total) => `
        <div style="text-align:center;color:#999;padding-bottom:10px;font-size:13px;">
            <img src="${imageSrc}" width="960px" style="display: inline"><br>
            <span>${index}/${total}</span>
        </div>
    `;

    const viewSlide = imageSrcList => {
        GM_addStyle(`
            html, body {
                overflow: auto !important;
                overflow-y: auto !important;
                height: auto !important;
                width: auto !important;
                min-height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
            }
        `);
        $('body').removeAttr('class').removeAttr('style');
        const $parent = $('<div id="v-container" style="background:#fff;color:#333;min-height:100vh;padding:20px 0;"></div>');
        $('body').empty().append($parent);
        const $favLabel = $('<div id="wnacg-viewer-fav" style="display:block;text-align:center;margin:0 auto 20px;padding:10px;"></div>');
        $parent.append($favLabel);
        initAddToFavBtn($favLabel);
        const $imgDiv = $('<div id="wnacg-viewer-img-list"></div>');
        $parent.append($imgDiv);
        const title = document.title.replace(' - 列表 - 紳士漫畫-專註分享漢化本子|邪惡漫畫', '');
        const $titleDiv = $('<div id="wnacg-viewer-title" style="text-align:center;color:#999;padding-bottom:10px;font-size:26px;"></div>');
        const regex = /\[([^\[\]]+?)\]/g;
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(title)) !== null) {
            if (match.index > lastIndex) {
                $titleDiv.append(title.slice(lastIndex, match.index));
            }
            const searchKeyword = match[1];
            const $link = $(`<a href="https://www.wnacg.com/search/?q=${searchKeyword}&f=_all&s=create_time_DESC&syn=yes" target="_blank" style="color: #4A90E2;">${searchKeyword}</a>`);
            $titleDiv.append('[').append($link).append(']');
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < title.length) {
            $titleDiv.append(title.slice(lastIndex));
        }
        $imgDiv.append($titleDiv);

        const batchSize = 10;
        let currentBatch = 0;
        const loadNextBatch = () => {
            const startIndex = currentBatch * batchSize;
            const endIndex = Math.min(startIndex + batchSize, imageSrcList.length);
            for (let i = startIndex; i < endIndex; i++) {
                $imgDiv.append(genImageDivHtml(imageSrcList[i], i + 1, imageSrcList.length));
            }
            currentBatch++;
            if (startIndex < imageSrcList.length) {
                setTimeout(loadNextBatch, 2000);
            }
        };
        loadNextBatch();
    };

    const goSlide = () => {
        const photosItemScriptUrl = location.href.replace('photos-slide-aid', 'photos-item-aid');
        $.get(photosItemScriptUrl, scriptText => {
            const pageUrlMatch = scriptText.match(/"page_url"\s*:\s*\[([\s\S]*?)\]/);
            if (!pageUrlMatch) return;
            const imageSrcList = (pageUrlMatch[1].match(/"([^"]+)"/g) || [])
                .map(s => s.slice(1, -1))
                .filter(Boolean);
            viewSlide(imageSrcList);
        });
    };

    const goAlbums = () => {
        $('.pic_box a').each((index, element) => {
            const $linkElement = $(element);
            const href = $linkElement.attr('href');
            $linkElement.attr('href', href.replace('index', 'slide'));
        });
    };

    const url = window.location.href;
    console.log(url);
    if (url === 'https://www.wnacg.com/' || url.startsWith('https://www.wnacg.com/albums') || url.startsWith('https://www.wnacg.com/search')) {
        goAlbums();
    } else if (url.startsWith('https://www.wnacg.com/photos-slide-aid')) {
        goSlide();
    }
})();
