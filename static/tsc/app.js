// 存储提示词数据
let prompts = [];
let categories = [];

// DOM元素
const categoryBar = document.getElementById('category-bar');
const promptGrid = document.getElementById('prompt-grid');
const closeButtons = document.querySelectorAll('.close-btn');

// 初始化页面
async function init() {
    await loadPromptsFromJson();
    renderCategories();
    renderPrompts();
    setupEventListeners();
}

// 从JSON文件加载提示词数据
async function loadPromptsFromJson() {
    try {
        // 动态加载所有提示词文件
        prompts = [];
        categories = [];
        
        // 从1.json开始尝试加载，直到遇到404错误
        for (let i = 1; i <= 100; i++) {
            try {
                const response = await fetch(`prompts/${i}.json`);
                if (!response.ok) {
                    // 如果文件不存在（404），说明已经到达末尾
                    if (response.status === 404) {
                        break;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const promptData = await response.json();
                prompts.push(promptData);
                // 收集不重复的分类
                if (promptData.category && !categories.includes(promptData.category)) {
                    categories.push(promptData.category);
                }
            } catch (error) {
                if (error.message.includes('404')) {
                    break;
                }
                console.error(`加载提示词${i}.json失败:`, error);
            }
        }
    } catch (error) {
        console.error('加载提示词数据失败:', error);
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 为"全部"按钮添加事件监听器
    const allButton = document.querySelector('.category-btn[data-category="all"]');
    if (allButton) {
        allButton.addEventListener('click', () => {
            filterPromptsByCategory('all');
            // 更新活跃状态
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            allButton.classList.add('active');
        });
    }
}

// 渲染分类按钮
function renderCategories() {
    // 清空现有分类按钮，但保留"全部"按钮
    while (categoryBar.children.length > 1) {
        categoryBar.removeChild(categoryBar.children[1]);
    }
    
    // 添加所有分类
    categories.forEach(category => {
        // 添加到分类栏
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.setAttribute('data-category', category);
        btn.textContent = category;
        btn.addEventListener('click', () => {
            filterPromptsByCategory(category);
            // 更新活跃状态
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        
        categoryBar.appendChild(btn);
    });
}

// 渲染提示词卡片
function renderPrompts(filteredPrompts = null) {
    promptGrid.innerHTML = '';
    
    const promptsToRender = filteredPrompts || prompts;
    
    promptsToRender.forEach(prompt => {
        const card = document.createElement('div');
        card.className = 'prompt-card';
        
        const header = document.createElement('div');
        header.className = 'card-header';
        
        const title = document.createElement('h3');
        title.className = 'card-title';
        title.textContent = prompt.title;
        
        const category = document.createElement('span');
        category.className = 'card-category';
        category.textContent = prompt.category;
        
        header.appendChild(title);
        header.appendChild(category);
        
        const body = document.createElement('div');
        body.className = 'card-body';
        
        const description = document.createElement('p');
        description.className = 'card-description';
        description.textContent = prompt.description;
        
        const content = document.createElement('div');
        content.className = 'prompt-content';
        content.textContent = prompt.content;
        
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.innerHTML = '复制';
        copyBtn.addEventListener('click', () => copyPrompt(prompt.content));
        
        body.appendChild(description);
        body.appendChild(content);
        body.appendChild(actions);
        actions.appendChild(copyBtn);
        
        card.appendChild(header);
        card.appendChild(body);
        
        promptGrid.appendChild(card);
    });
}

// 按分类筛选提示词
function filterPromptsByCategory(category) {
    if (category === 'all') {
        renderPrompts();
        return;
    }
    
    const filtered = prompts.filter(prompt => prompt.category === category);
    renderPrompts(filtered);
}

// 复制提示词到剪贴板
function copyPrompt(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('提示词已复制到剪贴板');
    });
}

// 显示提示消息
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = 'var(--success-color)';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '4px';
    toast.style.boxShadow = 'var(--shadow)';
    toast.style.zIndex = '2000';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 2000);
}

// 初始化页面
init();