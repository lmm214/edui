/**
 * 三角形三边关系探究模块
 * 允许用户输入三条边长度，并通过交互来验证是否能构成三角形
 */
class TriangleSidesModule {
    constructor(container) {
        this.container = container;
        this.sideA = 0;
        this.sideB = 0;
        this.sideC = 0;
        this.isDragging = false;
        this.selectedLine = null;
        this.startAngle = 0;
        this.currentScale = 1;
        
        // 存储线段对象
        this.lines = [];
        
        // 吸附设置 - 增大吸附范围
        this.snapThreshold = 12; // 原始值
        this.snapDistance = 12;  // 从6增加到12，增大吸附范围
        this.thirdPointThreshold = 12; // 保持现有值
        this.snappedPoints = []; // 存储已吸附的端点对
        
        // 新增：吸附后的锁定时间
        this.lastSnapTime = 0; // 记录最后一次吸附的时间
        this.snapLockDuration = 800; // 锁定时间500ms
        
        // 视图参数
        this.viewWidth = 0;
        this.viewHeight = 0;
        this.centerX = 0;
        this.centerY = 0;
        
        // SVG元素
        this.svg = null;
        this.linesGroup = null;
        this.feedbackText = null;
    }
    
    /**
     * 初始化模块
     */
    async init() {
        
        // 添加延迟确保DOM元素完全渲染
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 获取并确认关键元素已存在
        const canvasContainer = document.getElementById('triangle-canvas');
        if (!canvasContainer) {
            console.error('找不到画布容器元素');
            return;
        }
        
        // 初始化SVG画布
        this.initSVG();
        
        // 初始化事件监听
        this.initEventListeners();
        
        // 设置默认值
        document.getElementById('side-a-input').value = 3;
        document.getElementById('side-b-input').value = 4;
        document.getElementById('side-c-input').value = 5;
        
        // 再次延迟确保SVG已准备好
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 生成初始三角形
        this.generateTriangle();
    }
    
    /**
     * 初始化SVG画布
     */
    initSVG() {
        const canvasContainer = document.getElementById('triangle-canvas');
        if (!canvasContainer) {
            console.error('找不到画布容器元素');
            return;
        }
        
        // 清空容器，防止重复创建
        canvasContainer.innerHTML = '';
        
        this.viewWidth = canvasContainer.clientWidth || 800;
        this.viewHeight = canvasContainer.clientHeight || 400;
        this.centerX = this.viewWidth / 2;
        this.centerY = this.viewHeight / 2;
        
        // 创建SVG元素
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', `0 0 ${this.viewWidth} ${this.viewHeight}`);
        this.svg.style.touchAction = 'none'; // 防止触摸设备上的默认行为
        canvasContainer.appendChild(this.svg);
        
        // 创建背景网格
        this.createGrid();
        
        // 创建线段组
        this.linesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.svg.appendChild(this.linesGroup);
        
        // 更新反馈文本元素
        this.feedbackText = document.getElementById('feedback-text');
        console.log('SVG初始化完成', this.viewWidth, this.viewHeight);
    }
    
    /**
     * 创建背景网格
     */
    createGrid() {
        const gridSize = 100; // 增大网格尺寸
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('class', 'grid');
        
        // 横线
        for (let y = 0; y <= this.viewHeight; y += gridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0');
            line.setAttribute('y1', y.toString());
            line.setAttribute('x2', this.viewWidth.toString());
            line.setAttribute('y2', y.toString());
            line.setAttribute('stroke', '#dddddd'); // 更深的网格线颜色
            line.setAttribute('stroke-width', '2'); // 更粗的网格线
            gridGroup.appendChild(line);
        }
        
        // 竖线
        for (let x = 0; x <= this.viewWidth; x += gridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x.toString());
            line.setAttribute('y1', '0');
            line.setAttribute('x2', x.toString());
            line.setAttribute('y2', this.viewHeight.toString());
            line.setAttribute('stroke', '#dddddd'); // 更深的网格线颜色
            line.setAttribute('stroke-width', '2'); // 更粗的网格线
            gridGroup.appendChild(line);
        }
        
        // 添加到SVG的最底层
        this.svg.insertBefore(gridGroup, this.svg.firstChild);
    }
    
    /**
     * 初始化事件监听
     */
    initEventListeners() {
        // 移除可能已存在的事件监听器
        const generateBtn = document.getElementById('generate-btn');
        const resetBtn = document.getElementById('reset-btn');
        
        if (generateBtn) {
            const newGenerateBtn = generateBtn.cloneNode(true);
            generateBtn.parentNode.replaceChild(newGenerateBtn, generateBtn);
            newGenerateBtn.addEventListener('click', () => this.generateTriangle());
        }
        
        if (resetBtn) {
            const newResetBtn = resetBtn.cloneNode(true);
            resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
            newResetBtn.addEventListener('click', () => this.resetTriangle());
        }
        
        // 全局鼠标移动和抬起事件
        // 确保不重复绑定这些事件
        if (!this._mouseMoveHandler) {
            this._mouseMoveHandler = this.drag.bind(this);
            this._mouseUpHandler = this.endDrag.bind(this);
            document.addEventListener('mousemove', this._mouseMoveHandler);
            document.addEventListener('mouseup', this._mouseUpHandler);
        }
        
        // 滑块输入事件
        const inputs = ['side-a-input', 'side-b-input', 'side-c-input'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                const newInput = input.cloneNode(true);
                input.parentNode.replaceChild(newInput, input);
                const valueDisplay = newInput.nextElementSibling;
                
                // 初始化显示值
                valueDisplay.textContent = newInput.value;
                
                // 实时更新显示值
                newInput.addEventListener('input', (e) => {
                    valueDisplay.textContent = e.target.value;
                });
                
                newInput.addEventListener('change', (e) => {
                    // 确保值为正
                    if (e.target.value <= 0) {
                        e.target.value = 1;
                        valueDisplay.textContent = '1';
                    }
                });
            }
        });
    }
    
    /**
     * 生成三角形边
     */
    generateTriangle() {
        // 确保SVG和线段组存在
        if (!this.svg || !this.linesGroup) {
            console.error('SVG或线段组未初始化');
            this.initSVG(); // 尝试重新初始化
            if (!this.svg || !this.linesGroup) return;
        }
        
        // 重置已连接计数
        this.snappedPoints = [];
        
        const gridSize = 100; // 网格大小
        
        // 获取用户输入的三边长度（以网格为单位）
        this.sideA = parseFloat(document.getElementById('side-a-input').value) || 3;
        this.sideB = parseFloat(document.getElementById('side-b-input').value) || 4;
        this.sideC = parseFloat(document.getElementById('side-c-input').value) || 5;
        
        // 确保值为正
        this.sideA = Math.max(0.1, this.sideA);
        this.sideB = Math.max(0.1, this.sideB);
        this.sideC = Math.max(0.1, this.sideC);
        
        // 更新输入框
        document.getElementById('side-a-input').value = this.sideA;
        document.getElementById('side-b-input').value = this.sideB;
        document.getElementById('side-c-input').value = this.sideC;
        
        // 清除当前线段
        this.clearLines();
        
        // 在水平方向上创建三条线段，间隔开
        const startY = this.centerY;
        
        try {
            // 创建边B（绿色）- 居中显示
            const lineB = this.createLine(
                this.centerX - (this.sideB * gridSize) / 2,
                startY,
                this.centerX + (this.sideB * gridSize) / 2,
                startY,
                this.sideB,
                'B',
                '#10b981' // 绿色
            );

            // 创建边A（蓝色）- 在边B上方显示
            const lineA = this.createLine(
                this.centerX - (this.sideA * gridSize) / 2,
                startY - gridSize,
                this.centerX + (this.sideA * gridSize) / 2,
                startY - gridSize,
                this.sideA,
                'A',
                '#3b82f6' // 蓝色
            );
            
            // 创建边C（红色）- 在边B下方显示
            const lineC = this.createLine(
                this.centerX - (this.sideC * gridSize) / 2,
                startY + gridSize,
                this.centerX + (this.sideC * gridSize) / 2,
                startY + gridSize,
                this.sideC,
                'C',
                '#ef4444' // 红色
            );
            
            // 存储线段
            this.lines = [lineA, lineB, lineC];
            
            console.log('已创建三条线段', this.lines.length);
            
            // 重置反馈文本
            if (this.feedbackText) {
                this.feedbackText.textContent = '请将三边的端点连接在一起，已连接 0/3';
            }
            
            // 移除可能存在的虚线
            this.removeDashedConnection();
        } catch (error) {
            console.error('创建线段时出错:', error);
        }
    }
    
    /**
     * 创建一条线段
     */
    createLine(x1, y1, x2, y2, length, label, color) {
        // 将坐标对齐到网格
        const gridSize = 100;
        x1 = Math.round(x1 / gridSize) * gridSize;
        y1 = Math.round(y1 / gridSize) * gridSize;
        x2 = Math.round(x2 / gridSize) * gridSize;
        y2 = Math.round(y2 / gridSize) * gridSize;
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'line-group');
        // 存储网格单位的长度
        group.setAttribute('data-length', length);
        // 存储像素单位的长度
        group.setAttribute('data-length-pixels', length * 100);
        group.setAttribute('data-label', label);
        group.id = 'line-' + label.toLowerCase() + '-' + Date.now(); // 添加唯一ID
        
        // 创建线段
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', color);
        line.setAttribute('stroke-width', '6');
        line.setAttribute('class', 'line');
        group.appendChild(line);
        
        // 创建起点手柄
        const startHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        startHandle.setAttribute('cx', x1);
        startHandle.setAttribute('cy', y1);
        startHandle.setAttribute('r', '8');
        startHandle.setAttribute('fill', color);
        startHandle.setAttribute('class', 'line-handle start-handle');
        group.appendChild(startHandle);
        
        // 创建终点手柄
        const endHandle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        endHandle.setAttribute('cx', x2);
        endHandle.setAttribute('cy', y2);
        endHandle.setAttribute('r', '8');
        endHandle.setAttribute('fill', color);
        endHandle.setAttribute('class', 'line-handle end-handle');
        group.appendChild(endHandle);
        
        // 添加拖拽事件 - 直接给整个组添加事件
        this.addDragEvents(group);
        
        // 添加到SVG
        this.linesGroup.appendChild(group);
        
        // 返回线段对象
        return {
            group,
            line,
            startHandle,
            endHandle,
            length,
            label,
            color,
            x1, y1, x2, y2
        };
    }
    
    /**
     * 添加拖拽事件
     */
    addDragEvents(group) {
        const line = group.querySelector('.line');
        const startHandle = group.querySelector('.start-handle');
        const endHandle = group.querySelector('.end-handle');
        
        // 为整个组添加拖拽事件
        line.addEventListener('mousedown', (e) => this.startDrag(e, group, 'line'));
        startHandle.addEventListener('mousedown', (e) => this.startDrag(e, group, 'start'));
        endHandle.addEventListener('mousedown', (e) => this.startDrag(e, group, 'end'));
    }
    
    /**
     * 开始拖拽
     */
    startDrag(e, group, type) {
        e.preventDefault();
        
        // 找到对应的线段对象
        this.selectedLine = this.lines.find(line => line.group === group);
        if (!this.selectedLine) {
            console.error('找不到对应的线段对象');
            return;
        }
        
        // 如果拖动整条线段，且任一端点已吸附，则禁止拖动
        if (type === 'line') {
            const startSnapped = this.isEndPointSnapped(this.selectedLine, 'start');
            const endSnapped = this.isEndPointSnapped(this.selectedLine, 'end');
            if (startSnapped || endSnapped) {
                return;
            }
        }
        
        // 记录拖拽状态
        this.isDragging = true;
        this.dragType = type;
        
        // 记录起始位置
        this.startX = e.clientX;
        this.startY = e.clientY;
        
        // 记录元素初始位置
        this.initialX1 = parseFloat(this.selectedLine.line.getAttribute('x1'));
        this.initialY1 = parseFloat(this.selectedLine.line.getAttribute('y1'));
        this.initialX2 = parseFloat(this.selectedLine.line.getAttribute('x2'));
        this.initialY2 = parseFloat(this.selectedLine.line.getAttribute('y2'));
        
        // 检查线段是否已有端点吸附
        const fixedEndInfo = this.getFixedEnd(this.selectedLine);
        this.fixedEndInfo = fixedEndInfo;
        
        // 如果拖动整条线段，并且没有吸附端点，则解除该线段端点的所有吸附关系
        if (type === 'line' && !fixedEndInfo) {
            this.breakSnappedConnections(this.selectedLine);
        }
        
        // 如果拖动的是端点，并且该端点没有吸附，则解除该端点的吸附关系
        if ((type === 'start' || type === 'end') && !this.isEndPointSnapped(this.selectedLine, type)) {
            this.breakPointSnap(this.selectedLine, type);
        }
    }
    
    /**
     * 获取线段的固定端点信息（已吸附的端点）
     */
    getFixedEnd(line) {
        // 检查该线段的所有吸附关系
        for (const snap of this.snappedPoints) {
            if (snap.line1 === line) {
                return {
                    line: line,
                    end: snap.end1,
                    x: snap.end1 === 'start' ? line.x1 : line.x2,
                    y: snap.end1 === 'start' ? line.y1 : line.y2
                };
            }
            if (snap.line2 === line) {
                return {
                    line: line,
                    end: snap.end2,
                    x: snap.end2 === 'start' ? line.x1 : line.x2,
                    y: snap.end2 === 'start' ? line.y1 : line.y2
                };
            }
        }
        return null; // 没有吸附端点
    }
    
    /**
     * 检查端点是否已吸附
     */
    isEndPointSnapped(line, endType) {
        return this.snappedPoints.some(snap => 
            (snap.line1 === line && snap.end1 === endType) || 
            (snap.line2 === line && snap.end2 === endType)
        );
    }
    
    /**
     * 拖拽中
     */
    drag(e) {
        // 检查是否在吸附锁定时间内
        const currentTime = Date.now();
        if (currentTime - this.lastSnapTime < this.snapLockDuration) {
            return; // 如果在锁定时间内，直接返回
        }

        if (!this.isDragging || !this.selectedLine) return;
        
        // 记录当前吸附点数量，用于后续比较
        const beforeSnapCount = this.snappedPoints.length;
        
        // 计算位移
        let dx = e.clientX - this.startX;
        let dy = e.clientY - this.startY;
        
        // 如果线段的两个端点都已吸附，则不允许移动
        const startSnapped = this.isEndPointSnapped(this.selectedLine, 'start');
        const endSnapped = this.isEndPointSnapped(this.selectedLine, 'end');
        if (startSnapped && endSnapped) {
            return;
        }
        
        // 如果有固定端点（已经吸附的端点）且不是正在拖动的端点
        if (this.fixedEndInfo && 
            !(this.dragType === 'start' && this.fixedEndInfo.end === 'start') && 
            !(this.dragType === 'end' && this.fixedEndInfo.end === 'end')) {
            
            if (this.dragType === 'line') {
                // 如果拖动整条线段，且有一个端点已固定，则围绕固定端点旋转
                const isStartFixed = this.fixedEndInfo.end === 'start';
                const fixedX = isStartFixed ? this.initialX1 : this.initialX2;
                const fixedY = isStartFixed ? this.initialY1 : this.initialY2;
                
                // 获取移动端点的初始位置
                const movingInitialX = isStartFixed ? this.initialX2 : this.initialX1;
                const movingInitialY = isStartFixed ? this.initialY2 : this.initialY1;
                
                // 计算旋转角度
                const initialAngle = Math.atan2(movingInitialY - fixedY, movingInitialX - fixedX);
                const currentAngle = Math.atan2(movingInitialY + dy - fixedY, movingInitialX + dx - fixedX);
                const angleChange = currentAngle - initialAngle;
                
                // 计算线段长度（以网格单位计算）
                const length = this.selectedLine.length * 100; // 乘以100转换为像素
                
                // 计算移动端点的新位置，并确保对齐到网格
                const newMovingX = fixedX + Math.round(Math.cos(initialAngle + angleChange) * length / 100) * 100;
                const newMovingY = fixedY + Math.round(Math.sin(initialAngle + angleChange) * length / 100) * 100;
                
                // 根据固定端点更新线段位置
                if (isStartFixed) {
                    this.updateLinePosition(this.selectedLine, fixedX, fixedY, newMovingX, newMovingY);
                    this.checkSnapForPoint(this.selectedLine, 'end');
                } else {
                    this.updateLinePosition(this.selectedLine, newMovingX, newMovingY, fixedX, fixedY);
                    this.checkSnapForPoint(this.selectedLine, 'start');
                }
            } else if (this.dragType === 'start' || this.dragType === 'end') {
                // 如果拖动的是端点，且另一个端点已固定，则围绕固定端点旋转
                const isOppositeEndFixed = (this.dragType === 'start' && this.fixedEndInfo.end === 'end') ||
                                          (this.dragType === 'end' && this.fixedEndInfo.end === 'start');
                
                if (isOppositeEndFixed) {
                    const fixedX = this.dragType === 'start' ? this.initialX2 : this.initialX1;
                    const fixedY = this.dragType === 'start' ? this.initialY2 : this.initialY1;
                    
                    // 计算鼠标当前位置相对于固定点的角度
                    const mouseX = this.dragType === 'start' ? this.initialX1 + dx : this.initialX2 + dx;
                    const mouseY = this.dragType === 'start' ? this.initialY1 + dy : this.initialY2 + dy;
                    const angle = Math.atan2(mouseY - fixedY, mouseX - fixedX);
                    
                    // 计算长度
                    const length = Math.round(this.selectedLine.length); // 强制网格对齐
                    
                    // 计算端点新位置
                    const newX = fixedX + Math.round(Math.cos(angle) * length * 100);
                    const newY = fixedY + Math.round(Math.sin(angle) * length * 100);
                    
                    // 更新线段位置
                    if (this.dragType === 'start') {
                        this.updateLinePosition(this.selectedLine, newX, newY, fixedX, fixedY);
                        this.checkSnapForPoint(this.selectedLine, 'start');
                    } else {
                        this.updateLinePosition(this.selectedLine, fixedX, fixedY, newX, newY);
                        this.checkSnapForPoint(this.selectedLine, 'end');
                    }
                }
            }
        } else {
            // 如果没有固定端点，或者拖动的正是固定端点，则使用原有逻辑
            if (this.dragType === 'line') {
                // 整体移动线段
                const newX1 = this.initialX1 + dx;
                const newY1 = this.initialY1 + dy;
                const newX2 = this.initialX2 + dx;
                const newY2 = this.initialY2 + dy;
                
                // 更新线段位置
                this.updateLinePosition(this.selectedLine, newX1, newY1, newX2, newY2);
                
                // 检查端点吸附
                this.checkSnapForBothEnds(this.selectedLine);
            } else if (this.dragType === 'start') {
                // 移动起点
                const newX1 = this.initialX1 + dx;
                const newY1 = this.initialY1 + dy;
                
                // 确保线段长度保持不变
                const newPos = this.constrainToLength(
                    newX1, newY1, 
                    this.initialX2, this.initialY2, 
                    Math.round(this.selectedLine.length)
                );
                
                // 更新线段位置
                this.updateLinePosition(this.selectedLine, newPos.x, newPos.y, this.initialX2, this.initialY2);
                
                // 检查端点吸附
                this.checkSnapForPoint(this.selectedLine, 'start');
            } else if (this.dragType === 'end') {
                // 移动终点
                const newX2 = this.initialX2 + dx;
                const newY2 = this.initialY2 + dy;
                
                // 确保线段长度保持不变
                const newPos = this.constrainToLength(
                    newX2, newY2, 
                    this.initialX1, this.initialY1, 
                    Math.round(this.selectedLine.length)
                );
                
                // 更新线段位置
                this.updateLinePosition(this.selectedLine, this.initialX1, this.initialY1, newPos.x, newPos.y);
                
                // 检查端点吸附
                this.checkSnapForPoint(this.selectedLine, 'end');
            }
        }
        
        // 在每次拖动时，检查是否有吸附被断开
        this.checkBrokenSnaps();
        
        // 如果吸附点数量变化，更新UI并记录时间
        if (beforeSnapCount !== this.snappedPoints.length) {
            this.updateFeedbackMessage();
            this.lastSnapTime = Date.now(); // 记录最后一次吸附的时间
        }
        
        // 检测三角形形成情况
        this.checkTriangleFormation();
    }
    
    /**
     * 检查线段两个端点的吸附
     */
    checkSnapForBothEnds(line) {
        this.checkSnapForPoint(line, 'start');
        this.checkSnapForPoint(line, 'end');
    }
    
    /**
     * 检查线段端点的吸附
     */
    checkSnapForPoint(line, endType) {
        const snapDistance = this.snapDistance; // 使用更小的吸附距离
        const currentPoint = endType === 'start' ? 
            { x: line.x1, y: line.y1 } : { x: line.x2, y: line.y2 };
        
        // 如果已经有两个点对齐了，不再允许新的对齐
        if (this.snappedPoints.length >= 2) {
            return;
        }
        
        // 检查与所有其他线段端点的距离
        for (let i = 0; i < this.lines.length; i++) {
            if (this.lines[i] === line) continue;
            
            // 检查与起点的距离
            const distToStart = this.calcDistance(currentPoint.x, currentPoint.y, this.lines[i].x1, this.lines[i].y1);
            if (distToStart < snapDistance) {
                // 对齐到起点
                this.snapPoints(line, endType, this.lines[i], 'start');
                return;
            }
            
            // 检查与终点的距离
            const distToEnd = this.calcDistance(currentPoint.x, currentPoint.y, this.lines[i].x2, this.lines[i].y2);
            if (distToEnd < snapDistance) {
                // 对齐到终点
                this.snapPoints(line, endType, this.lines[i], 'end');
                return;
            }
        }
    }
    
    /**
     * 显示吸附警告 - 当两个端点都想吸附但会导致线段长度变形时
     */
    showSnapWarning(line, endType) {
        const handle = endType === 'start' ? line.startHandle : line.endHandle;
        
        // 添加闪烁警告效果
        if (!handle.querySelector('animate.warning')) {
            // 临时保存原始颜色
            const originalColor = handle.getAttribute('fill');
            
            // 设置警告色
            handle.setAttribute('fill', '#ff6b6b'); 
            
            // 添加大小变化动画
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'r');
            animate.setAttribute('values', '6;8;6');
            animate.setAttribute('dur', '0.3s');
            animate.setAttribute('repeatCount', '2');
            animate.classList.add('warning');
            handle.appendChild(animate);
            
            // 动画结束后恢复原始颜色
            setTimeout(() => {
                handle.setAttribute('fill', originalColor);
                const warningAnim = handle.querySelector('animate.warning');
                if (warningAnim) {
                    handle.removeChild(warningAnim);
                }
            }, 600);
        }
    }
    
    /**
     * 添加吸附连接
     */
    addSnapConnection(line1, end1, line2, end2) {
        // 首先移除可能的旧连接
        this.breakPointSnap(line1, end1);
        
        // 然后添加新连接
        this.snappedPoints.push({
            line1, end1, line2, end2
        });
    }
    
    /**
     * 高亮显示吸附点
     */
    highlightSnappedPoint(line, endType) {
        const handle = endType === 'start' ? line.startHandle : line.endHandle;
        
        // 设置更大的半径
        handle.setAttribute('r', '12');
        
        // 添加闪光效果
        if (!handle.querySelector('animate')) {
            const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            animate.setAttribute('attributeName', 'fill-opacity');
            animate.setAttribute('values', '0.7;1;0.7');
            animate.setAttribute('dur', '1s');
            animate.setAttribute('repeatCount', 'indefinite');
            handle.appendChild(animate);
            
            // 添加颜色变化动画
            const colorAnimate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            colorAnimate.setAttribute('attributeName', 'fill');
            colorAnimate.setAttribute('values', '#ffffff;' + handle.getAttribute('fill'));
            colorAnimate.setAttribute('dur', '0.5s');
            colorAnimate.setAttribute('repeatCount', 'indefinite');
            handle.appendChild(colorAnimate);
        }
    }
    
    /**
     * 重置端点高亮
     */
    resetPointHighlight(line, endType) {
        const handle = endType === 'start' ? line.startHandle : line.endHandle;
        
        // 恢复正常半径
        handle.setAttribute('r', '8');
        
        // 移除所有动画效果
        const animations = handle.querySelectorAll('animate');
        animations.forEach(animate => {
            handle.removeChild(animate);
        });
    }
    
    /**
     * 结束拖拽
     */
    endDrag() {
        this.isDragging = false;
        
        // 检查是否有端点需要吸附
        if (this.selectedLine) {
            this.checkSnapForBothEnds(this.selectedLine);
            
            // 检查是否有吸附被断开
            this.checkBrokenSnaps();
        }
        
        this.selectedLine = null;
        
        // 检查三角形形成情况
        this.checkTriangleFormation();
    }
    
    /**
     * 检测三边是否能构成三角形 - 完全重写判定逻辑
     */
    checkTriangleFormation() {
        if (this.lines.length !== 3) return;
        
        // 获取三条线段
        const blueLineIndex = this.lines.findIndex(line => line.color === '#3b82f6');
        const greenLineIndex = this.lines.findIndex(line => line.color === '#10b981');
        const redLineIndex = this.lines.findIndex(line => line.color === '#ef4444');
        
        if (blueLineIndex === -1 || greenLineIndex === -1 || redLineIndex === -1) {
            console.error('找不到蓝、绿、红三条线段');
            return;
        }
        
        const blueLine = this.lines[blueLineIndex];
        const greenLine = this.lines[greenLineIndex];
        const redLine = this.lines[redLineIndex];
        
        // 条件1: 检查三角形不等式
        const a = blueLine.length;
        const b = greenLine.length;
        const c = redLine.length;
        const satisfiesInequality = this.checkTriangleInequality(a, b, c);
        
        // 条件2: 检查所有端点是否两两接近
        const allPointsClose = this.checkAllEndpointsClose();
        
        // 如果同时满足两个条件，则可以构成三角形
        if (satisfiesInequality && allPointsClose) {
            this.feedbackText.textContent = '✓ 成功! 这三边可以构成三角形';
            this.feedbackText.parentElement.className = 'mb-4 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-center';
            this.feedbackText.className = 'font-medium text-green-700 dark:text-green-400';
            
            // 如果有三个吸附点，就不显示虚线
            if (this.snappedPoints.length < 3) {
                this.showAllConnectionDashes();
            } else {
                this.removeDashedConnection();
            }
        } 
        // 如果端点都接近但不满足三角形不等式
        else if (allPointsClose && !satisfiesInequality) {
            this.feedbackText.textContent = '✗ 不能构成三角形：三角形不等式不成立';
            this.feedbackText.parentElement.className = 'mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-center';
            this.feedbackText.className = 'font-medium text-red-700 dark:text-red-400';
            this.removeDashedConnection();
        }
        // 如果满足三角形不等式但端点未全部接近
        else if (satisfiesInequality && !allPointsClose) {
            this.feedbackText.textContent = `请将所有端点连接在一起 (已连接 ${this.snappedPoints.length}/3)`;
            this.feedbackText.parentElement.className = 'mb-4 p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-center';
            this.feedbackText.className = 'font-medium text-yellow-700 dark:text-yellow-400';
            this.removeDashedConnection();
        }
        // 两个条件都不满足
        else {
            this.feedbackText.textContent = `请将三边的端点连接在一起，检验是否能构成三角形 (已连接 ${this.snappedPoints.length}/3)`;
            this.feedbackText.parentElement.className = 'mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-center';
            this.feedbackText.className = 'font-medium';
            this.removeDashedConnection();
        }
    }
    
    /**
     * 检查所有端点是否两两接近 - 新增函数
     */
    checkAllEndpointsClose() {
        // 收集所有线段的端点坐标
        const endpoints = [];
        
        this.lines.forEach(line => {
            endpoints.push({ 
                line, 
                type: 'start', 
                x: line.x1, 
                y: line.y1 
            });
            
            endpoints.push({ 
                line, 
                type: 'end', 
                x: line.x2, 
                y: line.y2 
            });
        });
        
        // 每条线段有2个端点，总共有6个端点
        // 我们需要检查这6个端点是否可以形成3对接近的点
        
        // 已经匹配的端点索引
        const matched = new Set();
        
        // 接近的端点对
        const closePairs = [];
        
        // 遍历所有端点对，找到所有接近的端点对
        for (let i = 0; i < endpoints.length; i++) {
            if (matched.has(i)) continue; // 跳过已匹配的端点
            
            for (let j = i + 1; j < endpoints.length; j++) {
                if (matched.has(j)) continue; // 跳过已匹配的端点
                
                // 跳过同一条线段的两个端点
                if (endpoints[i].line === endpoints[j].line) continue;
                
                // 计算两点距离
                const dist = this.calcDistance(
                    endpoints[i].x, endpoints[i].y,
                    endpoints[j].x, endpoints[j].y
                );
                
                // 如果距离小于吸附距离，认为接近
                if (dist <= this.snapDistance) {
                    closePairs.push([i, j]);
                    matched.add(i);
                    matched.add(j);
                    break; // 找到匹配后，不再为当前端点寻找其他匹配
                }
            }
        }
        
        // 如果找到3对接近的端点，且这3对端点包含了所有6个端点
        return closePairs.length === 3 && matched.size === 6;
    }
    
    /**
     * 显示所有连接的虚线 - 新增函数
     */
    showAllConnectionDashes() {
        // 先移除已有的虚线
        this.removeDashedConnection();
        
        // 收集所有线段的端点坐标
        const endpoints = [];
        
        this.lines.forEach(line => {
            endpoints.push({ 
                line, 
                type: 'start', 
                x: line.x1, 
                y: line.y1 
            });
            
            endpoints.push({ 
                line, 
                type: 'end', 
                x: line.x2, 
                y: line.y2 
            });
        });
        
        // 已经匹配的端点索引
        const matched = new Set();
        
        // 绘制所有接近但未吸附的端点对之间的连线
        for (let i = 0; i < endpoints.length; i++) {
            if (matched.has(i)) continue;
            
            for (let j = i + 1; j < endpoints.length; j++) {
                if (matched.has(j)) continue;
                
                // 跳过同一条线段的两个端点
                if (endpoints[i].line === endpoints[j].line) continue;
                
                // 计算两点距离
                const dist = this.calcDistance(
                    endpoints[i].x, endpoints[i].y,
                    endpoints[j].x, endpoints[j].y
                );
                
                // 如果距离小于吸附距离
                if (dist <= this.snapDistance) {
                    // 检查这两个端点是否已经吸附
                    const isSnapped = this.snappedPoints.some(snap => 
                        (snap.line1 === endpoints[i].line && snap.end1 === endpoints[i].type &&
                         snap.line2 === endpoints[j].line && snap.end2 === endpoints[j].type) ||
                        (snap.line1 === endpoints[j].line && snap.end1 === endpoints[j].type &&
                         snap.line2 === endpoints[i].line && snap.end2 === endpoints[i].type)
                    );
                    
                    // 如果没有吸附，则绘制虚线连接
                    if (!isSnapped) {
                        this.showDashedConnection(
                            endpoints[i].x, endpoints[i].y,
                            endpoints[j].x, endpoints[j].y
                        );
                    }
                    
                    matched.add(i);
                    matched.add(j);
                    break;
                }
            }
        }
    }
    
    /**
     * 检查三角形不等式
     */
    checkTriangleInequality(a, b, c) {
        return (a + b > c) && (b + c > a) && (c + a > b);
    }
    
    /**
     * 获取线段的连接情况
     */
    getLineConnections(line) {
        const connections = [];
        
        this.lines.forEach(otherLine => {
            if (otherLine !== line) {
                const isConnected = this.snappedPoints.some(snap => 
                    (snap.line1 === line && snap.line2 === otherLine) || 
                    (snap.line2 === line && snap.line1 === otherLine)
                );
                
                connections.push({
                    otherLine,
                    isConnected
                });
            }
        });
        
        return connections;
    }
    
    /**
     * 获取线段未连接的端点
     */
    getUnconnectedEnd(line) {
        // 检查起点是否连接
        const isStartConnected = this.isEndPointSnapped(line, 'start');
        
        // 检查终点是否连接
        const isEndConnected = this.isEndPointSnapped(line, 'end');
        
        if (!isStartConnected && isEndConnected) {
            return { end: 'start' };
        } else if (isStartConnected && !isEndConnected) {
            return { end: 'end' };
        }
        
        return null; // 两个端点都连接或都未连接
    }
    
    /**
     * 显示虚线连接
     */
    showDashedConnection(x1, y1, x2, y2) {
        // 创建虚线连接
        const dashedLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        dashedLine.setAttribute('x1', x1);
        dashedLine.setAttribute('y1', y1);
        dashedLine.setAttribute('x2', x2);
        dashedLine.setAttribute('y2', y2);
        dashedLine.setAttribute('stroke', '#9ca3af'); // 灰色
        dashedLine.setAttribute('stroke-width', '2');
        dashedLine.setAttribute('stroke-dasharray', '5,3');
        dashedLine.setAttribute('class', 'dashed-connection');
        
        // 添加到线段组
        this.linesGroup.appendChild(dashedLine);
    }
    
    /**
     * 移除虚线连接
     */
    removeDashedConnection() {
        // 移除所有虚线
        const dashedLines = this.linesGroup.querySelectorAll('.dashed-connection');
        dashedLines.forEach(line => {
            this.linesGroup.removeChild(line);
        });
    }
    
    /**
     * 分析线段连接情况
     */
    analyzeConnections() {
        // 每条线应有两个端点与其他线段连接
        const connectedEnds = {
            [this.lines[0].group.id]: { start: false, end: false },
            [this.lines[1].group.id]: { start: false, end: false },
            [this.lines[2].group.id]: { start: false, end: false }
        };
        
        // 分析吸附点连接情况
        this.snappedPoints.forEach(snap => {
            // 标记端点已连接
            const line1Id = snap.line1.group.id;
            const line2Id = snap.line2.group.id;
            
            if (connectedEnds[line1Id]) {
                connectedEnds[line1Id][snap.end1] = true;
            }
            
            if (connectedEnds[line2Id]) {
                connectedEnds[line2Id][snap.end2] = true;
            }
        });
        
        // 计算已连接的端点对数量
        let connectedPairs = 0;
        Object.values(connectedEnds).forEach(ends => {
            if (ends.start) connectedPairs++;
            if (ends.end) connectedPairs++;
        });
        
        // 因为每个连接计算了两次（两个端点），所以除以2
        connectedPairs = connectedPairs / 2;
        
        return { connectedEnds, connectedPairs };
    }
    
    /**
     * 检查三点是否共线
     */
    checkCollinearity() {
        // 找到吸附形成的三个点
        const points = [];
        
        // 从吸附连接中提取点
        this.snappedPoints.forEach(snap => {
            const p1 = snap.end1 === 'start' 
                ? { x: snap.line1.x1, y: snap.line1.y1 }
                : { x: snap.line1.x2, y: snap.line1.y2 };
                
            if (!points.some(p => this.calcDistance(p.x, p.y, p1.x, p1.y) < 1)) {
                points.push(p1);
            }
        });
        
        // 如果没有找到三个点，返回false
        if (points.length < 3) return false;
        
        // 检查三点是否共线
        // 使用向量叉积判断：如果三点共线，则两个向量的叉积为0
        const vec1 = {
            x: points[1].x - points[0].x,
            y: points[1].y - points[0].y
        };
        
        const vec2 = {
            x: points[2].x - points[0].x,
            y: points[2].y - points[0].y
        };
        
        // 计算叉积
        const crossProduct = vec1.x * vec2.y - vec1.y * vec2.x;
        
        // 如果叉积接近0，则三点共线
        return Math.abs(crossProduct) < 1;
    }
    
    /**
     * 添加缺失的方法：计算两点间距离
     */
    calcDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    /**
     * 约束点的位置使线段保持固定长度
     */
    constrainToLength(x, y, fixedX, fixedY, length) {
        const gridSize = 100; // 网格大小
        const targetLength = length * gridSize; // 目标长度（像素）
        
        // 计算当前点到固定点的向量
        const dirX = x - fixedX;
        const dirY = y - fixedY;
        
        // 计算当前长度
        const currentLength = Math.sqrt(dirX * dirX + dirY * dirY);
        
        // 如果当前长度为0，返回一个默认位置
        if (currentLength === 0) {
            return {
                x: fixedX + targetLength,
                y: fixedY
            };
        }
        
        // 计算单位向量
        const unitX = dirX / currentLength;
        const unitY = dirY / currentLength;
        
        // 应用目标长度
        return {
            x: fixedX + unitX * targetLength,
            y: fixedY + unitY * targetLength
        };
    }
    
    /**
     * 更新线段位置 - 修复线段更新
     */
    updateLinePosition(lineObj, x1, y1, x2, y2) {
        // 更新线段
        lineObj.line.setAttribute('x1', x1);
        lineObj.line.setAttribute('y1', y1);
        lineObj.line.setAttribute('x2', x2);
        lineObj.line.setAttribute('y2', y2);
        
        // 更新手柄
        lineObj.startHandle.setAttribute('cx', x1);
        lineObj.startHandle.setAttribute('cy', y1);
        lineObj.endHandle.setAttribute('cx', x2);
        lineObj.endHandle.setAttribute('cy', y2);
        
        // 更新存储的坐标
        lineObj.x1 = x1;
        lineObj.y1 = y1;
        lineObj.x2 = x2;
        lineObj.y2 = y2;
    }
    
    /**
     * 清除所有线段
     */
    clearLines() {
        if (!this.lines || !this.linesGroup) return;
        
        // 移除所有线段组元素
        while (this.linesGroup.firstChild) {
            this.linesGroup.removeChild(this.linesGroup.firstChild);
        }
        
        // 清空数组
        this.lines = [];
    }
    
    /**
     * 重置三角形
     */
    resetTriangle() {
        this.generateTriangle();
    }
    
    /**
     * 断开线段的所有吸附连接
     */
    breakSnappedConnections(line) {
        // 计算断开前的连接数
        const beforeCount = this.snappedPoints.length;
        
        // 过滤掉包含当前线段的连接
        const newSnappedPoints = this.snappedPoints.filter(snap => 
            snap.line1 !== line && snap.line2 !== line
        );
        
        // 如果连接数量变化了，更新UI和反馈
        if (beforeCount !== newSnappedPoints.length) {
            this.snappedPoints = newSnappedPoints;
            
            // 重置所有高亮显示
            this.resetAllHighlights();
            
            // 更新反馈消息
            this.updateFeedbackMessage();
        }
    }
    
    /**
     * 断开特定端点的吸附
     */
    breakPointSnap(line, endType) {
        // 计算断开前的连接数
        const beforeCount = this.snappedPoints.length;
        
        // 过滤掉包含当前端点的连接
        const newSnappedPoints = this.snappedPoints.filter(snap => 
            !(snap.line1 === line && snap.end1 === endType) &&
            !(snap.line2 === line && snap.end2 === endType)
        );
        
        // 如果连接数量变化了，更新UI和反馈
        if (beforeCount !== newSnappedPoints.length) {
            this.snappedPoints = newSnappedPoints;
            
            // 重置当前端点的高亮显示
            this.resetPointHighlight(line, endType);
            
            // 更新反馈消息
            this.updateFeedbackMessage();
        }
    }
    
    /**
     * 更新反馈消息，确保实时反映当前状态
     */
    updateFeedbackMessage() {
        if (this.feedbackText) {
            // 显示当前准确的吸附数量
            this.feedbackText.textContent = `请将三边的端点连接在一起，已连接 ${this.snappedPoints.length}/3`;
            this.feedbackText.parentElement.className = 'mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-center';
            this.feedbackText.className = 'font-medium';
        }
        
        // 重新检查三角形形成情况
        this.checkTriangleFormation();
    }
    
    /**
     * 对齐两个点 - 添加缺失的函数
     */
    snapPoints(line1, end1, line2, end2) {
        // 获取目标点的坐标
        const targetX = end2 === 'start' ? line2.x1 : line2.x2;
        const targetY = end2 === 'start' ? line2.y1 : line2.y2;
        
        // 获取固定端点的坐标
        const fixedX = end1 === 'start' ? line1.x2 : line1.x1;
        const fixedY = end1 === 'start' ? line1.y2 : line1.y1;
        
        // 计算当前线段长度（以网格单位计算）
        const length = Math.round(line1.length);
        
        // 计算新的移动端点位置，保持长度为整数网格单位
        const angle = Math.atan2(targetY - fixedY, targetX - fixedX);
        const newX = fixedX + Math.round(Math.cos(angle) * length * 100);
        const newY = fixedY + Math.round(Math.sin(angle) * length * 100);
        
        // 更新线段位置
        if (end1 === 'start') {
            this.updateLinePosition(line1, newX, newY, fixedX, fixedY);
        } else {
            this.updateLinePosition(line1, fixedX, fixedY, newX, newY);
        }
        
        // 添加吸附连接
        this.addSnapConnection(line1, end1, line2, end2);
        
        // 高亮显示吸附点
        this.highlightSnappedPoint(line1, end1);
        this.highlightSnappedPoint(line2, end2);
    }
    
    /**
     * 重置所有高亮显示 - 添加缺失的函数
     */
    resetAllHighlights() {
        // 遍历所有线段，重置两个端点的高亮
        this.lines.forEach(line => {
            this.resetPointHighlight(line, 'start');
            this.resetPointHighlight(line, 'end');
        });
    }
    
    /**
     * 新增函数：检查是否有吸附被断开
     */
    checkBrokenSnaps() {
        // 创建临时数组存储仍然有效的吸附
        const validSnaps = [];
        
        for (const snap of this.snappedPoints) {
            // 获取两个端点的坐标
            const point1 = snap.end1 === 'start' ? 
                { x: snap.line1.x1, y: snap.line1.y1 } : 
                { x: snap.line1.x2, y: snap.line1.y2 };
                
            const point2 = snap.end2 === 'start' ? 
                { x: snap.line2.x1, y: snap.line2.y1 } : 
                { x: snap.line2.x2, y: snap.line2.y2 };
            
            // 计算当前距离
            const distance = this.calcDistance(point1.x, point1.y, point2.x, point2.y);
            
            // 如果距离仍然在吸附范围内，则保留这个吸附
            if (distance < 1) {
                validSnaps.push(snap);
            } else {
                // 如果吸附断开，重置端点高亮
                this.resetPointHighlight(snap.line1, snap.end1);
                this.resetPointHighlight(snap.line2, snap.end2);
            }
        }
        
        // 只有在数量变化时才更新吸附点数组
        if (validSnaps.length !== this.snappedPoints.length) {
            this.snappedPoints = validSnaps;
        }
    }
}

// 导出模块
window.TriangleSidesModule = TriangleSidesModule;