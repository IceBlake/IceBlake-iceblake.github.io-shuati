#!/usr/bin/env python3
"""
创建干净的题目数据文件
"""
import json
import re

# 读取原始数据
with open("c:\\Users\\hanbi\\.trae-cn\\work\\6a0981f5c3725ccf86a906aa\\extracted_pdfs\\complete_quiz_data.json", 'r', encoding='utf-8') as f:
    data = json.load(f)

questions = data['questions']
print(f"原始题目数: {len(questions)}")

# 清理和筛选
clean_questions = []
for q in questions:
    text = q.get('question', '')
    
    # 清理页面标记
    text = re.sub(r'===PAGE\d+===', ' ', text)
    text = re.sub(r'P\d+', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    # 检查是否是有效题目
    # 1. 长度检查
    if len(text) < 20 or len(text) > 500:
        continue
    
    # 2. 必须包含题目特征
    has_feature = any(x in text for x in [
        '（）', '()', '？', '?', '正确的是', '正确的有',
        '属于', '包括', '应当', '可以', '必须', '不得'
    ])
    if not has_feature:
        continue
    
    # 3. 不能是表格内容
    if '（1）' in text and '（2）' in text and '（3）' in text:
        continue
    
    # 4. 必须有选项
    if not q.get('options') or len(q['options']) < 2:
        continue
    
    q['question'] = text
    clean_questions.append(q)

print(f"清理后题目数: {len(clean_questions)}")

# 去重
unique = []
seen = set()
for q in clean_questions:
    key = q['question'][:40]
    if key not in seen:
        seen.add(key)
        unique.append(q)

print(f"去重后题目数: {len(unique)}")

# 统计
cats = {'法规': 0, '管理': 0, '精考法规': 0}
for q in unique:
    src = q.get('source', '')
    if '法规' in src:
        if '精考' in src:
            cats['精考法规'] += 1
        else:
            cats['法规'] += 1
    elif '管理' in src:
        cats['管理'] += 1

print(f"\n分类统计:")
for cat, cnt in cats.items():
    print(f"  {cat}: {cnt} 题")

# 生成JavaScript文件
js_content = f"""// 一建考试题目数据 - 共{len(unique)}题
// 数据来源：必考速成讲义PDF

const allQuestions = {json.dumps(unique, ensure_ascii=False, indent=2)};
"""

# 保存
out_path = "c:\\Users\\hanbi\\.trae-cn\\work\\6a0981f5c3725ccf86a906aa\\quiz-final\\questions.js"
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(js_content)

print(f"\n✅ 已保存: {out_path}")
print(f"   文件大小: {len(js_content)/1024:.1f} KB")

# 显示示例
print("\n前3题示例:")
for i, q in enumerate(unique[:3], 1):
    print(f"\n{i}. {q['question'][:60]}...")
    print(f"   来源: {q.get('source', '未知')} | 答案: {q.get('answer', '无')}")
