/**
 * ui-audio.js
 * @author zhangxinxu(.com)
 * @created 2022-03-03
 * @description 音频播放器，基于 Web Audio API，兼容现代浏览器，依赖于 howler.js（https://github.com/goldfire/howler.js/）
**/

import './howler.min.js';

class UiAudio extends HTMLElement {
    static get observedAttributes () {
        return ['loop', 'muted', 'src', 'type', 'label', 'prevsrc', 'nextsrc'];
    }

    static formatTime (secs) {
        if (!secs) {
            return '00:00';
        }

        // 取整
        secs = Math.round(secs);

        var minutes = Math.floor(secs / 60) || 0;
        var seconds = (secs - minutes * 60) || 0;

        return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    }

    constructor () {
        super();

        // 创建 DOM 结构元素
        var shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `<style>
            :host {
                --1rem: 1rem;
                --ui-audio-icon-prev: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M341.333 746.667A21.333 21.333 0 0 1 320 768h-42.667A21.333 21.333 0 0 1 256 746.667V277.333A21.333 21.333 0 0 1 277.333 256H320a21.333 21.333 0 0 1 21.333 21.333zM768 280.32a32.853 32.853 0 0 0-15.787-27.733l-5.12-2.56a31.147 31.147 0 0 0-34.133 0L398.507 472.32a32 32 0 0 0-13.654 26.027V524.8a32 32 0 0 0 13.654 26.027L712.96 771.84a31.147 31.147 0 0 0 34.133 0l5.12-2.56A32.427 32.427 0 0 0 768 741.547z'/%3E%3C/svg%3E");
                --ui-audio-icon-next: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M768 277.333v469.334A21.333 21.333 0 0 1 746.667 768H704a21.333 21.333 0 0 1-21.333-21.333V277.333A21.333 21.333 0 0 1 704 256h42.667A21.333 21.333 0 0 1 768 277.333zm-456.96-25.6a31.147 31.147 0 0 0-34.133 0l-5.12 2.56A32.427 32.427 0 0 0 256 280.32v462.933a32.853 32.853 0 0 0 15.787 27.734l5.12 2.56a32 32 0 0 0 34.133 0l314.453-221.014a32 32 0 0 0 13.654-26.026v-26.454a32 32 0 0 0-13.654-26.026z'/%3E%3C/svg%3E");
                --ui-audio-icon-play: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M768 506.027v11.946a32.427 32.427 0 0 1-15.787 27.734L370.347 768c-23.04 13.653-34.987 13.653-45.227 7.68l-10.667-5.973a32.427 32.427 0 0 1-15.786-26.88V281.173a32.427 32.427 0 0 1 15.786-27.733l10.667-5.973c10.24-5.974 22.187-5.974 52.053 11.52l375.04 219.306A32.427 32.427 0 0 1 768 506.027z'/%3E%3C/svg%3E");
                --ui-audio-icon-pause: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M426.667 288v448a32.427 32.427 0 0 1-32 32h-64a32.427 32.427 0 0 1-32-32V288a32.427 32.427 0 0 1 32-32h64a32.427 32.427 0 0 1 32 32zm266.666-32h-64a32.427 32.427 0 0 0-32 32v448a32.427 32.427 0 0 0 32 32h64a32.427 32.427 0 0 0 32-32V288a32.427 32.427 0 0 0-32-32z'/%3E%3C/svg%3E");
                --ui-audio-icon-muted: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M554.667 213.333v597.334A42.667 42.667 0 0 1 512 853.333h-25.173a42.667 42.667 0 0 1-29.867-12.373L293.547 677.547A128 128 0 0 0 203.093 640 75.093 75.093 0 0 1 128 564.907V459.093A75.093 75.093 0 0 1 203.093 384a128 128 0 0 0 90.454-37.547L456.96 183.04a42.667 42.667 0 0 1 29.867-12.373H512a42.667 42.667 0 0 1 42.667 42.666zM820.907 512l68.693-69.12a20.48 20.48 0 0 0 0-29.867L866.987 390.4a20.48 20.48 0 0 0-29.867 0L768 459.093 698.88 390.4a20.48 20.48 0 0 0-29.867 0L646.4 413.013a20.48 20.48 0 0 0 0 29.867L715.093 512 646.4 581.12a20.48 20.48 0 0 0 0 29.867l22.613 22.613a20.48 20.48 0 0 0 29.867 0L768 564.907l69.12 68.693a20.48 20.48 0 0 0 29.867 0l22.613-22.613a20.48 20.48 0 0 0 0-29.867z'/%3E%3C/svg%3E");
                --ui-audio-icon-unmuted: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M554.667 213.333v597.334A42.667 42.667 0 0 1 512 853.333h-25.173a42.667 42.667 0 0 1-29.867-12.373L293.547 677.547A128 128 0 0 0 203.093 640 75.093 75.093 0 0 1 128 564.907V459.093A75.093 75.093 0 0 1 203.093 384a128 128 0 0 0 90.454-37.547L456.96 183.04a42.667 42.667 0 0 1 29.867-12.373H512a42.667 42.667 0 0 1 42.667 42.666zm256 73.814a24.747 24.747 0 0 0-15.36-7.254 21.333 21.333 0 0 0-15.787 6.4l-30.293 30.294a21.333 21.333 0 0 0 0 29.013 256 256 0 0 1 0 332.8 21.333 21.333 0 0 0 0 29.013l30.293 30.294a21.333 21.333 0 0 0 15.787 6.4 23.893 23.893 0 0 0 15.36-7.254 341.333 341.333 0 0 0 0-449.706zM675.84 401.067a22.613 22.613 0 0 0-16.64 6.4l-30.293 30.72a21.333 21.333 0 0 0-2.987 26.88 85.333 85.333 0 0 1 0 93.866 21.333 21.333 0 0 0 2.987 26.88l30.293 30.72a22.187 22.187 0 0 0 16.64 5.974 22.187 22.187 0 0 0 15.787-8.107 170.667 170.667 0 0 0 0-204.8 24.32 24.32 0 0 0-15.787-8.533z'/%3E%3C/svg%3E");
                --ui-audio-icon-more: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M426.667 256A85.333 85.333 0 1 1 512 341.333 85.333 85.333 0 0 1 426.667 256zM512 426.667A85.333 85.333 0 1 0 597.333 512 85.333 85.333 0 0 0 512 426.667zm0 256A85.333 85.333 0 1 0 597.333 768 85.333 85.333 0 0 0 512 682.667z'/%3E%3C/svg%3E");
                --ui-audio-icon-shuffle: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M416.853 624.64l-80.64 81.067A213.333 213.333 0 0 1 185.173 768h-35.84A21.333 21.333 0 0 1 128 746.667V704a21.333 21.333 0 0 1 21.333-21.333h35.84a128 128 0 0 0 90.454-37.547l81.066-80.64zm185.6 81.067a215.893 215.893 0 0 0 122.88 59.733v87.893a21.333 21.333 0 0 0 36.267 14.934l128-128a21.76 21.76 0 0 0 0-30.294l-128-128a21.333 21.333 0 0 0-36.267 15.36v81.92a128 128 0 0 1-62.293-34.133L529.493 512 663.04 378.88a128 128 0 0 1 62.293-34.133v81.92A21.333 21.333 0 0 0 761.6 441.6l128-128a21.76 21.76 0 0 0 0-30.293l-128-128a21.333 21.333 0 0 0-36.267 15.36v87.893a215.893 215.893 0 0 0-122.88 59.733L469.333 451.84l-133.12-133.547A213.333 213.333 0 0 0 185.173 256h-35.84A21.333 21.333 0 0 0 128 277.333V320a21.333 21.333 0 0 0 21.333 21.333h35.84a128 128 0 0 1 90.454 37.547z'/%3E%3C/svg%3E");
                --ui-audio-icon-swap: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M298.667 810.667a170.667 170.667 0 0 1 0-341.334h426.666a85.333 85.333 0 0 0 0-170.666H256V384a21.333 21.333 0 0 1-36.267 14.933l-128-128a21.76 21.76 0 0 1 0-30.293l128-128A21.333 21.333 0 0 1 256 128v85.333h469.333a170.667 170.667 0 0 1 0 341.334H298.667a85.333 85.333 0 0 0 0 170.666H768V640a21.333 21.333 0 0 1 36.267-15.36l128 128a21.76 21.76 0 0 1 0 30.293l-128 128A21.333 21.333 0 0 1 768 896v-85.333z'/%3E%3C/svg%3E");
                --ui-audio-icon-repeat: url("data:image/svg+xml,%3Csvg viewBox='0 0 1024 1024' xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M810.667 533.333v192a85.333 85.333 0 0 1-85.334 85.334H298.667V896a21.333 21.333 0 0 1-36.267 15.36l-128-128a21.76 21.76 0 0 1 0-30.293l128-128A21.333 21.333 0 0 1 298.667 640v85.333h426.666v-192A21.333 21.333 0 0 1 746.667 512h42.666a21.333 21.333 0 0 1 21.334 21.333zm79.36-292.693l-128-128A21.333 21.333 0 0 0 725.333 128v85.333H298.667a85.333 85.333 0 0 0-85.334 85.334v192A21.333 21.333 0 0 0 234.667 512h42.666a21.333 21.333 0 0 0 21.334-21.333v-192h426.666V384a21.333 21.333 0 0 0 36.267 15.36l128-128a21.76 21.76 0 0 0 .427-30.72z'/%3E%3C/svg%3E");
            }
            :host(:not([controls])) .container {
                display: none;
            }
            .container {
                display: grid;
                border-radius: .5em;
                background: var(--ui-audio-background, #333);
                color: var(--ui-audio-color, #ddd);
                padding: var(--1rem);
                gap: .5em;
            }
            .label {
                font-size: calc(.875 * var(--1rem));
                color: #999;
                padding-left: calc(.75 * var(--1rem));
            }
            .label::before {
                content: '正在播放：';
                color: #999;
            }
            .label:empty {
                display: none;
            }
            .operate {
                display: flex;
                align-items: center;
            }
            .operate-time,
            .time-range {
                flex: 1;
            }
            .icon {
                width: calc(2.5 * var(--1rem));
                height: calc(2.5 * var(--1rem));
                border: 0;
                background: currentColor;
                font-size: 0;
                color: inherit;
                --mask: var(--ui-audio-mask-image) no-repeat center / calc(1.5 * var(--1rem)) calc(1.5 * var(--1rem));
                -webkit-mask: var(--mask);
                mask: var(--mask);
                cursor: pointer;
            }
            button:disabled {
                opacity: .4;
            }
            .icon:active {
                filter: brightness(1.1);
            }
            @media (hover: hover) {
                .icon:enabled:hover {
                    filter: brightness(1.1);
                }
            }
            .operate-seq {
                flex: none;
            }
            .operate-time {
                display: flex;
                align-items: center;
                margin: 0 1em;
            }
            .operate-time output {
                flex: 0 0 5ch;
                font-size: 75%;
            }
            .progress {
                flex: 1;
                margin: calc(.5 * var(--1rem));
            }
            .prev {
                --ui-audio-mask-image: var(--ui-audio-icon-prev);
            }
            .next {
                --ui-audio-mask-image: var(--ui-audio-icon-next);
            }
            .play {
                --ui-audio-mask-image: var(--ui-audio-icon-play);
                -webkit-mask-size: calc(2 * var(--1rem));
                mask-size: calc(2 * var(--1rem));
            }
            .pause {
                --ui-audio-mask-image: var(--ui-audio-icon-pause);
            }
            .muted {
                --ui-audio-mask-image: var(--ui-audio-icon-unmuted);
            }
            .more {
                --ui-audio-mask-image: var(--ui-audio-icon-more);
            }
            :host([muted]) .muted {
                --ui-audio-mask-image: var(--ui-audio-icon-muted);
            }
            [type="range"] {
                -webkit-appearance: none;
                appearance: none;
                margin: 0;
                outline: 0;
                background-color: transparent;
                font-size: var(--1rem);
            }
            ::-webkit-slider-container {
                display: flex;
                height: 1em;
                overflow: hidden;
            }
            ::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                background-color: #fff;
                width: .75em;
                height: .75em;
                border-radius: 50%;
                margin-top: -.25em;
                border-image: linear-gradient(#f44336, #f44336) 0 fill / .25em .75em .25em 0 / 0 0 0 2000px;
            }
            ::-webkit-slider-runnable-track {
                height: .25em;
                background: #ccc;
            }
            ::-moz-range-track {
                background: #ccc;
                height: .25em;
            }            
            ::-moz-range-progress {
                background: linear-gradient(#f44336, #f44336);
                height: .25em;
            }
            ::-moz-range-thumb {
                border: 0;
                background-color: #fff;
                width: .75em;
                height: .75em;
                border-radius: 50%;
                margin-top: -.25em;
            }

            .time-range {  margin: 0 .25em; }
            .time-total { text-align: right; }
            .operate-volume { display: flex; align-items: center; }
            .volume-range { width: 7.5em; }
            select { position: absolute; }
            .rate {
                padding: 0;
                border: 0;
                background: rgba(0,0,0,.35);
                color: inherit;
                width: 3.25em;
                height: calc(1.5 * var(--1rem));
                border-radius: .25em;
                margin: 0 .5em 0 1em;
                box-shadow: 0 1px #666, 0 -1px #000;
            }
            .operate-loop { display: flex; }
            :host(:not([loop])) .operate-loop,
            :host([loop=""]) .operate-loop,
            :host([loop="true"]) .operate-loop,
            :host([rate="none"]) .operate-rate {
                display: none;
            }
            select {
                position: absolute;
                opacity: 0;
                z-index: 1;
                cursor: pointer;
            }
            .loop {
                --ui-audio-mask-image: var(--ui-audio-icon-swap);
            }
            .loop[loop="1"] {
                --ui-audio-mask-image: var(--ui-audio-icon-shuffle);
            }
            .loop[loop="2"] {
                --ui-audio-mask-image: var(--ui-audio-icon-repeat);
            }
            /* 序列控制 */
            :host(:not([nextsrc])) .next,
            :host(:not([prevsrc])) .prev {
                display: none;
            }
            .select-loop {
                height: calc(2.5 * var(--1rem));
                width: calc(2.5 * var(--1rem));
            }
            .operate-more { display: none; }
            @media (max-width: 640px) {
                .container { padding: calc(.5 * var(--1rem)); }
                .volume-range, .operate-loop, .operate-rate { display: none; position: absolute; }
                .icon { width: calc(1.75 * var(--1rem)) }
                .operate-more { display: block; }
                .operate-volume, .operate-more, .operate { position: relative; }
                .operate-time { margin: 0 .5em; }
                .label { padding-left: calc(.5 * var(--1rem)); }
                .time-range { width: 60px; }
                [active] + .volume-range { display: block; right: calc(1.75 * var(--1rem)); background: var(--ui-audio-background, #333); box-shadow: -8px 0 var(--ui-audio-background, #333);}
                .operate-more[active] ~ .operate-loop, .operate-more[active] ~ .operate-rate { display: block; bottom: 100%; }
                .operate-more[active]::before { content: ''; position: absolute; height: calc(3 * var(--1rem)); width: calc(6 * var(--1rem)); border: 1px solid #000; background: var(--ui-audio-background, #333); bottom: 100%; right: 0; }
                .operate-more[active] ~ .operate-loop { right: calc(.5 * var(--1rem));}
                .operate-more[active] ~ .operate-rate { right: calc(2.5 * var(--1rem)); margin-bottom: calc(.75 * var(--1rem)); }
            }
        </style>

        <div class="container" part="container">
            <div part="label" class="label">${this.label || ''}</div>
            <div part="operate" class="operate">
                <div class="operate-seq">
                    <button class="icon prev" title="上一个">上一个</button>
                    <button class="icon play" title="播放">播放</button>
                    <button class="icon next" title="下一个">下一个</button>
                </div>
                <div class="operate-time">
                    <output class="time-current">00:00</output>
                    <input type="range" value="0" class="time-range" step="0.001">
                    <output class="time-total">00:00</output>
                </div>
                <div class="operate-volume">
                    <button class="icon muted">静音</button>
                    <input class="volume-range" type="range" min="0" step="0.01" max="1" value="${this.muted ? '0' : '0.5'}">
                </div>
                <div class="operate-more">
                    <button class="icon more">更多</button>
                </div>
                <div class="operate-rate">
                    <select class="select-rate">
                        <option value="0.5">0.5x</option>
                        <option value="0.75">0.75x</option>
                        <option value="1" selected>1x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2x</option>
                        <option value="2.5">2.5x</option>
                    </select>
                    <button class="rate">倍速</button>
                </div>
                <div class="operate-loop">
                    <select class="select-loop" title="顺序播放">
                        <option value="0" selected>顺序播放</option>
                        <option value="1">随机播放</option>
                        <option value="2">循环播放</option>
                    </select>
                    <button class="icon loop" loop="${this.loop}" aria-hidden="true"></button>
                </div>
                <div class="operate-custom">
                    <slot name="custom"><!--自定义操作区--></slot>
                </div>
            </div>
        </div>`;

        // 元素暴露出去
        this.element = Object.assign(this.element || {}, {
            label: shadow.querySelector('.label'),
            prev: shadow.querySelector('.prev'),
            play: shadow.querySelector('.play'),
            next: shadow.querySelector('.next'),
            more: shadow.querySelector('.more'),
            timeCurrent: shadow.querySelector('.time-current'),
            timeRange: shadow.querySelector('.time-range'),
            timeTotal: shadow.querySelector('.time-total'),
            muted: shadow.querySelector('.muted'),
            volumeRange: shadow.querySelector('.volume-range'),
            rate: shadow.querySelector('.select-rate'),
            loop: shadow.querySelector('.select-loop')
        });

        // 存储
        this.store = {};
    }

    set currentTime (value) {
        this.seek(value);
    }

    get currentTime () {
        return this.seek();
    }

    set playbackRate (value) {
        this.rate(value);
    }

    get playbackRate () {
        return this.rate();
    }

    set label (value) {
        this.setAttribute('label', value);
    }

    get label () {
        return this.getAttribute('label');
    }

    set mode (value) {
        this.setAttribute('mode', value);
    }

    get mode () {
        return (this.getAttribute('mode') || 'webapi').toLowerCase();
    }

    set src (value) {
        this.setAttribute('src', value);
    }

    get src () {
        return this.getAttribute('src') || '';
    }

    set prevsrc (value) {
        this.setAttribute('prevsrc', value);
    }

    get prevsrc () {
        return this.getAttribute('prevsrc') || '';
    }

    set nextsrc (value) {
        this.setAttribute('nextsrc', value);
    }

    get nextsrc () {
        return this.getAttribute('nextsrc') || '';
    }

    set type (value) {
        this.setAttribute('type', value);
    }

    get type () {
        return this.getAttribute('type') || '';
    }

    set playbackRate (value) {
        if (this.audio) {
            this.audio.rate(value);
        }
    }

    get playbackRate () {
        if (this.audio) {
            return this.audio.rate();
        }

        return 1;
    }

    set paused (value) {
        // 只读，不处理
    }

    get paused () {
        if (this.audio) {
            return !this.audio.playing();
        }
        return false;
    }

    set volume (value) {
        if (this.audio) {
            this.audio.volume(value);
        }

        if (value || value === 0) {
            let range = this.element && this.element.volumeRange;
            range.value = value;
            range.dispatchEvent(new CustomEvent('input'));
        }
    }

    get volume () {
        let range = this.element && this.element.volumeRange;

        if (range) {
            return Number(range.value);
        }

        if (this.audio) {
            return this.audio.volume();
        }

        return 0.5;
    }

    set muted (value) {
        this.toggleAttribute('muted', value);
    }

    get muted () {
        return this.hasAttribute('muted');
    }

    set loop (value) {
        if (!value && value !== 0) {
            this.removeAttribute('loop');
            return;
        }

        this.setAttribute('loop', value);
    }

    get loop () {
        if (!this.hasAttribute('loop')) {
            return false;
        }

        let loop = this.getAttribute('loop');
        if (loop === '' || loop == 'true') {
            return true;
        }

        if (loop !== '1' || loop != '2') {
            return '0';
        }
    }

    set duration (value) {
        let ele = this.element;
        // 显示时长
        ele.timeTotal.textContent = UiAudio.formatTime(value);
        // 播放进度设置
        ele.timeRange.max = value;
    }

    get duration () {
        if (this.audio) {
            return this.audio.duration();
        }

        return 0;
    }

    play () {
        if (this.audio && !this.audio.playing()) {
            this.audio.play();
        }
    }

    pause () {
        if (this.audio) {
            this.audio.pause();
        }
    }

    stop () {
        if (this.audio) {
            this.audio.stop();
        }
    }

    load () {
        if (this.audio) {
            this.audio.load();
        }
    }

    unload (src) {
        if (!src && this.audio) {
            this.audio.unload();
        } else if (src && this.store[src]) {
            this.store[src].unload();
            delete this.store[src];
        }
    }

    state () {
        if (this.audio) {
            return this.audio.state();
        }

        return 'unready';
    }

    seek (value) {
        if (this.audio) {
            this.audio.seek(value);
        }
    }

    prev () {
        let prevsrc = this.prevsrc;
        if (prevsrc && prevsrc != 'none') {
            this.nextsrc = this.src;
            // 替换地址
            this.src = prevsrc;
            // 清空上一个地址
            this.prevsrc = '';
            // 开始播放
            this.play();
        }
    }

    next () {
        let nextsrc = this.nextsrc;
        if (nextsrc && nextsrc != 'none') {
            this.prevsrc = this.src;
            // 当前播放地址替换
            this.src = nextsrc;
            // 下一个地址没有
            this.nextsrc = '';
            // 开始播放
            this.play();
        }
    }

    ready (src) {
        if (!src) {
            src = this.src;
        }

        if (!src || src == 'none') {
            return;
        }

        let store = this.store;

        if (!store[src]) {
            store[src] = new Howl({
                src: src.split(','),
                format: this.type.split(','),
                html5: (this.mode === 'html5'),
                onplay: () => {
                    // 事件触发
                    this.dispatchEvent(new CustomEvent('play'));
                },
                onload: () => {
                    // 事件触发
                    this.dispatchEvent(new CustomEvent('load'));
                },
                onend: () => {
                    // 事件触发
                    this.dispatchEvent(new CustomEvent('end'));
                },
                onpause: () => {
                    // 事件触发
                    this.dispatchEvent(new CustomEvent('pause'));
                },
                onstop: () => {
                    this.dispatchEvent(new CustomEvent('stop'));
                },
                onseek: () => {
                    // 事件触发
                    this.dispatchEvent(new CustomEvent('seek'));
                },
                loaderror: () => {
                    // 事件触发
                    this.dispatchEvent(new CustomEvent('error', {
                        detail: {
                            type: 'load'
                        }
                    }));
                },
                playerror: () => {
                    // 事件触发
                    this.dispatchEvent(new CustomEvent('error', {
                        detail: {
                            type: 'play'
                        }
                    }));
                }
            });

            // 因为 playing 高频触发，所以单独提出，提高性能
            store[src].customEventPlaying = new CustomEvent('playing');
        }
    }

    attributeChangedCallback (name, oldvalue, newvalue) {
        let store = this.store;
        let ele = this.element;
        if (name == 'src') {
            let src = this.src;

            // 关闭，避免重复播放
            if (this.audio) {
                this.audio.pause();
            }

            // 音频播放对象准备
            this.ready(src);

            if (src) {
                this.audio = store[src];

                // 状态设置
                this.audio.mute(this.muted);
                this.audio.loop(this.loop == '2');
                this.audio.volume(this.volume);
                this.audio.seek(0);
                this.duration = this.duration;
            } else {
                this.audio = null;
            }
        } else if (name == 'prevsrc' || name == 'nextsrc') {
            this.ready(this[name]);

            if (name == 'prevsrc') {
                ele.prev.disabled = Boolean(newvalue == 'none' || !newvalue);
            } else {
                ele.next.disabled = Boolean(newvalue == 'none' || !newvalue);
            }
        } else if (name == 'label') {
            ele.label.innerHTML = this.label;
        } else if (name == 'loop') {
            [...ele.loop.options].forEach(option => {
                if (option.value === newvalue) {
                    option.selected = true;
                }
            });
            // 触发样式设置
            ele.loop.dispatchEvent(new CustomEvent('change'));
            // 设置循环
            if (this.audio) {
                this.audio.loop(String(newvalue) === '2' || this.loop === true);
            }
        } else if (name == 'muted') {
            if (this.audio) {
                this.audio.mute(this.muted);
            }
            if (this.muted && ele.volumeRange.value != '0') {
                ele.volumeRange.storeValue = ele.volumeRange.value;
                ele.volumeRange.value = '0';
            } else if (!this.muted && ele.volumeRange.storeValue) {
                ele.volumeRange.value = ele.volumeRange.storeValue;
            }
        }
    }

    connectedCallback () {
        // 事件处理
        let ele = this.element;

        // 倍速和循环模式的处理
        ele.rate.addEventListener('change', (event) => {
            let target = event.target;
            let value = target.value;

            // 对应按钮元素
            let button = target.parentElement.querySelector('button');

            if (!button) {
                return;
            }

            if (value === '1') {
                button.textContent = '倍速';
            } else {
                button.textContent = value + 'x';
            }

            // 同步设置
            this.playbackRate = parseFloat(value) || 1;
        });

        ele.loop.addEventListener('change', (event) => {
            let target = event.target;
            let value = target.value;

            // 对应按钮元素
            let button = target.parentElement.querySelector('button');

            if (!button) {
                return;
            }

            let optionSelected = target.selectedOptions[0] || target.options[0];
            if (!optionSelected) {
                return;
            }

            // 标题提示，因为可能有用户不知道图标表示的含义
            target.title = optionSelected.textContent;

            // 对外暴露当前循环模式
            if (event.isTrusted) {
                this.loop = value;
            }

            // 按钮样式变化
            button.setAttribute('loop', value);
        });

        // 静音和音量设置
        ele.volumeRange.addEventListener('input', (event) => {
            let target = event.target;
            let value = target.value;

            if (value == '0') {
                this.muted = true;
            } else {
                this.muted = false;
            }

            target.storeValue = value;

            // 音量变化
            if (event.isTrusted && this.audio) {
                this.audio.volume(value);
            }
        });

        ele.muted.addEventListener('click', (event) => {
            let target = event.target;
            // 如果是移动端
            if (window.matchMedia('(max-width:640px)').matches) {
                target.toggleAttribute('active');
            } else {
                this.muted = !this.muted;
                // 音量变化
                if (event.isTrusted && this.audio) {
                    this.audio.volume(ele.volumeRange.value);
                }
            }

            event.stopPropagation();
        });

        // 优先 volume 设置的音量
        ele.volumeRange.storeValue = ele.volumeRange.value = this.volume;

        // 播放与暂停
        ele.play.addEventListener('click', (event) => {
            let target = event.target;

            if (!target.classList.contains('pause')) {
                // 执行播放
                this.play();
            } else {
                // 执行暂停
                this.pause();
            }
        });

        // 播放进度的处理
        let step = () => {
            if (!this.audio) {
                return;
            }
            let playing = this.audio.playing();
            if (!playing) {
                return;
            }

            let seek = this.audio.seek();

            // 时间显示
            ele.timeCurrent.textContent = UiAudio.formatTime(seek);
            // 进度条变化
            ele.timeRange.value = seek;

            // 持续播放事件触发
            this.dispatchEvent(this.audio.customEventPlaying);
            // 继续跟进
            requestAnimationFrame(step);
        };
        this.addEventListener('play', function () {
            ele.play.classList.add('pause');
            ele.play.title = '暂停';
            if (this.audio) {
                requestAnimationFrame(step);
            }
        });
        this.addEventListener('pause', function () {
            ele.play.classList.remove('pause');
            ele.play.title = '播放';
        });
        this.addEventListener('load', function () {
            this.duration = this.duration;
        });
        this.addEventListener('end', function () {
            // 时间显示
            let seek = ele.timeRange.max;
            // 直接显示最终时间
            ele.timeCurrent.textContent = UiAudio.formatTime(seek);
            // 进度条变化
            ele.timeRange.value = seek;
            // 如果没有下一个要播放的，也不是循环播放
            if (this.loop !== '2' && this.loop !== true) {
                if (!this.nextsrc) {
                    this.pause();
                } else if (this.loop) {
                    this.next();
                }
            }
        });
        this.addEventListener('seek', function () {
            // 显示播放进度
            ele.timeCurrent.textContent = UiAudio.formatTime(this.audio.seek());
        });

        // 如果移动滑竿
        ele.timeRange.addEventListener('input', (event) => {
            let target = event.target;
            // 变化进度
            this.seek(target.value);
        });

        // 上一个下一个处理
        ele.prev.addEventListener('click', () => {
            this.prev();
        });
        ele.next.addEventListener('click', () => {
            this.next();
        });

        // 移动端显示
        ele.more.addEventListener('click', function () {
            this.parentElement.toggleAttribute('active');
        });
        document.addEventListener('mouseup', (event) => {
            let target = event.target;
            if (window.matchMedia('(max-width:640px)').matches && target.matches('ui-audio') == false) {
                ele.muted.toggleAttribute('active', false);
                ele.more.parentElement.toggleAttribute('active', false);
            }
        });
    }
}

if (!customElements.get('ui-audio')) {
    customElements.define('ui-audio', UiAudio);
}
