const TREATMENT_TYPES = {
    braces: {
        name: '正畸治疗',
        emoji: '🦷',
        tasks: [
            {
                id: 1, title: '2小时内不进食', desc: '麻药未退前避免咬伤唇颊', timeOffset: 2, unit: '小时',
        },
            {
                id: 2, title: '24小时内不刷手术区', desc: '避免刺激伤口，其他牙齿正常刷', timeOffset: 24, unit: '小时',
            },
            {
                id: 3, title: '按时服用止痛药', desc: '如有疼痛，按医嘱服用', timeOffset: 6, unit: '小时',
            },
            {
                id: 4, title: '异常出血及时联系', desc: '持续出血请立即联系诊所', timeOffset: 1, unit: '小时', critical: true,
            },
        ],
    },
    extraction: {
        name: '拔牙',
        emoji: '🪥',
        tasks: [
            {
                id: 1, title: '咬紧止血棉30分钟', desc: '咬紧棉球帮助止血', timeOffset: 0.5, unit: '小时',
            },
            {
                id: 2, title: '2小时内不进食', desc: '麻药消退前避免进食', timeOffset: 2, unit: '小时',
            },
            {
                id: 3, title: '24小时内不漱口', desc: '避免冲掉血凝块', timeOffset: 24, unit: '小时',
            },
            {
                id: 4, title: '按时服用止痛药', desc: '疼痛时按医嘱服药', timeOffset: 6, unit: '小时',
            },
            {
                id: 5, title: '异常出血及时联系', desc: '持续出血请立即联系', timeOffset: 1, unit: '小时', critical: true,
            },
        ],
    },
    cleaning: {
        name: '洁牙',
        emoji: '✨',
        tasks: [
            {
                id: 1, title: '2小时内不进食', desc: '避免冷热刺激', timeOffset: 2, unit: '小时',
            },
            {
                id: 2, title: '24小时内避免染色食物', desc: '避免咖啡、茶、红酒等', timeOffset: 24, unit: '小时',
            },
            {
                id: 3, title: '使用抗敏感牙膏', desc: '如有酸痛可使用', timeOffset: 2, unit: '小时',
            },
            {
                id: 4, title: '持续酸痛及时联系', desc: '异常不适请联系', timeOffset: 24, unit: '小时', critical: true,
            },
        ],
    },
};

const FEEDBACK_OPTIONS = [
    { id: 'no_pain', emoji: '😊', label: '不疼' },
    { id: 'mild_pain', emoji: '🙂', label: '轻微疼' },
    { id: 'severe_pain', emoji: '😣', label: '明显疼' },
    { id: 'bleeding', emoji: '🩸', label: '持续出血' },
];

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

function formatTime(date) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getTimeRemaining(targetTime) {
    const now = new Date();
    const diff = targetTime - now;
    if (diff <= 0) return '已到时间';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}小时${minutes}分钟后`;
    return `${minutes}分钟后`;
}

function isAbnormalFeedback(feedback) {
    return feedback === 'severe_pain' || feedback === 'bleeding';
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function createCarePlan(treatmentType, patientName) {
    const treatment = TREATMENT_TYPES[treatmentType];
    const id = generateId();
    const startTime = new Date();
    
    const tasks = treatment.tasks.map(task => {
        const taskTime = new Date(startTime.getTime() + task.timeOffset * 60 * 60 * 1000);
        return {
            ...task,
            taskTime: taskTime.toISOString(),
            status: 'pending',
            completed: false,
            feedback: null,
            feedbackTime: null,
        };
    });
    
    const carePlan = {
        id,
        treatmentType,
        treatmentName: treatment.name,
        treatmentEmoji: treatment.emoji,
        patientName,
        startTime: startTime.toISOString(),
        tasks,
        createdAt: new Date().toISOString(),
    };
    
    const allPlans = getFromStorage('carePlans') || [];
    allPlans.push(carePlan);
    saveToStorage('carePlans', allPlans);
    
    return carePlan;
}

function getCarePlan(id) {
    const allPlans = getFromStorage('carePlans') || [];
    return allPlans.find(p => p.id === id);
}

function updateTaskStatus(carePlanId, taskId, feedback) {
    const allPlans = getFromStorage('carePlans') || [];
    const planIndex = allPlans.findIndex(p => p.id === carePlanId);
    if (planIndex === -1) return null;
    
    const plan = allPlans[planIndex];
    const taskIndex = plan.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;
    
    plan.tasks[taskIndex].completed = true;
    plan.tasks[taskIndex].status = 'completed';
    plan.tasks[taskIndex].feedback = feedback;
    plan.tasks[taskIndex].feedbackTime = new Date().toISOString();
    
    allPlans[planIndex] = plan;
    saveToStorage('carePlans', allPlans);
    
    saveFeedback(plan, plan.tasks[taskIndex]);
    
    return plan;
}

function saveFeedback(plan, task) {
    const feedbacks = getFromStorage('feedbacks') || [];
    const feedback = {
        id: generateId(),
        carePlanId: plan.id,
        patientName: plan.patientName,
        treatmentType: plan.treatmentType,
        treatmentName: plan.treatmentName,
        taskId: task.id,
        taskTitle: task.title,
        feedback: task.feedback,
        isAbnormal: isAbnormalFeedback(task.feedback),
        feedbackTime: task.feedbackTime,
        reviewed: false,
    };
    feedbacks.unshift(feedback);
    saveToStorage('feedbacks', feedbacks);
}

function getAllFeedbacks() {
    return getFromStorage('feedbacks') || [];
}

function getCurrentTask(plan) {
    const now = new Date();
    for (const task of plan.tasks) {
        if (!task.completed) {
            const taskTime = new Date(task.taskTime);
            if (taskTime <= now) {
                return task;
            }
        }
    }
    return null;
}

function getTaskStatus(task, now = new Date()) {
    if (task.completed) return 'completed';
    const taskTime = new Date(task.taskTime);
    if (taskTime <= now) return 'current';
    return 'pending';
}

function getProgress(plan) {
    const completed = plan.tasks.filter(t => t.completed).length;
    const total = plan.tasks.length;
    return { completed, total, percentage: Math.round((completed / total) * 100) };
}

function getNextTip(plan) {
    const incompleteTasks = plan.tasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) {
        return { emoji: '🎉', title: '太棒了！', desc: '你已完成所有护理任务，继续保持良好的口腔卫生！' };
    }
    
    const nextTask = incompleteTasks[0];
    const tips = {
        braces: [
            { emoji: '💧', title: '小提示', desc: '避免用前牙啃咬硬物，如苹果、骨头等。' },
            { emoji: '🪥', title: '保持清洁', desc: '使用牙线和间隙刷清洁矫治器缝隙。' },
            { emoji: '🥗', title: '饮食注意', desc: '避免粘性食物，如口香糖、年糕等。' },
        ],
        extraction: [
            { emoji: '🧊', title: '冰敷消肿', desc: '术后48小时内可冰敷减轻肿胀。' },
            { emoji: '🍲', title: '温凉饮食', desc: '近期避免过热食物，建议温凉软食。' },
            { emoji: '😴', title: '充足休息', desc: '避免剧烈运动，保证充足睡眠。' },
        ],
        cleaning: [
            { emoji: '🚭', title: '避免染色', desc: '近期避免咖啡、茶、红酒等易染色食物。' },
            { emoji: '🪥', title: '正确刷牙', desc: '使用软毛牙刷，采用巴氏刷牙法。' },
            { emoji: '💧', title: '定期检查', desc: '建议每半年进行一次口腔检查。' },
        ],
    };
    
    const treatmentTips = tips[plan.treatmentType] || tips.braces;
    return treatmentTips[Math.floor(Math.random() * treatmentTips.length)];
}

function showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
    }
}

function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function checkTaskReminders(plan) {
    const now = new Date();
    const currentTask = getCurrentTask(plan);
    
    if (currentTask) {
        const taskTime = new Date(currentTask.taskTime);
        const timeDiff = taskTime - now;
        
        if (timeDiff > 0 && timeDiff < 5 * 60 * 1000) {
            showNotification(
                '⏰ 护理提醒',
                `${currentTask.title} - 记得完成后打卡哦！`
            );
        }
    }
}

function copyToClipboard(text) {
    return navigator.clipboard.writeText(text);
}

function getBaseUrl() {
    return window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
}

function generatePatientLink(planId) {
    return `${getBaseUrl()}patient.html?id=${planId}`;
}

function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

function markFeedbackAsReviewed(feedbackId) {
    const feedbacks = getFromStorage('feedbacks') || [];
    const index = feedbacks.findIndex(f => f.id === feedbackId);
    if (index !== -1) {
        feedbacks[index].reviewed = true;
        saveToStorage('feedbacks', feedbacks);
    }
    return feedbacks;
}

function getUnreviewedCount() {
    const feedbacks = getFromStorage('feedbacks') || [];
    return feedbacks.filter(f => !f.reviewed).length;
}

function getAbnormalCount() {
    const feedbacks = getFromStorage('feedbacks') || [];
    return feedbacks.filter(f => f.isAbnormal && !f.reviewed).length;
}

function initDemoData() {
    if (!getFromStorage('carePlans')) {
        const demoPlan = createCarePlan('braces', '演示用户');
        setTimeout(() => {
            updateTaskStatus(demoPlan.id, 1, 'no_pain');
        }, 100);
    }
}
