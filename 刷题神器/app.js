class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestions = [];
        this.currentIndex = 0;
        this.currentCategory = 'all';
        this.userAnswers = {};
        this.wrongQuestions = [];
        this.knowledgeDB = null;  // 知识库数据
        this.stats = {
            totalAnswered: 0,
            correctCount: 0,
            wrongCount: 0,
            categoryStats: {}
        };
        this.recentAnswers = [];

        this.init();
    }

    async init() {
        this.loadQuestions();
        this.loadKnowledgeDB();  // 加载知识库
        this.loadLocalData();
        this.bindEvents();
        this.updateHomeStats();
        this.updateNavStats();
    }

    loadQuestions() {
        if (typeof allQuestions !== 'undefined' && allQuestions.length > 0) {
            this.questions = allQuestions;
        } else {
            this.showToast('题目数据加载失败，请刷新页面');
        }
    }

    // 加载知识库
    loadKnowledgeDB() {
        if (typeof knowledgeDB !== 'undefined') {
            this.knowledgeDB = knowledgeDB;
            console.log(`✅ 知识库加载成功：法规${this.knowledgeDB.法规?.length || 0}条，管理${this.knowledgeDB.管理?.length || 0}条，精考法规${this.knowledgeDB.精考法规?.length || 0}条`);
        } else {
            console.warn('知识库加载失败，将使用AI生成解析');
            this.knowledgeDB = null;
        }
    }

    loadLocalData() {
        try {
            const saved = localStorage.getItem('quizAppData');
            if (saved) {
                const data = JSON.parse(saved);
                this.userAnswers = data.userAnswers || {};
                this.wrongQuestions = data.wrongQuestions || [];
                this.stats = data.stats || this.stats;
                this.recentAnswers = data.recentAnswers || [];
            }
        } catch (e) {
            console.error('加载本地数据失败:', e);
        }
    }

    saveLocalData() {
        try {
            const data = {
                userAnswers: this.userAnswers,
                wrongQuestions: this.wrongQuestions,
                stats: this.stats,
                recentAnswers: this.recentAnswers
            };
            localStorage.setItem('quizAppData', JSON.stringify(data));
        } catch (e) {
            console.error('保存本地数据失败:', e);
        }
    }

    bindEvents() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = e.target.dataset.page;
                this.switchPage(page);
            });
        });
    }

    switchPage(page) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === page);
        });

        document.querySelectorAll('.page').forEach(p => {
            p.classList.toggle('active', p.id === `${page}-page`);
        });

        if (page === 'wrong') {
            this.renderWrongQuestions();
        } else if (page === 'stats') {
            this.renderStats();
        }
    }

    updateHomeStats() {
        document.getElementById('home-total').textContent = this.questions.length;
        document.getElementById('home-answered').textContent = this.stats.totalAnswered;
        const accuracy = this.stats.totalAnswered > 0 
            ? Math.round((this.stats.correctCount / this.stats.totalAnswered) * 100) 
            : 0;
        document.getElementById('home-accuracy').textContent = `${accuracy}%`;
        document.getElementById('home-wrong').textContent = this.wrongQuestions.length;

        const categories = ['法规', '管理', '精考法规', 'all'];
        categories.forEach(cat => {
            const count = cat === 'all' 
                ? this.questions.length 
                : this.questions.filter(q => q.source && q.source.includes(cat)).length;
            const el = document.getElementById(`count-${cat}`);
            if (el) el.textContent = `${count} 题`;
        });
    }

    updateNavStats() {
        document.getElementById('nav-answered').textContent = this.stats.totalAnswered;
        const accuracy = this.stats.totalAnswered > 0 
            ? Math.round((this.stats.correctCount / this.stats.totalAnswered) * 100) 
            : 0;
        document.getElementById('nav-accuracy').textContent = `${accuracy}%`;
    }

    selectCategory(category) {
        this.currentCategory = category;

        if (category === 'all') {
            this.currentQuestions = [...this.questions];
        } else {
            this.currentQuestions = this.questions.filter(q => 
                q.source && q.source.includes(category)
            );
        }

        this.currentQuestions.sort(() => Math.random() - 0.5);
        this.currentIndex = 0;

        this.switchPage('quiz');
        this.renderQuestion();
    }

    startQuickQuiz() {
        this.selectCategory('all');
    }

    startWrongQuiz() {
        if (this.wrongQuestions.length === 0) {
            this.showToast('暂无错题，先去刷题吧！');
            return;
        }

        this.currentQuestions = this.wrongQuestions
            .map(id => this.questions.find(q => q.id === id))
            .filter(q => q);

        this.currentCategory = '错题';
        this.currentIndex = 0;
        this.switchPage('quiz');
        this.renderQuestion();
    }

    renderQuestion() {
        if (this.currentQuestions.length === 0) {
            document.getElementById('question-text').textContent = '暂无题目';
            return;
        }

        const question = this.currentQuestions[this.currentIndex];

        document.getElementById('current-num').textContent = this.currentIndex + 1;
        document.getElementById('total-num').textContent = this.currentQuestions.length;
        document.getElementById('quiz-category').textContent = 
            this.currentCategory === 'all' ? '全部题目' : this.currentCategory;

        const typeText = question.type === 'multiple' ? '多选题' : '单选题';
        document.getElementById('question-type').textContent = typeText;
        document.getElementById('question-text').textContent = question.question;

        const optionsList = document.getElementById('options-list');
        optionsList.innerHTML = '';

        const optionLabels = ['A', 'B', 'C', 'D', 'E'];
        optionLabels.forEach(label => {
            if (question.options[label]) {
                const optionItem = document.createElement('div');
                optionItem.className = 'option-item';
                optionItem.dataset.value = label;
                optionItem.innerHTML = `
                    <div class="option-label">${label}</div>
                    <div class="option-text">${question.options[label]}</div>
                `;
                optionItem.addEventListener('click', () => this.selectOption(label));
                optionsList.appendChild(optionItem);
            }
        });

        document.getElementById('answer-section').style.display = 'none';
        document.getElementById('submit-btn').textContent = '提交答案';
        document.getElementById('submit-btn').disabled = false;

        const saved = this.userAnswers[question.id];
        if (saved && !saved.answered) {
            saved.selected.forEach(label => {
                const item = optionsList.querySelector(`[data-value="${label}"]`);
                if (item) item.classList.add('selected');
            });
        }

        this.updateButtonStates();
    }

    selectOption(label) {
        const question = this.currentQuestions[this.currentIndex];
        const optionItems = document.querySelectorAll('.option-item');

        if (question.type === 'multiple') {
            const item = document.querySelector(`.option-item[data-value="${label}"]`);
            item.classList.toggle('selected');
        } else {
            optionItems.forEach(item => item.classList.remove('selected'));
            document.querySelector(`.option-item[data-value="${label}"]`).classList.add('selected');
        }
    }

    // 根据题目内容匹配知识库
    matchKnowledge(questionText, categoryName) {
        if (!this.knowledgeDB) return null;
        
        const categoryKey = this.getCategoryKey(categoryName);
        const knowledgeList = this.knowledgeDB[categoryKey];
        if (!knowledgeList || knowledgeList.length === 0) return null;
        
        // 提取题目中的关键词（去除标点，按词分割）
        const cleanText = questionText.replace(/[，,。？?！!；;：:、]/g, ' ');
        const keywords = cleanText.split(/\s+/).filter(k => k.length >= 2);
        
        let bestMatch = null;
        let maxScore = 0;
        
        for (const item of knowledgeList) {
            let score = 0;
            for (const kw of keywords) {
                if (item.keywords.some(k => k === kw || kw.includes(k) || k.includes(kw))) {
                    score++;
                }
                // 检查标题匹配
                if (item.title.includes(kw) || kw.includes(item.title.substring(0, 2))) {
                    score += 2;
                }
            }
            if (score > maxScore && score > 0) {
                maxScore = score;
                bestMatch = item;
            }
        }
        
        return bestMatch;
    }
    
    getCategoryKey(categoryName) {
        if (categoryName.includes('法规')) return '法规';
        if (categoryName.includes('管理')) return '管理';
        if (categoryName.includes('精考')) return '精考法规';
        return '法规';
    }

    // 生成解析（优先知识库，兜底AI）
    generateExplanation(question) {
        // 确定题目分类
        let category = '法规';
        if (question.source && question.source.includes('管理')) category = '管理';
        else if (question.source && question.source.includes('精考')) category = '精考法规';
        
        // 1. 优先从知识库匹配
        const knowledge = this.matchKnowledge(question.question, category);
        
        if (knowledge) {
            // 知识库匹配成功，显示讲义来源
            return `📚 【知识点：${knowledge.title}】\n\n${knowledge.content}\n\n────────────────\n✅ 正确答案：${question.answer}\n\n📖 来源：必考速成讲义（知识库）`;
        }
        
        // 2. 知识库未匹配，使用AI生成解析
        return this.generateAIExplanation(question, category);
    }
    
    // AI生成解析（兜底方案）
    generateAIExplanation(question, category) {
        const explanations = {
            "法规": {
                "single": (q, a) => {
                    const templates = [
                        `本题考查建设工程法规相关知识。根据《民法典》及相关法律法规，正确答案为 ${a}。建议结合教材深入理解相关法律条文。`,
                        `这是法规科目中的重要考点，正确答案是 ${a}。学习时要注意区分相似概念，多做真题巩固记忆。`,
                        `${category}科目高频考点，正确答案为 ${a}。此类题目常考查法律条文的理解与应用。`
                    ];
                    return templates[Math.floor(Math.random() * templates.length)];
                },
                "multiple": (q, a) => {
                    return `本题为多选题，正确答案为 ${a}。\n\n💡 多选题答题技巧：仔细阅读每个选项，只有全部选对才能得满分，少选每个选项得0.5分，选错不得分。`
                }
            },
            "管理": {
                "single": (q, a) => {
                    const templates = [
                        `本题考查项目管理相关知识。根据《建设工程项目管理规范》，正确答案为 ${a}。`,
                        `这是管理科目中的重要考点，正确答案是 ${a}。建议掌握相关管理流程和方法。`,
                        `项目管理高频考点，正确答案为 ${a}。建议结合案例理解管理原理。`
                    ];
                    return templates[Math.floor(Math.random() * templates.length)];
                },
                "multiple": (q, a) => {
                    return `本题为多选题，正确答案为 ${a}。\n\n💡 多选题需要仔细分析每个选项，确保理解知识点的全面性。`
                }
            },
            "精考法规": {
                "single": (q, a) => {
                    return `本题为精考速通法规题目，正确答案为 ${a}。\n\n精考速通题目通常考查重点法规条文，建议熟记相关法律条款和安全责任制度。`;
                },
                "multiple": (q, a) => {
                    return `本题为精考速通多选题，正确答案为 ${a}。\n\n精考速通题目侧重考查安全责任、事故处理等核心内容。`;
                }
            }
        };
        
        const catExp = explanations[category] || explanations["法规"];
        const typeFn = catExp[question.type] || catExp["single"];
        let explanation = typeFn(question.question, question.answer);
        
        // 添加AI生成标注
        explanation += "\n\n" + "=".repeat(40) + "\n";
        explanation += "🤖 此解析由AI自动生成，仅供参考学习使用\n";
        explanation += "=".repeat(40);
        
        return explanation;
    }

    submitAnswer() {
        const question = this.currentQuestions[this.currentIndex];
        const selected = Array.from(document.querySelectorAll('.option-item.selected'))
            .map(item => item.dataset.value)
            .sort()
            .join('');

        if (!selected) {
            this.showToast('请选择答案！');
            return;
        }

        const correct = selected === question.answer;

        this.userAnswers[question.id] = {
            selected: selected.split(''),
            correct: correct,
            answered: true,
            timestamp: Date.now()
        };

        this.stats.totalAnswered++;
        if (correct) {
            this.stats.correctCount++;
            this.wrongQuestions = this.wrongQuestions.filter(id => id !== question.id);
        } else {
            this.stats.wrongCount++;
            if (!this.wrongQuestions.includes(question.id)) {
                this.wrongQuestions.push(question.id);
            }
        }

        this.recentAnswers.unshift({
            questionId: question.id,
            questionText: question.question.substring(0, 50) + '...',
            source: question.source,
            correct: correct,
            timestamp: Date.now()
        });
        if (this.recentAnswers.length > 10) {
            this.recentAnswers.pop();
        }

        this.saveLocalData();
        this.updateNavStats();

        this.showAnswerResult(correct, selected, question);

        const autoNext = document.getElementById('auto-next').checked;
        if (autoNext && this.currentIndex < this.currentQuestions.length - 1) {
            setTimeout(() => this.nextQuestion(), 2000);
        }
    }

    showAnswerResult(correct, userAnswer, question) {
        const answerSection = document.getElementById('answer-section');
        answerSection.style.display = 'block';

        const resultDiv = document.getElementById('answer-result');
        resultDiv.className = `answer-result ${correct ? 'correct' : 'wrong'}`;
        resultDiv.innerHTML = correct ? '✅ 回答正确！' : '❌ 回答错误！';

        document.getElementById('correct-answer').textContent = question.answer;
        document.getElementById('user-answer').textContent = userAnswer || '未作答';
        document.getElementById('user-answer').style.color = correct ? 'var(--success-color)' : 'var(--error-color)';

        document.querySelectorAll('.option-item').forEach(item => {
            const value = item.dataset.value;
            if (question.answer.includes(value)) {
                item.classList.add('correct');
            } else if (userAnswer.includes(value) && !correct) {
                item.classList.add('wrong');
            }
        });

        // 使用新的解析方法（知识库优先 + AI兜底）
        const explanation = this.generateExplanation(question);
        document.getElementById('explanation-text').innerHTML = explanation.replace(/\n/g, '<br>');
        document.getElementById('question-source').textContent = 
            `来源: ${question.source} | 类型: ${question.type === 'multiple' ? '多选题' : '单选题'}`;

        document.getElementById('submit-btn').textContent = '已提交';
        document.getElementById('submit-btn').disabled = true;

        this.updateButtonStates();
    }

    updateButtonStates() {
        document.getElementById('prev-btn').disabled = this.currentIndex === 0;
        document.getElementById('next-btn').disabled = this.currentIndex >= this.currentQuestions.length - 1;
    }

    prevQuestion() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderQuestion();
        }
    }

    nextQuestion() {
        if (this.currentIndex < this.currentQuestions.length - 1) {
            this.currentIndex++;
            this.renderQuestion();
        }
    }

    goHome() {
        this.switchPage('home');
        this.updateHomeStats();
    }

    renderWrongQuestions() {
        const list = document.getElementById('wrong-list');
        list.innerHTML = '';

        if (this.wrongQuestions.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 60px; color: var(--text-secondary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                    <div>太棒了！暂无错题</div>
                    <div style="font-size: 14px; margin-top: 8px;">继续保持，加油！</div>
                </div>
            `;
            return;
        }

        this.wrongQuestions.forEach(id => {
            const question = this.questions.find(q => q.id === id);
            if (!question) return;

            const item = document.createElement('div');
            item.className = 'wrong-item';
            item.onclick = () => {
                this.currentQuestions = [question];
                this.currentCategory = '错题';
                this.currentIndex = 0;
                this.switchPage('quiz');
                this.renderQuestion();
            };

            item.innerHTML = `
                <div class="wrong-question">${question.question}</div>
                <div class="wrong-meta">
                    <span>来源: ${question.source}</span>
                    <span>类型: ${question.type === 'multiple' ? '多选' : '单选'}</span>
                    <span>正确答案: ${question.answer}</span>
                </div>
            `;

            list.appendChild(item);
        });
    }

    clearWrongQuestions() {
        if (confirm('确定要清空所有错题吗？')) {
            this.wrongQuestions = [];
            this.saveLocalData();
            this.updateHomeStats();
            this.renderWrongQuestions();
            this.showToast('错题已清空');
        }
    }

    renderStats() {
        const progress = this.questions.length > 0 
            ? Math.round((this.stats.totalAnswered / this.questions.length) * 100) 
            : 0;

        document.getElementById('progress-percent').textContent = `${progress}%`;
        const circle = document.getElementById('progress-circle');
        const circumference = 2 * Math.PI * 65;
        const offset = circumference - (progress / 100) * circumference;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;

        const accuracy = this.stats.totalAnswered > 0 
            ? Math.round((this.stats.correctCount / this.stats.totalAnswered) * 100) 
            : 0;
        document.getElementById('stats-accuracy').textContent = `${accuracy}%`;
        document.getElementById('accuracy-fill').style.width = `${accuracy}%`;

        const categoryStats = document.getElementById('category-stats');
        categoryStats.innerHTML = '';

        const categories = ['法规', '管理', '精考法规'];
        categories.forEach(cat => {
            const catQuestions = this.questions.filter(q => q.source && q.source.includes(cat));
            const catAnswered = catQuestions.filter(q => this.userAnswers[q.id]).length;
            const catCorrect = catQuestions.filter(q => {
                const ans = this.userAnswers[q.id];
                return ans && ans.correct;
            }).length;
            const catAccuracy = catAnswered > 0 ? Math.round((catCorrect / catAnswered) * 100) : 0;

            const item = document.createElement('div');
            item.className = 'category-stat-item';
            item.innerHTML = `
                <div class="category-stat-name">${cat}</div>
                <div class="category-stat-value">${catAccuracy}%</div>
                <div class="category-stat-detail">${catCorrect}/${catAnswered} 正确</div>
            `;
            categoryStats.appendChild(item);
        });

        const recentList = document.getElementById('recent-list');
        recentList.innerHTML = '';

        if (this.recentAnswers.length === 0) {
            recentList.innerHTML = '<div style="text-align: center; color: var(--text-secondary);">暂无练习记录</div>';
        } else {
            this.recentAnswers.forEach(answer => {
                const item = document.createElement('div');
                item.className = 'recent-item';

                const date = new Date(answer.timestamp);
                const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

                item.innerHTML = `
                    <div class="recent-info">
                        <div class="recent-title">${answer.questionText}</div>
                        <div class="recent-time">${timeStr} · ${answer.source}</div>
                    </div>
                    <div class="recent-result ${answer.correct ? 'correct' : 'wrong'}">
                        ${answer.correct ? '✓ 正确' : '✗ 错误'}
                    </div>
                `;

                recentList.appendChild(item);
            });
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new QuizApp();
});