// 一建考试题目数据
// 数据来源于必考速成讲义PDF

const QUIZ_DATA = {
    "stats": {
        "total_questions": 298,
        "total_knowledge": 802,
        "by_category": {"法规": 155, "管理": 103, "精考法规": 43},
        "with_answer": 298,
        "without_answer": 0
    },
    "questions": [],
    "knowledge": [],
    "by_category": {"法规": [], "管理": [], "精考法规": []}
};

// 从JSON文件加载数据
async function loadQuizData() {
    try {
        const response = await fetch('quiz-data.json');
        const data = await response.json();
        QUIZ_DATA.questions = data.questions || [];
        QUIZ_DATA.knowledge = data.knowledge || [];
        QUIZ_DATA.by_category = data.by_category || {};
        QUIZ_DATA.stats = data.stats || QUIZ_DATA.stats;
        return true;
    } catch (e) {
        console.error('加载数据失败:', e);
        return false;
    }
}

// AI生成的题目解析（标注为AI生成）
const AI_EXPLANATIONS = {
    // 法规类题目解析模板
    "法规": {
        "single": (question, answer, options) => {
            const explanations = {
                "行政法": "行政法是调整行政主体与行政相对人之间关系的法律规范总称。常见的行政法包括《土地管理法》《城市房地产管理法》《行政处罚法》《行政复议法》《行政许可法》《环境影响评价法》《城乡规划法》等。",
                "法的效力": "法的效力层级遵循：宪法＞法律＞行政法规＞地方性法规＞本级/下级地方政府规章。部门规章与地方政府规章具有同等效力。",
                "物权": "物权是权利人依法对特定的物享有直接支配和排他的权利，包括所有权、用益物权和担保物权。",
                "合同": "合同是平等主体的自然人、法人、其他组织之间设立、变更、终止民事权利义务关系的协议。",
                "担保": "担保方式包括保证、抵押、质押、留置和定金。",
                "招标": "招标分为公开招标和邀请招标。国有资金占控股或主导地位的依法必须进行招标的项目，应当公开招标。",
                "安全生产": "生产经营单位的主要负责人对本单位安全生产工作全面负责。",
                "质量": "建设工程实行质量保修制度，保修期限自竣工验收合格之日起计算。",
                "劳动": "用人单位与劳动者建立劳动关系，应当订立书面劳动合同。",
            };

            // 根据题目内容匹配相关知识点
            for (let key in explanations) {
                if (question.includes(key)) {
                    return `${explanations[key]}\n\n本题正确答案为 ${answer}。`;
                }
            }

            return `本题考查相关法规知识。根据题目分析，正确答案为 ${answer}。建议结合教材相关章节深入理解该知识点。`;
        },
        "multiple": (question, answer, options) => {
            return `本题为多选题，正确答案为 ${answer}。\n\n多选题答题技巧：仔细阅读每个选项，只有全部选对才能得满分，少选每个选项得0.5分，选错不得分。`;
        }
    },

    // 管理类题目解析模板
    "管理": {
        "single": (question, answer, options) => {
            const explanations = {
                "项目": "建设工程项目是指为完成依法立项的新建、扩建、改建等各类工程而进行的、有起止日期的、达到规定要求的一组相互关联的受控活动组成的特定过程。",
                "组织": "项目组织结构模式包括职能组织结构、线性组织结构和矩阵组织结构。",
                "进度": "进度控制的主要工作环节包括进度目标的分析和论证、编制进度计划、定期跟踪进度计划的执行情况、采取纠偏措施等。",
                "成本": "施工成本管理应从工程投标报价开始，直至项目竣工结算完成为止，贯穿于项目实施的全过程。",
                "质量": "质量管理就是确定和建立质量方针、质量目标及职责，并在质量管理体系中通过质量策划、质量控制、质量保证和质量改进等手段来实施和实现全部质量管理职能的所有活动。",
                "安全": "安全生产管理的基本对象是企业的员工，涉及企业中的所有人员、设备设施、物料、环境、财务、信息等各个方面。",
            };

            for (let key in explanations) {
                if (question.includes(key)) {
                    return `${explanations[key]}\n\n本题正确答案为 ${answer}。`;
                }
            }

            return `本题考查项目管理相关知识。根据题目分析，正确答案为 ${answer}。`;
        },
        "multiple": (question, answer, options) => {
            return `本题为多选题，正确答案为 ${answer}。\n\n多选题需要仔细分析每个选项，确保理解知识点的全面性。`;
        }
    },

    "精考法规": {
        "single": (question, answer, options) => {
            return `本题为精考速通法规题目，正确答案为 ${answer}。\n\n精考速通题目通常考查重点法规条文，建议熟记相关法律条款。`;
        },
        "multiple": (question, answer, options) => {
            return `本题为精考速通多选题，正确答案为 ${answer}。`;
        }
    }
};

// 生成AI解析
function generateAIExplanation(question, category) {
    const cat = AI_EXPLANATIONS[category] || AI_EXPLANATIONS["法规"];
    const typeFn = cat[question.type] || cat["single"];

    let explanation = typeFn(question.question, question.answer, question.options);

    // 添加AI生成标注
    explanation += "\n\n" + "=".repeat(40) + "\n";
    explanation += "🤖 此解析由AI自动生成，仅供参考\n";
    explanation += "=".repeat(40);

    return explanation;
}
