document.addEventListener('DOMContentLoaded', () => {
    const el = (id) => document.getElementById(id);

    const canvas = el('wallpaper-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    const ctx = canvas.getContext('2d');

    const controls = {
        bgUpload: el('bg-upload'),
        uploadBtn: el('upload-btn'),
        toggleControlsBtn: el('toggle-controls-btn'),
        downloadBtn: el('download-btn'),
        controlsPanel: el('controls-panel'),
        bgOpacity: el('bg-opacity'),
        densityCompact: el('density-compact'),
        densityComfort: el('density-comfort'),
        textColorSelector: el('text-color-selector'),
        ratioSelector: el('ratio-selector'),
    };

    const themes = [
        { name: 'Default', accentColor: '#007AFF', textColor: '#FFFFFF', weekendColor: '#FFFFFF' },
    ];

    const state = {
        bgImage: null,
        bgPreset: 'silver-gradient',
        ratio: '9:19.5',
        exportWidth: 1170,
        weekStart: 'sunday',
        ...themes[0],
        boxOpacity: 0.2,
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        calendarX: 10,
        calendarY: 50,
        calendarScale: 0.65,
        bgOffscreen: null,
        compactMode: false,
        hasAutoPlaced: false,
        bgScale: 1,
        bgOffsetX: 0,
        bgOffsetY: 0,
    };

    let swatches = [];

    const textColors = [
        { name: '白色', value: '#FFFFFF' },
        { name: '橙色', value: '#FF9500' },
        { name: '绿色', value: '#34C759' },
        { name: '蓝色', value: '#007AFF' },
    ];

    function updateState(newState) {
        Object.assign(state, newState);
        render();
    }

    function render() {
        adjustCanvasSize();
        drawBackground();
        ensureDefaultPlacement();
        drawCalendar();
    }

    function ensureDefaultPlacement() {
        if (state.hasAutoPlaced) return;
        const calendarWidth = (canvas.width * 0.9) * state.calendarScale;
        const cellWidth = calendarWidth / 7;
        const densityRatio = state.compactMode ? 0.65 : 0.78;
        const cellHeight = cellWidth * densityRatio;
        const rows = computeCalendarData(state.year, state.month, state.weekStart).length;
        const calendarHeight = cellHeight * rows;
        const margin = Math.round(canvas.width * 0.04);
        state.calendarX = canvas.width - calendarWidth - margin;
        state.calendarY = margin;
        state.hasAutoPlaced = true;
    }

    function adjustCanvasSize() {
        const [width, height] = state.ratio.split(':').map(Number);
        const container = canvas.parentElement;
        const containerRatio = container.clientWidth / container.clientHeight;
        const imageRatio = width / height;

        if (containerRatio > imageRatio) {
            canvas.style.height = '100%';
            canvas.style.width = 'auto';
        } else {
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
        }
    }

    function drawBackground() {
        const [ratioWidth, ratioHeight] = state.ratio.split(':').map(Number);
        canvas.width = state.exportWidth;
        canvas.height = Math.round(state.exportWidth * (ratioHeight / ratioWidth));

        // Prepare offscreen background canvas for localized blur in glass effect.
        if (!state.bgOffscreen) {
            state.bgOffscreen = document.createElement('canvas');
        }
        state.bgOffscreen.width = canvas.width;
        state.bgOffscreen.height = canvas.height;
        const bctx = state.bgOffscreen.getContext('2d');
        bctx.clearRect(0, 0, canvas.width, canvas.height);

        if (state.bgImage) {
            const img = state.bgImage;
            const scale = state.bgScale || 1;
            const sw = img.width * scale;
            const sh = img.height * scale;
            const dx = (canvas.width - sw) / 2 + state.bgOffsetX;
            const dy = (canvas.height - sh) / 2 + state.bgOffsetY;
            bctx.drawImage(img, dx, dy, sw, sh);
        } else {
            drawPresetBackground(bctx);
        }

        // Draw non-blurred background onto main canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(state.bgOffscreen, 0, 0);
    }

    function drawPresetBackground(targetCtx = ctx) {
        if (state.bgPreset === 'silver-gradient') {
            const grd = targetCtx.createLinearGradient(0, 0, 0, canvas.height);
            grd.addColorStop(0.0, '#d8dbe0');
            grd.addColorStop(0.35, '#e4e6ea');
            grd.addColorStop(0.7, '#eceef1');
            grd.addColorStop(1.0, '#f7f8fa');
            targetCtx.fillStyle = grd;
            targetCtx.fillRect(0, 0, canvas.width, canvas.height);
            return;
        }
        const gradient = {
            gradient1: ['#434343', '#000000'],
            gradient2: ['#2c3e50', '#3498db'],
            gradient3: ['#1A2980', '#26D0CE'],
            gradient4: ['#FF512F', '#DD2476'],
        }[state.bgPreset];
        if (gradient) {
            const grd = targetCtx.createLinearGradient(0, 0, 0, canvas.height);
            grd.addColorStop(0, gradient[0]);
            grd.addColorStop(1, gradient[1]);
            targetCtx.fillStyle = grd;
        } else {
            targetCtx.fillStyle = state.bgPreset === 'solid-white' ? '#FFFFFF' : '#000000';
        }
        targetCtx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function computeCalendarData(year, month, weekStart) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const data = [];
        const weekDays = weekStart === 'monday' ? ['一', '二', '三', '四', '五', '六', '日'] : ['日', '一', '二', '三', '四', '五', '六'];
        data.push(weekDays);
        let currentDay = 1;
        const offset = weekStart === 'monday' ? (firstDay + 6) % 7 : firstDay;
        for (let i = 0; i < 6; i++) {
            const week = [];
            for (let j = 0; j < 7; j++) {
                if (i === 0 && j < offset) {
                    week.push('');
                } else if (currentDay <= daysInMonth) {
                    week.push(currentDay++);
                } else {
                    week.push('');
                }
            }
            data.push(week);
            if (currentDay > daysInMonth) break;
        }
        return data;
    }

    function drawCalendar() {
        const { year, month, weekStart, textColor, boxOpacity, calendarX, calendarY, calendarScale, compactMode } = state;
        const calendarData = computeCalendarData(year, month, weekStart);

        const calendarWidth = (canvas.width * 0.9) * calendarScale;
        const cellWidth = calendarWidth / 7;
        const densityRatio = compactMode ? 0.65 : 0.78;
        const cellHeight = cellWidth * densityRatio;
        const calendarHeight = cellHeight * calendarData.length;

        const x = calendarX;
        const y = calendarY;

        // Apple liquid glass box: localized background blur within rounded rectangle
        ctx.save();
        drawRoundRect(ctx, x, y, calendarWidth, calendarHeight, 15);
        ctx.clip();
        if (state.bgOffscreen) {
            ctx.filter = 'blur(12px)';
            ctx.drawImage(state.bgOffscreen, 0, 0);
            ctx.filter = 'none';
        }
        ctx.restore();

        // Translucent white fill for glass
        const glassAlpha = Math.min(0.55, Math.max(0.1, boxOpacity));
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = `rgba(255,255,255,${glassAlpha})`;
        drawRoundRect(ctx, x, y, calendarWidth, calendarHeight, 15);
        ctx.fill();

        // Subtle highlight gradient (top shine)
        const shine = ctx.createLinearGradient(x, y, x, y + calendarHeight);
        shine.addColorStop(0, 'rgba(255,255,255,0.65)');
        shine.addColorStop(0.4, 'rgba(255,255,255,0.12)');
        shine.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shine;
        drawRoundRect(ctx, x, y, calendarWidth, calendarHeight, 15);
        ctx.fill();

        // Hairline border to complete glass effect
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = Math.max(1, canvas.width * 0.002);
        drawRoundRect(ctx, x, y, calendarWidth, calendarHeight, 15);
        ctx.stroke();

        const fontSize = Math.floor(cellWidth / (compactMode ? 2.5 : 2.1));
        ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        calendarData.forEach((week, rowIndex) => {
            week.forEach((day, colIndex) => {
                const cellX = x + colIndex * cellWidth + cellWidth / 2;
                const cellY = y + rowIndex * cellHeight + cellHeight / 2;

                // All text in one color (header, weekdays, weekends)
                ctx.fillStyle = textColor;

                ctx.fillText(day.toString(), cellX, cellY);
            });
        });
    }

    function drawRoundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    function getEventPosition(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        if (e.touches) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY,
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    }

    function isPointerOverCalendar(x, y) {
        const { calendarX, calendarY, calendarScale, compactMode, year, month, weekStart } = state;
        const calendarWidth = (canvas.width * 0.9) * calendarScale;
        const cellWidth = calendarWidth / 7;
        const densityRatio = compactMode ? 0.65 : 0.78;
        const cellHeight = cellWidth * densityRatio;
        const rows = computeCalendarData(year, month, weekStart).length;
        const calendarHeight = cellHeight * rows;
        return x >= calendarX && x <= calendarX + calendarWidth && y >= calendarY && y <= calendarY + calendarHeight;
    }

    function createTextColorSwatches() {
        const selector = controls.textColorSelector;
        if (!selector) return;
        selector.innerHTML = '';
        swatches = [];
        textColors.forEach((tc) => {
            const swatch = document.createElement('div');
            swatch.className = 'theme-swatch';
            swatch.style.backgroundColor = tc.value;
            swatch.title = tc.name;
            swatch.addEventListener('click', () => {
                updateState({ textColor: tc.value });
                swatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
            });
            selector.appendChild(swatch);
            swatches.push(swatch);
        });
        // 初始选中当前文字颜色最接近的色块
        const initialIndex = textColors.findIndex(c => c.value.toLowerCase() === state.textColor.toLowerCase());
        if (initialIndex >= 0 && swatches[initialIndex]) {
            swatches[initialIndex].classList.add('active');
        }
    }

    function setupEventListeners() {
        controls.uploadBtn.addEventListener('click', () => {
            controls.bgUpload.click();
        });

        controls.bgUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        // 初始缩放为 cover，居中显示
                        const coverScale = Math.max(canvas.width / img.width, canvas.height / img.height);
                        updateState({ bgImage: img, bgScale: coverScale, bgOffsetX: 0, bgOffsetY: 0 });
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        controls.bgOpacity.addEventListener('input', (e) => {
            updateState({ boxOpacity: parseFloat(e.target.value) });
        });
        // 初始化透明度为滑块当前值
        if (controls.bgOpacity) {
            state.boxOpacity = parseFloat(controls.bgOpacity.value || state.boxOpacity);
        }

        // 密度双按钮：同时显示并高亮当前选择
        if (controls.densityCompact && controls.densityComfort) {
            const updateActive = () => {
                controls.densityCompact.classList.toggle('active', state.compactMode === true);
                controls.densityComfort.classList.toggle('active', state.compactMode === false);
            };
            controls.densityCompact.addEventListener('click', () => {
                updateState({ compactMode: true });
                updateActive();
            });
            controls.densityComfort.addEventListener('click', () => {
                updateState({ compactMode: false });
                updateActive();
            });
            updateActive();
        }

        let isDraggingCal = false;
        let isDraggingBG = false;
        let dragStartX, dragStartY;
        let initialCalendarX, initialCalendarY;
        let initialBgOffsetX, initialBgOffsetY;

        canvas.addEventListener('mousedown', (e) => {
            const { x, y } = getEventPosition(e);
            if (isPointerOverCalendar(x, y)) {
                isDraggingCal = true;
                dragStartX = x;
                dragStartY = y;
                initialCalendarX = state.calendarX;
                initialCalendarY = state.calendarY;
                canvas.style.cursor = 'grabbing';
            } else {
                isDraggingBG = true;
                dragStartX = x;
                dragStartY = y;
                initialBgOffsetX = state.bgOffsetX;
                initialBgOffsetY = state.bgOffsetY;
                canvas.style.cursor = 'grabbing';
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (isDraggingCal) {
                const { x, y } = getEventPosition(e);
                const dx = x - dragStartX;
                const dy = y - dragStartY;
                updateState({ calendarX: initialCalendarX + dx, calendarY: initialCalendarY + dy });
            } else if (isDraggingBG) {
                const { x, y } = getEventPosition(e);
                const dx = x - dragStartX;
                const dy = y - dragStartY;
                updateState({ bgOffsetX: initialBgOffsetX + dx, bgOffsetY: initialBgOffsetY + dy });
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDraggingCal = false;
            isDraggingBG = false;
            canvas.style.cursor = 'grab';
        });

        canvas.addEventListener('mouseleave', () => {
            isDraggingCal = false;
            isDraggingBG = false;
            canvas.style.cursor = 'default';
        });

        canvas.addEventListener('wheel', (e) => {
            const { x, y } = getEventPosition(e);
            const scaleAmount = e.deltaY * -0.001;
            if (isPointerOverCalendar(x, y)) {
                e.preventDefault();
                updateState({ calendarScale: Math.max(0.5, Math.min(3, state.calendarScale + scaleAmount)) });
            } else {
                e.preventDefault();
                const nextScale = Math.max(0.2, Math.min(5, state.bgScale + scaleAmount));
                updateState({ bgScale: nextScale });
            }
        });

        let initialDistance = -1;
        let initialDistanceBG = -1;

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const { x, y } = getEventPosition(e);
                if (isPointerOverCalendar(x, y)) {
                    isDraggingCal = true;
                    dragStartX = x;
                    dragStartY = y;
                    initialCalendarX = state.calendarX;
                    initialCalendarY = state.calendarY;
                } else {
                    isDraggingBG = true;
                    dragStartX = x;
                    dragStartY = y;
                    initialBgOffsetX = state.bgOffsetX;
                    initialBgOffsetY = state.bgOffsetY;
                }
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const rect = canvas.getBoundingClientRect();
                const cx = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) * (canvas.width / rect.width);
                const cy = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) * (canvas.height / rect.height);
                if (isPointerOverCalendar(cx, cy)) {
                    initialDistance = dist;
                    initialDistanceBG = -1;
                } else {
                    initialDistanceBG = dist;
                    initialDistance = -1;
                }
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isDraggingCal && e.touches.length === 1) {
                const { x, y } = getEventPosition(e);
                const dx = x - dragStartX;
                const dy = y - dragStartY;
                updateState({ calendarX: initialCalendarX + dx, calendarY: initialCalendarY + dy });
            } else if (isDraggingBG && e.touches.length === 1) {
                const { x, y } = getEventPosition(e);
                const dx = x - dragStartX;
                const dy = y - dragStartY;
                updateState({ bgOffsetX: initialBgOffsetX + dx, bgOffsetY: initialBgOffsetY + dy });
            } else if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (initialDistance > 0) {
                    const scaleAmount = (distance - initialDistance) * 0.01;
                    updateState({ calendarScale: Math.max(0.5, Math.min(3, state.calendarScale + scaleAmount)) });
                    initialDistance = distance;
                } else if (initialDistanceBG > 0) {
                    const scaleAmount = (distance - initialDistanceBG) * 0.01;
                    const nextScale = Math.max(0.2, Math.min(5, state.bgScale + scaleAmount));
                    updateState({ bgScale: nextScale });
                    initialDistanceBG = distance;
                }
            }
        });

        canvas.addEventListener('touchend', (e) => {
            isDraggingCal = false;
            isDraggingBG = false;
            initialDistance = -1;
            initialDistanceBG = -1;
        });

        controls.downloadBtn.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = `月历壁纸-${state.year}-${state.month + 1}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });

        const toggleBtn = el('toggle-controls-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const panel = controls.controlsPanel;
                const isHidden = panel.style.display === 'none' || panel.style.display === '';
                panel.style.display = isHidden ? 'flex' : 'none';
                toggleBtn.textContent = isHidden ? '收起' : '设置';
            });
        }

        window.addEventListener('resize', render);
    }

    function createRatioButtons() {
        const container = controls.ratioSelector;
        if (!container) return;
        container.innerHTML = '';
        const portraitRatios = ['9:19.5', '9:20', '9:16', '3:4', '2:3'];
        const buttons = [];
        portraitRatios.forEach((r) => {
            const btn = document.createElement('button');
            btn.className = 'theme-toggle-button';
            btn.textContent = r;
            btn.addEventListener('click', () => {
                // 切换比例时，如有背景图则重算 cover 缩放并重置偏移
                const [rw, rh] = r.split(':').map(Number);
                const newW = state.exportWidth;
                const newH = Math.round(state.exportWidth * (rh / rw));
                if (state.bgImage) {
                    const coverScale = Math.max(newW / state.bgImage.width, newH / state.bgImage.height);
                    updateState({ ratio: r, hasAutoPlaced: false, bgScale: coverScale, bgOffsetX: 0, bgOffsetY: 0 });
                } else {
                    updateState({ ratio: r, hasAutoPlaced: false });
                }
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            container.appendChild(btn);
            buttons.push(btn);
        });
        const idx = portraitRatios.indexOf(state.ratio);
        if (idx >= 0) buttons[idx].classList.add('active');
    }

    // Initial setup
    window.onload = () => {
        createTextColorSwatches();
        createRatioButtons();
        setupEventListeners();
        render();
    };
});