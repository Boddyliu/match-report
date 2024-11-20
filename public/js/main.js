// 定义常量
const CANVAS_BASE_WIDTH = 1920;
const CANVAS_BASE_HEIGHT = 1080;
const ASPECT_RATIOS = {
    '16:9': { width: 1920, height: 1080 },
    '9:16': { width: 1080, height: 1920 },
    '4:3': { width: 1600, height: 1200 },
    '1:1': { width: 1500, height: 1500 }
};

// 初始化变量
let canvas;
let currentScale = 1;
let team1TextObj;
let team2TextObj;
let scoreTextObj;
let team1LogoObj;
let team2LogoObj;
let currentBackground;

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas();
    initializeEventListeners();
});

// 初始化画布
function initializeCanvas() {
    // 获取容器尺寸
    const container = document.querySelector('.canvas-wrapper');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 获取选择的宽高比
    const aspectRatio = document.getElementById('aspectRatio').value;
    const dimensions = ASPECT_RATIOS[aspectRatio];

    // 计算适合容器的缩放比例
    const scaleX = (containerWidth * 0.9) / dimensions.width;
    const scaleY = (containerHeight * 0.9) / dimensions.height;
    currentScale = Math.min(scaleX, scaleY);

    // 创建画布
    canvas = new fabric.Canvas('canvas', {
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true, // 保持对象堆叠顺序
        selection: true
    });

    // 设置画布容器尺寸
    const canvasContainer = document.querySelector('.canvas-container');
    canvasContainer.style.transform = `scale(${currentScale})`;
    canvasContainer.style.transformOrigin = 'center center';

    // 更新预览缩放滑块
    const zoomSlider = document.getElementById('previewZoom');
    zoomSlider.value = 100;
    updatePreviewZoom();

    // 添加画布事件监听
    canvas.on('object:moving', function(e) {
        if (e.target === currentBackground) {
            canvas.sendToBack(currentBackground);
            bringTeamInfoToFront();
        }
    });

    canvas.on('object:scaling', function(e) {
        if (e.target === currentBackground) {
            canvas.sendToBack(currentBackground);
            bringTeamInfoToFront();
        }
    });

    canvas.on('object:modified', function(e) {
        if (e.target === currentBackground) {
            canvas.sendToBack(currentBackground);
            bringTeamInfoToFront();
        }
        canvas.renderAll();
    });

    // 初始化队伍信息
    initTeamInfo();

    canvas.renderAll();
}

// 初始化队伍信息
function initTeamInfo() {
    // 设置默认字号
    document.getElementById('team1FontSize').value = '40';
    document.getElementById('team2FontSize').value = '40';
    document.getElementById('scoreFontSize').value = '56';

    // 基本文本属性
    const baseTextProps = {
        fontFamily: 'Arial',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockUniScaling: true,
        strokeWidth: 0,
        shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.3)',
            blur: 5,
            offsetX: 2,
            offsetY: 2
        })
    };

    // 创建队伍1文本
    team1TextObj = new fabric.Text('Team 1', {
        ...baseTextProps,
        fontSize: 40,
        left: canvas.width * 0.25,
        top: canvas.height * 0.4,
        fill: '#ffffff',
        name: 'team1Name'
    });

    // 创建队伍2文本
    team2TextObj = new fabric.Text('Team 2', {
        ...baseTextProps,
        fontSize: 40,
        left: canvas.width * 0.75,
        top: canvas.height * 0.4,
        fill: '#ffffff',
        name: 'team2Name'
    });

    // 创建比分文本
    scoreTextObj = new fabric.Text('0 - 0', {
        ...baseTextProps,
        fontSize: 56,
        left: canvas.width * 0.5,
        top: canvas.height * 0.4,
        fill: '#ffffff',
        name: 'score'
    });

    // 添加到画布
    canvas.add(team1TextObj, team2TextObj, scoreTextObj);
    bringTeamInfoToFront();
    canvas.renderAll();

    // 添加事件监听
    addTeamInfoEventListeners();
}

// 将队伍信息移到最上层
function bringTeamInfoToFront() {
    if (team1TextObj) team1TextObj.bringToFront();
    if (team2TextObj) team2TextObj.bringToFront();
    if (scoreTextObj) scoreTextObj.bringToFront();
}

// 监听画布选择事件
canvas.on('selection:created', function(e) {
    // 保存当前选中对象的样式
    const target = e.target;
    if (target && (target.name === 'team1Name' || target.name === 'team2Name' || target.name === 'score')) {
        target._originalStyles = {
            fill: target.fill,
            fontSize: target.fontSize,
            fontFamily: target.fontFamily,
            shadow: target.shadow,
            strokeWidth: target.strokeWidth
        };
    }
});

// 监听画布取消选择事件
canvas.on('selection:cleared', function(e) {
    // 恢复之前保存的样式
    canvas.getObjects().forEach(obj => {
        if (obj._originalStyles && (obj.name === 'team1Name' || obj.name === 'team2Name' || obj.name === 'score')) {
            obj.set(obj._originalStyles);
        }
    });
    canvas.renderAll();
});

// 监听对象修改事件
canvas.on('object:modified', function(e) {
    const target = e.target;
    // 如果是队伍信息相关的对象，保存新的位置
    if (target && (target.name === 'team1Name' || target.name === 'team2Name' || target.name === 'score')) {
        target._originalStyles = {
            ...target._originalStyles,
            left: target.left,
            top: target.top,
            scaleX: target.scaleX,
            scaleY: target.scaleY
        };
    }
});

// 更新队伍信息
function updateTeamInfo() {
    const team1Name = document.getElementById('team1Name').value || 'Team 1';
    const team2Name = document.getElementById('team2Name').value || 'Team 2';
    const team1Score = document.getElementById('team1Score').value || '0';
    const team2Score = document.getElementById('team2Score').value || '0';
    
    // 获取颜色和字号设置
    const team1Color = document.getElementById('team1Color').value;
    const team2Color = document.getElementById('team2Color').value;
    const scoreColor = document.getElementById('scoreColor').value;
    const team1FontSize = parseInt(document.getElementById('team1FontSize').value);
    const team2FontSize = parseInt(document.getElementById('team2FontSize').value);
    const scoreFontSize = parseInt(document.getElementById('scoreFontSize').value);

    // 更新文本对象的基本属性
    const baseTextProps = {
        fontFamily: 'Arial',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        selectable: true,
        hasControls: true,
        hasBorders: true,
        lockUniScaling: true,
        strokeWidth: 0,
        shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.3)',
            blur: 5,
            offsetX: 2,
            offsetY: 2
        })
    };

    // 更新队伍1文本，保持当前位置
    if (team1TextObj) {
        const currentLeft = team1TextObj.left;
        const currentTop = team1TextObj.top;
        const currentScaleX = team1TextObj.scaleX;
        const currentScaleY = team1TextObj.scaleY;

        team1TextObj.set({
            ...baseTextProps,
            text: team1Name,
            fill: team1Color,
            fontSize: team1FontSize,
            left: currentLeft,
            top: currentTop,
            scaleX: currentScaleX,
            scaleY: currentScaleY,
            name: 'team1Name'
        });
    }

    // 更新队伍2文本，保持当前位置
    if (team2TextObj) {
        const currentLeft = team2TextObj.left;
        const currentTop = team2TextObj.top;
        const currentScaleX = team2TextObj.scaleX;
        const currentScaleY = team2TextObj.scaleY;

        team2TextObj.set({
            ...baseTextProps,
            text: team2Name,
            fill: team2Color,
            fontSize: team2FontSize,
            left: currentLeft,
            top: currentTop,
            scaleX: currentScaleX,
            scaleY: currentScaleY,
            name: 'team2Name'
        });
    }

    // 更新比分文本，保持当前位置
    if (scoreTextObj) {
        const currentLeft = scoreTextObj.left;
        const currentTop = scoreTextObj.top;
        const currentScaleX = scoreTextObj.scaleX;
        const currentScaleY = scoreTextObj.scaleY;

        scoreTextObj.set({
            ...baseTextProps,
            text: `${team1Score} - ${team2Score}`,
            fill: scoreColor,
            fontSize: scoreFontSize,
            left: currentLeft,
            top: currentTop,
            scaleX: currentScaleX,
            scaleY: currentScaleY,
            name: 'score'
        });
    }

    // 确保所有文本对象在最上层
    bringTeamInfoToFront();
    canvas.renderAll();
}

// 添加队伍信息相关的事件监听
function addTeamInfoEventListeners() {
    // 字号更改事件
    document.getElementById('team1FontSize').addEventListener('change', updateTeamInfo);
    document.getElementById('team2FontSize').addEventListener('change', updateTeamInfo);
    document.getElementById('scoreFontSize').addEventListener('change', updateTeamInfo);

    // 文本输入事件
    document.getElementById('team1Name').addEventListener('input', updateTeamInfo);
    document.getElementById('team2Name').addEventListener('input', updateTeamInfo);
    document.getElementById('team1Score').addEventListener('input', updateTeamInfo);
    document.getElementById('team2Score').addEventListener('input', updateTeamInfo);

    // 颜色更改事件
    document.getElementById('team1Color').addEventListener('input', updateTeamInfo);
    document.getElementById('team2Color').addEventListener('input', updateTeamInfo);
    document.getElementById('scoreColor').addEventListener('input', updateTeamInfo);
}

// 处理队伍Logo
function handleTeamLogo(e, teamNumber) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        fabric.Image.fromURL(event.target.result, function(img) {
            const dimensions = ASPECT_RATIOS[document.getElementById('aspectRatio').value];
            const isVertical = dimensions.height > dimensions.width;
            
            // 计算缩放比例
            const logoSize = Math.min(dimensions.width, dimensions.height) * 0.15;
            const scale = Math.min(logoSize / img.width, logoSize / img.height);
            img.scale(scale);

            // 设置位置
            if (teamNumber === 1) {
                img.set({
                    left: dimensions.width * 0.25,
                    top: isVertical ? dimensions.height * 0.2 : dimensions.height * 0.25,
                    originX: 'center',
                    originY: 'center'
                });
                if (team1LogoObj) {
                    canvas.remove(team1LogoObj);
                }
                team1LogoObj = img;
            } else {
                img.set({
                    left: dimensions.width * 0.75,
                    top: isVertical ? dimensions.height * 0.2 : dimensions.height * 0.25,
                    originX: 'center',
                    originY: 'center'
                });
                if (team2LogoObj) {
                    canvas.remove(team2LogoObj);
                }
                team2LogoObj = img;
            }

            canvas.add(img);
            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
}

// 处理背景图片
function handleBackgroundImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        fabric.Image.fromURL(event.target.result, function(img) {
            // 移除旧的背景图
            if (currentBackground) {
                canvas.remove(currentBackground);
            }

            // 设置新背景图
            currentBackground = img;
            currentBackground.set({
                originX: 'center',
                originY: 'center',
                left: canvas.width / 2,
                top: canvas.height / 2,
                selectable: true,
                hasControls: true,
                hasBorders: true,
                moveable: true,
                lockRotation: true
            });

            // 适应画布大小
            fitBackgroundToCanvas();

            // 添加到画布并置于底层
            canvas.add(currentBackground);
            canvas.sendToBack(currentBackground);
            canvas.renderAll();

            // 将队伍信息移到最上层
            team1TextObj.bringToFront();
            team2TextObj.bringToFront();
            scoreTextObj.bringToFront();
        });
    };
    reader.readAsDataURL(file);
}

// 背景图适应画布
function fitBackgroundToCanvas() {
    if (!currentBackground) return;

    const canvasRatio = canvas.width / canvas.height;
    const imageRatio = currentBackground.width / currentBackground.height;
    let scale;

    if (canvasRatio > imageRatio) {
        // 画布更宽，适应高度
        scale = canvas.height / currentBackground.height;
    } else {
        // 画布更高，适应宽度
        scale = canvas.width / currentBackground.width;
    }

    currentBackground.scale(scale);
    currentBackground.center();
    canvas.renderAll();
}

// 背景图填充画布
function fillBackgroundToCanvas() {
    if (!currentBackground) return;

    const canvasRatio = canvas.width / canvas.height;
    const imageRatio = currentBackground.width / currentBackground.height;
    let scale;

    if (canvasRatio > imageRatio) {
        // 画布更宽，填充宽度
        scale = canvas.width / currentBackground.width;
    } else {
        // 画布更高，填充高度
        scale = canvas.height / currentBackground.height;
    }

    currentBackground.scale(scale);
    currentBackground.center();
    canvas.renderAll();
}

// 更新背景缩放
function updateBackgroundScale() {
    if (!currentBackground) return;

    const scale = document.getElementById('bgScale').value / 100;
    
    // 保存当前位置
    const left = currentBackground.left;
    const top = currentBackground.top;
    
    currentBackground.set({
        scaleX: currentBackground.scaleX * scale,
        scaleY: currentBackground.scaleY * scale,
        left: left,
        top: top
    });
    
    // 确保背景图保持在最底层
    canvas.sendToBack(currentBackground);
    bringTeamInfoToFront();
    canvas.renderAll();
    
    // 重置缩放滑块
    document.getElementById('bgScale').value = 100;
    document.getElementById('bgScaleValue').textContent = '100%';
}

// 添加文本
function addText() {
    const textInput = document.getElementById('customText').value;
    if (!textInput) return;

    const text = new fabric.IText(textInput, {
        left: canvas.width / 2,
        top: canvas.height / 2,
        fontSize: 40,
        fill: document.getElementById('textColor').value || '#ffffff',
        fontFamily: document.getElementById('fontFamily').value || 'Arial',
        originX: 'center',
        originY: 'center',
        textAlign: 'center'
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    // 清空输入框
    document.getElementById('customText').value = '';
}

// 添加图片
function addImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        fabric.Image.fromURL(event.target.result, function(img) {
            // 计算合适的缩放比例
            const maxSize = Math.min(canvas.width, canvas.height) / 4;
            const scale = maxSize / Math.max(img.width, img.height);
            
            img.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                scaleX: scale,
                scaleY: scale
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);

    // 清空文件输入
    e.target.value = '';
}

// 更新文本属性
function updateTextProperties() {
    const activeObject = canvas.getActiveObject();
    if (!activeObject || !activeObject.isType('i-text')) return;

    const fontSize = document.getElementById('fontSize').value;
    const textColor = document.getElementById('textColor').value;
    const fontFamily = document.getElementById('fontFamily').value;
    const textAlign = document.getElementById('textAlign').value;

    if (fontSize) activeObject.set('fontSize', parseInt(fontSize));
    if (textColor) activeObject.set('fill', textColor);
    if (fontFamily) activeObject.set('fontFamily', fontFamily);
    if (textAlign) activeObject.set('textAlign', textAlign);

    canvas.renderAll();
}

// 删除选中对象
function deleteSelectedObject() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.remove(activeObject);
        canvas.renderAll();
    }
}

// 导出图片
async function exportImage() {
    try {
        // 将画布转换为 base64 图片数据
        const imageData = canvas.toDataURL({
            format: 'png',
            quality: 1
        });

        // 发送到服务器
        const response = await fetch('/api/save-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageData })
        });

        const result = await response.json();

        if (result.success) {
            // 创建下载链接
            const downloadLink = document.createElement('a');
            downloadLink.href = result.imageUrl;
            downloadLink.download = 'match-report.png';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } else {
            console.error('Failed to save image:', result.message);
            alert('Failed to save image. Please try again.');
        }
    } catch (error) {
        console.error('Error saving canvas:', error);
        alert('Error saving image. Please try again.');
    }
}

// 初始化事件监听
function initializeEventListeners() {
    // 监听队伍信息变化
    document.getElementById('team1Name').addEventListener('input', updateTeamInfo);
    document.getElementById('team2Name').addEventListener('input', updateTeamInfo);
    document.getElementById('team1Score').addEventListener('input', updateTeamInfo);
    document.getElementById('team2Score').addEventListener('input', updateTeamInfo);
    document.getElementById('team1Color').addEventListener('input', updateTeamInfo);
    document.getElementById('team2Color').addEventListener('input', updateTeamInfo);
    document.getElementById('scoreColor').addEventListener('input', updateTeamInfo);

    // 监听Logo上传
    document.getElementById('team1Logo').addEventListener('change', (e) => handleTeamLogo(e, 1));
    document.getElementById('team2Logo').addEventListener('change', (e) => handleTeamLogo(e, 2));

    // 监听背景控制
    document.getElementById('backgroundImage').addEventListener('change', handleBackgroundImage);
    document.getElementById('bgScale').addEventListener('input', updateBackgroundScale);
    document.getElementById('fitToCanvas').addEventListener('click', fitBackgroundToCanvas);
    document.getElementById('fillCanvas').addEventListener('click', fillBackgroundToCanvas);

    // 监听画布比例变化
    document.getElementById('aspectRatio').addEventListener('change', () => {
        canvas.dispose();
        initializeCanvas();
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        const aspectRatio = document.getElementById('aspectRatio').value;
        const dimensions = ASPECT_RATIOS[aspectRatio];
        const container = document.querySelector('.canvas-wrapper');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const scaleX = (containerWidth * 0.9) / dimensions.width;
        const scaleY = (containerHeight * 0.9) / dimensions.height;
        currentScale = Math.min(scaleX, scaleY);

        const canvasContainer = document.querySelector('.canvas-container');
        canvasContainer.style.transform = `scale(${currentScale})`;
        canvasContainer.style.transformOrigin = 'center center';

        updatePreviewZoom();
    });

    // 文本相关
    document.getElementById('addTextBtn').addEventListener('click', addText);
    document.getElementById('fontSize').addEventListener('change', updateTextProperties);
    document.getElementById('textColor').addEventListener('input', updateTextProperties);
    document.getElementById('fontFamily').addEventListener('change', updateTextProperties);
    document.getElementById('textAlign').addEventListener('change', updateTextProperties);

    // 图片相关
    document.getElementById('addImage').addEventListener('change', addImage);

    // 删除对象
    document.getElementById('deleteBtn').addEventListener('click', deleteSelectedObject);
    // 也可以用Delete键删除
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            deleteSelectedObject();
        }
    });

    // 导出图片
    document.getElementById('exportBtn').addEventListener('click', exportImage);

    // 初始化预览功能
    initializePreview();
}

// 更新预览缩放
function updatePreviewZoom() {
    const zoomValue = document.getElementById('previewZoom').value;
    const scale = (zoomValue / 100) * currentScale;
    const container = document.querySelector('.canvas-container');
    
    container.style.transform = `scale(${scale})`;
    document.getElementById('zoomValue').textContent = `${zoomValue}%`;
}

// 重置预览缩放
function resetPreviewZoom() {
    const zoomSlider = document.getElementById('previewZoom');
    zoomSlider.value = 100;
    updatePreviewZoom();
}

// 初始化预览功能
function initializePreview() {
    const zoomSlider = document.getElementById('previewZoom');
    const resetZoomBtn = document.getElementById('resetZoom');
    const canvasContainer = document.querySelector('.canvas-container');

    // 更新缩放值显示
    function updateZoomValue() {
        const value = zoomSlider.value;
        zoomValue.textContent = `${value}%`;
        canvasContainer.style.transform = `scale(${value / 100})`;
    }

    // 监听滑块变化
    zoomSlider.addEventListener('input', updateZoomValue);

    // 重置缩放
    resetZoomBtn.addEventListener('click', () => {
        zoomSlider.value = 100;
        updateZoomValue();
    });

    // 初始化缩放值
    updateZoomValue();
}

// 在初始化函数中添加预览缩放初始化
function init() {
    initializeCanvas();
    initializeEventListeners();
    initPreviewZoom();
}

init();

// 设置背景图片
function setBackgroundImage(url) {
    fabric.Image.fromURL(url, function(img) {
        if (currentBackground) {
            canvas.remove(currentBackground);
        }

        // 获取画布尺寸
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // 计算图片缩放比例以适应画布
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const scale = Math.max(scaleX, scaleY);

        // 设置图片属性
        img.set({
            scaleX: scale,
            scaleY: scale,
            originX: 'center',
            originY: 'center',
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            selectable: true,
            moveable: true,
            lockRotation: true,
            hasControls: true,
            hasBorders: true,
            name: 'backgroundImage'
        });

        currentBackground = img;
        
        // 添加背景图并发送到最底层
        canvas.add(currentBackground);
        canvas.sendToBack(currentBackground);

        // 确保队伍信息在最上层
        bringTeamInfoToFront();

        // 添加事件监听
        currentBackground.on('moving', function() {
            canvas.sendToBack(currentBackground);
            bringTeamInfoToFront();
        });

        currentBackground.on('scaling', function() {
            canvas.sendToBack(currentBackground);
            bringTeamInfoToFront();
        });

        currentBackground.on('selected', function() {
            canvas.sendToBack(currentBackground);
            bringTeamInfoToFront();
        });

        canvas.renderAll();
    });
}

// 更新背景图片缩放
function updateBackgroundScale() {
    if (currentBackground) {
        const scale = document.getElementById('bgScale').value / 100;
        
        // 保存当前位置
        const left = currentBackground.left;
        const top = currentBackground.top;
        
        currentBackground.set({
            scaleX: currentBackground.scaleX * scale,
            scaleY: currentBackground.scaleY * scale,
            left: left,
            top: top
        });
        
        // 确保背景图保持在最底层
        canvas.sendToBack(currentBackground);
        bringTeamInfoToFront();
        canvas.renderAll();
        
        // 重置缩放滑块
        document.getElementById('bgScale').value = 100;
        document.getElementById('bgScaleValue').textContent = '100%';
    }
}

// 适应画布
function fitBackgroundToCanvas() {
    if (currentBackground) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // 计算适合的缩放比例
        const scaleX = canvasWidth / currentBackground.width;
        const scaleY = canvasHeight / currentBackground.height;
        const scale = Math.min(scaleX, scaleY);
        
        // 保持在当前位置进行缩放
        currentBackground.set({
            scaleX: scale,
            scaleY: scale,
            left: canvasWidth / 2,
            top: canvasHeight / 2
        });
        
        // 确保背景图保持在最底层
        canvas.sendToBack(currentBackground);
        bringTeamInfoToFront();
        canvas.renderAll();
    }
}

// 填充画布
function fillBackgroundToCanvas() {
    if (currentBackground) {
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // 计算填充的缩放比例
        const scaleX = canvasWidth / currentBackground.width;
        const scaleY = canvasHeight / currentBackground.height;
        const scale = Math.max(scaleX, scaleY);
        
        // 保持在当前位置进行缩放
        currentBackground.set({
            scaleX: scale,
            scaleY: scale,
            left: canvasWidth / 2,
            top: canvasHeight / 2
        });
        
        // 确保背景图保持在最底层
        canvas.sendToBack(currentBackground);
        bringTeamInfoToFront();
        canvas.renderAll();
    }
}

// 监听画布对象修改事件
canvas.on('object:modified', function(e) {
    const target = e.target;
    if (target === currentBackground) {
        // 如果修改的是背景图，确保它保持在最底层
        canvas.sendToBack(currentBackground);
    }
    // 将队伍信息移到最上层
    team1TextObj.bringToFront();
    team2TextObj.bringToFront();
    scoreTextObj.bringToFront();
});

// 监听画布对象移动事件
canvas.on('object:moving', function(e) {
    const target = e.target;
    if (target === currentBackground) {
        // 如果移动的是背景图，确保它保持在最底层
        canvas.sendToBack(currentBackground);
    }
});

// 监听画布对象缩放事件
canvas.on('object:scaling', function(e) {
    const target = e.target;
    if (target === currentBackground) {
        // 如果缩放的是背景图，确保它保持在最底层
        canvas.sendToBack(currentBackground);
    }
});

// 监听画布对象添加事件
canvas.on('object:added', function(e) {
    const target = e.target;
    if (target === currentBackground) {
        // 如果添加的是背景图，确保它在最底层
        canvas.sendToBack(currentBackground);
    } else {
        // 如果添加的不是背景图，确保它在背景图之上
        target.bringToFront();
    }
    // 将队伍信息移到最上层
    team1TextObj.bringToFront();
    team2TextObj.bringToFront();
    scoreTextObj.bringToFront();
});

// 监听画布选择事件
canvas.on('selection:created', function(e) {
    const target = e.target;
    if (target === currentBackground) {
        canvas.sendToBack(currentBackground);
        bringTeamInfoToFront();
    }
});

// 监听画布取消选择事件
canvas.on('selection:cleared', function(e) {
    if (currentBackground) {
        canvas.sendToBack(currentBackground);
    }
    bringTeamInfoToFront();
    canvas.renderAll();
});

// 添加对齐辅助线功能
function initAlignmentGuidelines() {
    let ctx = canvas.getSelectionContext();
    let aligningLineOffset = 5;
    let aligningLineMargin = 4;
    let aligningLineWidth = 1;
    let aligningLineColor = 'rgb(0,255,0)';
    let viewportTransform;
    let zoom = 1;

    function drawVerticalLine(coords) {
        drawLine(
            coords.x + 0.5,
            coords.y1 > coords.y2 ? coords.y2 : coords.y1,
            coords.x + 0.5,
            coords.y2 > coords.y1 ? coords.y2 : coords.y1);
    }

    function drawHorizontalLine(coords) {
        drawLine(
            coords.x1 > coords.x2 ? coords.x2 : coords.x1,
            coords.y + 0.5,
            coords.x2 > coords.x1 ? coords.x2 : coords.x1,
            coords.y + 0.5);
    }

    function drawLine(x1, y1, x2, y2) {
        ctx.save();
        ctx.lineWidth = aligningLineWidth;
        ctx.strokeStyle = aligningLineColor;
        ctx.beginPath();
        ctx.moveTo(x1 * zoom + viewportTransform[4], y1 * zoom + viewportTransform[5]);
        ctx.lineTo(x2 * zoom + viewportTransform[4], y2 * zoom + viewportTransform[5]);
        ctx.stroke();
        ctx.restore();
    }

    function isInRange(value1, value2) {
        value1 = Math.round(value1);
        value2 = Math.round(value2);
        for (let i = value1 - aligningLineMargin, len = value1 + aligningLineMargin; i <= len; i++) {
            if (i === value2) {
                return true;
            }
        }
        return false;
    }

    canvas.on('object:moving', function(e) {
        let activeObject = e.target;
        let canvasObjects = canvas.getObjects();
        let activeObjectCenter = activeObject.getCenterPoint();
        let activeObjectLeft = activeObjectCenter.x;
        let activeObjectTop = activeObjectCenter.y;
        let activeObjectBoundingRect = activeObject.getBoundingRect();
        let activeObjectHeight = activeObjectBoundingRect.height / viewportTransform[3];
        let activeObjectWidth = activeObjectBoundingRect.width / viewportTransform[0];
        let horizontalInTheRange = false;
        let verticalInTheRange = false;
        let transform = canvas._currentTransform;

        if (!transform) return;

        // 清除现有辅助线
        canvas.clearContext(canvas.contextTop);

        viewportTransform = canvas.viewportTransform;
        zoom = canvas.getZoom();

        for (let i = 0; i < canvasObjects.length; i++) {
            if (canvasObjects[i] === activeObject) continue;

            let objectCenter = canvasObjects[i].getCenterPoint();
            let objectLeft = objectCenter.x;
            let objectTop = objectCenter.y;
            let objectBoundingRect = canvasObjects[i].getBoundingRect();
            let objectHeight = objectBoundingRect.height / viewportTransform[3];
            let objectWidth = objectBoundingRect.width / viewportTransform[0];

            // 水平对齐
            if (isInRange(objectLeft, activeObjectLeft)) {
                verticalInTheRange = true;
                if (canvasObjects[i] !== activeObject) {
                    drawVerticalLine({
                        x: objectLeft,
                        y1: objectTop < activeObjectTop ? objectTop - objectHeight / 2 - aligningLineOffset : objectTop + objectHeight / 2 + aligningLineOffset,
                        y2: activeObjectTop > objectTop ? activeObjectTop + activeObjectHeight / 2 + aligningLineOffset : activeObjectTop - activeObjectHeight / 2 - aligningLineOffset
                    });
                    activeObject.set({
                        left: objectLeft - activeObjectWidth / 2
                    });
                }
            }

            // 垂直对齐
            if (isInRange(objectTop, activeObjectTop)) {
                horizontalInTheRange = true;
                if (canvasObjects[i] !== activeObject) {
                    drawHorizontalLine({
                        y: objectTop,
                        x1: objectLeft < activeObjectLeft ? objectLeft - objectWidth / 2 - aligningLineOffset : objectLeft + objectWidth / 2 + aligningLineOffset,
                        x2: activeObjectLeft > objectLeft ? activeObjectLeft + activeObjectWidth / 2 + aligningLineOffset : activeObjectLeft - activeObjectWidth / 2 - aligningLineOffset
                    });
                    activeObject.set({
                        top: objectTop - activeObjectHeight / 2
                    });
                }
            }
        }

        // 对齐画布中心线
        let canvasCenter = canvas.getCenter();
        if (isInRange(canvasCenter.left, activeObjectLeft)) {
            drawVerticalLine(canvasCenter.left);
            activeObject.set({
                left: canvasCenter.left - activeObjectWidth / 2
            });
        }
        if (isInRange(canvasCenter.top, activeObjectTop)) {
            drawHorizontalLine(canvasCenter.top);
            activeObject.set({
                top: canvasCenter.top - activeObjectHeight / 2
            });
        }
    });

    canvas.on('before:render', function() {
        canvas.clearContext(canvas.contextTop);
    });

    canvas.on('after:render', function() {
        if (canvas._currentTransform) {
            canvas.contextTop.save();
            canvas.contextTop.restore();
        }
    });
}

// 显示对齐辅助线
function showAlignmentLines(activeObj) {
    clearAlignmentLines();
    
    if (!activeObj) return;
    
    const activeObjCenter = activeObj.getCenterPoint();
    const activeObjBounds = activeObj.getBoundingRect();
    const canvasCenter = canvas.getCenter();
    
    // 显示中心对齐线的阈值
    const threshold = 10;
    
    // 垂直中心线
    if (Math.abs(activeObjCenter.x - canvasCenter.left) < threshold) {
        drawVerticalLine(canvasCenter.left);
    }
    
    // 水平中心线
    if (Math.abs(activeObjCenter.y - canvasCenter.top) < threshold) {
        drawHorizontalLine(canvasCenter.top);
    }
    
    // 与其他对象对齐
    canvas.getObjects().forEach(obj => {
        if (obj === activeObj || !obj.visible) return;
        
        const objCenter = obj.getCenterPoint();
        const objBounds = obj.getBoundingRect();
        
        // 垂直对齐
        if (Math.abs(activeObjCenter.x - objCenter.x) < threshold) {
            drawVerticalLine(objCenter.x);
        }
        
        // 水平对齐
        if (Math.abs(activeObjCenter.y - objCenter.y) < threshold) {
            drawHorizontalLine(objCenter.y);
        }
        
        // 左对齐
        if (Math.abs(activeObjBounds.left - objBounds.left) < threshold) {
            drawVerticalLine(objBounds.left);
        }
        
        // 右对齐
        if (Math.abs(activeObjBounds.left + activeObjBounds.width - 
            (objBounds.left + objBounds.width)) < threshold) {
            drawVerticalLine(objBounds.left + objBounds.width);
        }
        
        // 顶部对齐
        if (Math.abs(activeObjBounds.top - objBounds.top) < threshold) {
            drawHorizontalLine(objBounds.top);
        }
        
        // 底部对齐
        if (Math.abs(activeObjBounds.top + activeObjBounds.height - 
            (objBounds.top + objBounds.height)) < threshold) {
            drawHorizontalLine(objBounds.top + objBounds.height);
        }
    });
}

// 绘制垂直对齐线
function drawVerticalLine(x) {
    const line = new fabric.Line([x, 0, x, canvas.height], {
        stroke: '#2196F3',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        id: 'guideline'
    });
    canvas.add(line);
    canvas.renderAll();
}

// 绘制水平对齐线
function drawHorizontalLine(y) {
    const line = new fabric.Line([0, y, canvas.width, y], {
        stroke: '#2196F3',
        strokeWidth: 1,
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        id: 'guideline'
    });
    canvas.add(line);
    canvas.renderAll();
}

// 清除对齐辅助线
function clearAlignmentLines() {
    const guidelines = canvas.getObjects().filter(obj => obj.id === 'guideline');
    guidelines.forEach(guide => canvas.remove(guide));
    canvas.renderAll();
}

// 对象停止移动时清除辅助线
canvas.on('object:modified', function() {
    clearAlignmentLines();
});

// 初始化预览缩放控件
function initPreviewZoom() {
    const zoomSlider = document.getElementById('previewZoom');
    const zoomValue = document.getElementById('zoomValue');
    const resetZoomBtn = document.getElementById('resetZoom');
    const canvasContainer = document.querySelector('.canvas-container');

    // 更新缩放值显示
    function updateZoomValue() {
        const value = zoomSlider.value;
        zoomValue.textContent = `${value}%`;
        canvasContainer.style.transform = `scale(${value / 100})`;
    }

    // 监听滑块变化
    zoomSlider.addEventListener('input', updateZoomValue);

    // 重置缩放
    resetZoomBtn.addEventListener('click', () => {
        zoomSlider.value = 100;
        updateZoomValue();
    });

    // 初始化缩放值
    updateZoomValue();
}
