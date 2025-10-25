// 主要DOM元素
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const progressCircle = document.querySelector('.progress-ring-circle');
const sessionStatusElement = document.getElementById('session-status');
const completedCountElement = document.getElementById('completed-count');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionBtns = document.querySelectorAll('.session-btn');
const autoStartBreakCheckbox = document.getElementById('auto-start-break');
const soundCheckbox = document.getElementById('sound');

// 状态变量
let timer;
let isRunning = false;
let totalSeconds = 25 * 60; // 默认25分钟
let originalTime = totalSeconds;
let completedPomodoros = 0;
let isBreakTime = false;
let breakTime = 5 * 60; // 默认5分钟休息

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    // 从localStorage加载完成的番茄数量
    const savedCount = localStorage.getItem('completedPomodoros');
    if (savedCount) {
        completedPomodoros = parseInt(savedCount);
        completedCountElement.textContent = completedPomodoros;
    }
    
    // 计算圆环周长并设置
    const radius = 115;
    const circumference = 2 * Math.PI * radius;
    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = circumference;
    
    // 更新显示时间
    updateDisplayTime(totalSeconds);
});

// 更新圆环进度
function updateProgress(percent) {
    const radius = 115;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
}

// 更新显示时间
function updateDisplayTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    minutesElement.textContent = minutes.toString().padStart(2, '0');
    secondsElement.textContent = remainingSeconds.toString().padStart(2, '0');
    
    // 更新进度环
    const percent = (seconds / originalTime) * 100;
    updateProgress(percent);
}

// 开始计时器
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    timer = setInterval(() => {
        if (totalSeconds <= 0) {
            clearInterval(timer);
            timerComplete();
            return;
        }
        
        totalSeconds--;
        updateDisplayTime(totalSeconds);
    }, 1000);
}

// 暂停计时器
function pauseTimer() {
    if (!isRunning) return;
    
    isRunning = false;
    clearInterval(timer);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// 重置计时器
function resetTimer() {
    pauseTimer();
    
    if (isBreakTime) {
        totalSeconds = breakTime;
        originalTime = breakTime;
    } else {
        totalSeconds = originalTime;
    }
    
    updateDisplayTime(totalSeconds);
}

// 计时器完成处理
function timerComplete() {
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    // 播放提示音
    if (soundCheckbox.checked) {
        playSound();
    }
    
    if (!isBreakTime) {
        // 番茄时间结束，开始休息
        completedPomodoros++;
        completedCountElement.textContent = completedPomodoros;
        localStorage.setItem('completedPomodoros', completedPomodoros.toString());
        
        if (autoStartBreakCheckbox.checked) {
            startBreak();
        } else {
            showNotification('番茄时间结束！准备休息一下吧！');
        }
    } else {
        // 休息时间结束，回到番茄时间
        if (autoStartBreakCheckbox.checked) {
            startPomodoro();
        } else {
            showNotification('休息结束！开始新的番茄时间！');
        }
    }
}

// 开始番茄时间
function startPomodoro() {
    isBreakTime = false;
    totalSeconds = originalTime;
    updateDisplayTime(totalSeconds);
    
    // 更新UI
    sessionStatusElement.textContent = '专注模式';
    sessionStatusElement.className = 'status-pomodoro';
    progressCircle.classList.remove('break');
    
    if (autoStartBreakCheckbox.checked) {
        startTimer();
    }
}

// 开始休息时间
function startBreak() {
    isBreakTime = true;
    totalSeconds = breakTime;
    originalTime = breakTime;
    updateDisplayTime(totalSeconds);
    
    // 更新UI
    sessionStatusElement.textContent = '休息模式';
    sessionStatusElement.className = 'status-break';
    progressCircle.classList.add('break');
    
    if (autoStartBreakCheckbox.checked) {
        startTimer();
    }
}

// 声音效果系统
const SoundSystem = {
    // 创建音频上下文（如果存在）
    _audioContext: null,
    
    // 初始化音频上下文
    _getContext: function() {
        if (!this._audioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            try {
                this._audioContext = new AudioContext();
            } catch (e) {
                console.warn('无法创建音频上下文:', e);
                return null;
            }
        }
        
        // 检查上下文是否被暂停（用户交互前）
        if (this._audioContext.state === 'suspended') {
            this._audioContext.resume();
        }
        
        return this._audioContext;
    },
    
    // 播放计时器完成声音
    playCompletionSound: function() {
        if (!soundCheckbox.checked) return;
        
        const audioCtx = this._getContext();
        if (!audioCtx) return;
        
        // 创建两个振荡器和增益节点，产生和弦效果
        const oscillator1 = audioCtx.createOscillator();
        const oscillator2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // 连接节点
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // 设置更和谐的音调（440Hz和554Hz，大三度关系）
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        
        // 创建一个愉快的完成音效
        oscillator1.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(554, audioCtx.currentTime + 0.2);
        oscillator1.frequency.setValueAtTime(554, audioCtx.currentTime + 0.4);
        
        oscillator2.frequency.setValueAtTime(554, audioCtx.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.2);
        oscillator2.frequency.setValueAtTime(660, audioCtx.currentTime + 0.4);
        
        // 设置柔和的音量
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
        
        // 播放声音
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(audioCtx.currentTime + 1.2);
        oscillator2.stop(audioCtx.currentTime + 1.2);
    },
    
    // 播放点击声音
    playClickSound: function() {
        if (!soundCheckbox.checked) return;
        
        const audioCtx = this._getContext();
        if (!audioCtx) return;
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // 更柔和的点击声
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    },
    
    // 播放添加/成功声音
    playAddSound: function() {
        if (!soundCheckbox.checked) return;
        
        const audioCtx = this._getContext();
        if (!audioCtx) return;
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // 更悦耳的上升音调
        oscillator.type = 'sine'; // 改用正弦波，更柔和
        oscillator.frequency.setValueAtTime(392, audioCtx.currentTime); // G4
        oscillator.frequency.linearRampToValueAtTime(523, audioCtx.currentTime + 0.3); // C5
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
    },
    
    // 播放删除/错误声音
    playDeleteSound: function() {
        if (!soundCheckbox.checked) return;
        
        const audioCtx = this._getContext();
        if (!audioCtx) return;
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // 更柔和的下降音调
        oscillator.type = 'sine'; // 改用正弦波
        oscillator.frequency.setValueAtTime(523, audioCtx.currentTime); // C5
        oscillator.frequency.linearRampToValueAtTime(392, audioCtx.currentTime + 0.3); // G4
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
    },
    
    // 播放状态切换声音
    playToggleSound: function() {
        if (!soundCheckbox.checked) return;
        
        const audioCtx = this._getContext();
        if (!audioCtx) return;
        
        // 使用两个振荡器创建和谐的声音
        const oscillator1 = audioCtx.createOscillator();
        const oscillator2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // 和谐的音符组合
        oscillator1.type = 'sine';
        oscillator2.type = 'sine';
        
        // 创建一个愉快的叮咚声
        oscillator1.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator2.frequency.setValueAtTime(554, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        
        oscillator1.start();
        oscillator2.start();
        oscillator1.stop(audioCtx.currentTime + 0.3);
        oscillator2.stop(audioCtx.currentTime + 0.3);
    }
};

// 向后兼容的播放提示音函数
function playSound() {
    SoundSystem.playCompletionSound();
}

// 显示通知
function showNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('番茄时钟', {
            body: message,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff6b6b"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
        });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

// 切换会话时长
function changeSessionTime(minutes) {
    // 只有在计时器未运行时才能更改
    if (!isRunning) {
        totalSeconds = minutes * 60;
        originalTime = totalSeconds;
        
        // 更新UI
        sessionBtns.forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.time) === minutes) {
                btn.classList.add('active');
            }
        });
        
        updateDisplayTime(totalSeconds);
    }
}

// 事件监听器
startBtn.addEventListener('click', () => {
    SoundSystem.playToggleSound();
    startTimer();
});

pauseBtn.addEventListener('click', () => {
    SoundSystem.playToggleSound();
    pauseTimer();
});

resetBtn.addEventListener('click', () => {
    SoundSystem.playToggleSound();
    resetTimer();
});

sessionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        SoundSystem.playToggleSound();
        const minutes = parseInt(btn.dataset.time);
        if (minutes === 5 || minutes === 10) {
            breakTime = minutes * 60;
            // 切换到休息模式并更新显示
            startBreak();
        } else {
            // 切换到番茄模式并更新显示
            isBreakTime = false;
            changeSessionTime(minutes);
        }
    });
});

// 请求通知权限
window.addEventListener('load', () => {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
    
    // 初始化导航功能
    initNavigation();
});

// 确保DOM加载完成后也初始化导航功能
window.addEventListener('DOMContentLoaded', () => {
    initNavigation();
});

// 为设置面板添加动画效果
const settingsPanel = document.querySelector('.settings-panel');
settingsPanel.addEventListener('mouseenter', () => {
    settingsPanel.style.transform = 'translateY(-5px)';
});

settingsPanel.addEventListener('mouseleave', () => {
    settingsPanel.style.transform = 'translateY(0)';
});

// 初始化导航功能
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // 移除所有活动状态
            document.querySelectorAll('.nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            document.querySelectorAll('.app-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // 添加活动状态
            item.classList.add('active');
            const targetSection = document.getElementById(item.dataset.target);
            targetSection.classList.add('active');
        });
    });
}

// 作业登记本功能实现
// 全局任务数据，以便在事件处理函数中访问
let tasks = [];
let currentFilter = 'all';
let selectedTasks = []; // 用于存储选中的任务ID

// 等待DOM加载完成后初始化任务功能
document.addEventListener('DOMContentLoaded', function() {
    const taskListElement = document.getElementById('task-list');
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    const totalTasksElement = document.getElementById('total-tasks');
    const completedTasksElement = document.getElementById('completed-tasks');

// 从localStorage加载任务
function loadTasks() {
    const savedTasks = localStorage.getItem('pomodoro-tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    renderTasks();
}

// 保存任务到localStorage
function saveTasks() {
    localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
}

// 添加新任务
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') return;
    
    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    taskInput.value = '';
    
    // 添加成功的视觉和音频反馈
    SoundSystem.playAddSound();
    addTaskBtn.classList.add('active');
    setTimeout(() => {
        addTaskBtn.classList.remove('active');
    }, 200);
}

// 在DOMContentLoaded外部定义这些函数，使其在全局作用域中可访问
// 批量删除选中的任务
function batchDeleteTasks() {
    if (selectedTasks.length === 0) return;
    
    // 确认对话框
    if (!confirm(`确定要删除选中的 ${selectedTasks.length} 个任务吗？`)) {
        return;
    }
    
    // 过滤掉选中的任务
    tasks = tasks.filter(task => !selectedTasks.includes(task.id));
    
    // 清空选中的任务列表
    selectedTasks = [];
    
    // 保存并重新渲染，添加删除音效
    SoundSystem.playDeleteSound();
    saveTasks();
    renderTasks();
    updateBatchDeleteButton();
}

// 更新批量删除按钮状态
function updateBatchDeleteButton() {
    const batchDeleteBtn = document.getElementById('batch-delete-btn');
    if (!batchDeleteBtn) return;
    
    const count = selectedTasks.length;
    batchDeleteBtn.innerHTML = `<i class="fa fa-trash"></i> 批量删除 (${count})`;
    batchDeleteBtn.disabled = count === 0;
}

// 切换任务选中状态
window.toggleTaskSelection = function(taskId) {
    const index = selectedTasks.indexOf(taskId);
    if (index > -1) {
        // 取消选中
        selectedTasks.splice(index, 1);
    } else {
        // 添加选中
        selectedTasks.push(taskId);
    }
    
    updateBatchDeleteButton();
    
    // 更新UI
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
        const checkboxElement = taskElement.querySelector('.task-select-checkbox');
        if (checkboxElement) {
            checkboxElement.classList.toggle('checked', selectedTasks.includes(taskId));
        }
    }
}

// 切换任务完成状态
window.toggleTaskCompletion = function(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        // 添加状态切换音效
        SoundSystem.playToggleSound();
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
};

// 删除任务
window.deleteTask = function(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
        // 添加删除音效
        SoundSystem.playDeleteSound();
        
        // 动画删除
        taskElement.style.opacity = '0';
        taskElement.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== taskId);
            
            // 如果删除的任务在选中列表中，也从选中列表中移除
            const index = selectedTasks.indexOf(taskId);
            if (index > -1) {
                selectedTasks.splice(index, 1);
                updateBatchDeleteButton();
            }
            
            saveTasks();
            renderTasks();
        }, 300);
    }
};

// 过滤任务
function filterTasks(filter) {
    currentFilter = filter;
    
    // 播放切换音效
    SoundSystem.playClickSound();
    
    // 更新过滤按钮状态
    filterButtons.forEach(button => {
        if (button.dataset.filter === filter) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    renderTasks();
}

// 渲染任务列表
function renderTasks() {
    // 清空任务列表
    const taskListElement = document.getElementById('task-list');
    taskListElement.innerHTML = '';
    
    // 根据当前过滤条件筛选任务
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(task => !task.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(task => task.completed);
    }
    
    // 如果没有任务，显示空状态
    if (filteredTasks.length === 0) {
        const emptyState = document.createElement('li');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
                <i class="fa fa-list-ul"></i>
                <p>${tasks.length === 0 ? '暂无任务，添加一个开始吧！' : '没有符合条件的任务'}</p>
            `;
        taskListElement.appendChild(emptyState);
    } else {
        // 创建任务元素
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('li');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskItem.dataset.taskId = task.id;
            
            // 检查任务是否被选中
            const isSelected = selectedTasks.includes(task.id);
            
            taskItem.innerHTML = `
                <div class="task-content">
                    <div class="task-select-checkbox task-checkbox ${isSelected ? 'checked' : ''}" onclick="toggleTaskSelection(${task.id})"></div>
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTaskCompletion(${task.id})"></div>
                    <span class="task-text">${task.text}</span>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn delete" onclick="deleteTask(${task.id})"><i class="fa fa-trash"></i></button>
                </div>
            `;
            
            taskListElement.appendChild(taskItem);
        });
    }
    
    // 更新任务统计
    updateTaskStats();
    // 更新批量删除按钮状态
    updateBatchDeleteButton();
}

// 更新任务统计
function updateTaskStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    
    const totalTasksElement = document.getElementById('total-tasks');
    const completedTasksElement = document.getElementById('completed-tasks');
    
    if (totalTasksElement && completedTasksElement) {
        totalTasksElement.textContent = total;
        completedTasksElement.textContent = completed;
    }
}

// 事件监听器
    addTaskBtn.addEventListener('click', addTask);

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterTasks(button.dataset.filter);
        });
    });
    
    // 批量删除按钮事件
    batchDeleteBtn.addEventListener('click', batchDeleteTasks);
    
    // 初始化加载任务
    loadTasks();
});

// 初始化导航功能
function initNavigation() {
    // 获取所有导航项（包括侧菜单和底部菜单）
    const navItems = document.querySelectorAll('.nav-item');
    
    // 为所有导航项添加点击事件
    navItems.forEach(item => {
        // 清除现有的点击事件（防止重复绑定）
        item.onclick = null;
        
        // 添加新的点击事件监听器
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // 播放导航点击音效
            SoundSystem.playClickSound();
            
            // 获取目标区块ID
            const targetId = item.dataset.target;
            
            // 更新所有导航项的活动状态（同步侧菜单和底部菜单）
            document.querySelectorAll('.nav-item').forEach(navItem => {
                if (navItem.dataset.target === targetId) {
                    navItem.classList.add('active');
                } else {
                    navItem.classList.remove('active');
                }
            });
            
            // 无论横屏还是竖屏，都只显示选中的区块
            document.querySelectorAll('.app-section').forEach(section => {
                section.classList.remove('active');
            });
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

// 页面加载完成后初始化导航
window.addEventListener('DOMContentLoaded', () => {
    // 检查是否为横屏模式
    function isLandscape() {
        return window.innerWidth > window.innerHeight && window.innerWidth >= 769;
    }
    
    const landscapeMode = isLandscape();
    
    // 先重置所有显示状态
    document.querySelectorAll('.app-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 无论横屏还是竖屏，都只显示当前激活的区块
    const activeNavItem = document.querySelector('.nav-item.active');
    if (activeNavItem) {
        const targetId = activeNavItem.dataset.target;
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.classList.add('active');
    }
    
    // 根据屏幕方向显示对应的导航栏
    if (landscapeMode) {
        // 横屏模式：显示侧菜单，隐藏底部菜单
        document.querySelector('.side-nav').style.display = 'flex';
        document.querySelector('.bottom-nav').style.display = 'none';
    } else {
        // 竖屏模式：隐藏侧菜单，显示底部菜单
        document.querySelector('.side-nav').style.display = 'none';
        document.querySelector('.bottom-nav').style.display = 'flex';
    }
    
    // 确保导航初始化正确执行
    setTimeout(() => {
        initNavigation();
    }, 100);
});

// 窗口大小改变时重新初始化导航
let resizeTimeout;
window.addEventListener('resize', () => {
    // 防抖处理，避免频繁更新
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // 检查是否为横屏模式
        function isLandscape() {
            return window.innerWidth > window.innerHeight && window.innerWidth >= 769;
        }
        
        const landscapeMode = isLandscape();
        
        // 先重置所有显示状态
        document.querySelectorAll('.app-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // 无论横屏还是竖屏，都只显示当前激活的区块
        const activeNavItem = document.querySelector('.nav-item.active');
        if (activeNavItem) {
            const targetId = activeNavItem.dataset.target;
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');
        }
        
        // 根据屏幕方向显示对应的导航栏
        if (landscapeMode) {
            // 横屏模式：显示侧菜单，隐藏底部菜单
            document.querySelector('.side-nav').style.display = 'flex';
            document.querySelector('.bottom-nav').style.display = 'none';
        } else {
            // 竖屏模式：隐藏侧菜单，显示底部菜单
            document.querySelector('.side-nav').style.display = 'none';
            document.querySelector('.bottom-nav').style.display = 'flex';
        }
        
        // 重新初始化导航
        initNavigation();
    }, 100);
});