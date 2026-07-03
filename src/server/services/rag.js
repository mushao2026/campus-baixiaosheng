const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.join(__dirname, '..', '..', '..', 'knowledge');

// 加载所有知识库文件内容
function loadKnowledgeBase() {
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md') && f !== 'README.md');
  const docs = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8');
    const title = content.match(/^#\s+(.+)/m)?.[1] || file;
    docs.push({ file, title, content });
  }

  return docs;
}

// 简单的关键词匹配检索（MVP 版本，后续可升级为向量检索）
function searchKnowledge(query, docs, maxResults = 3) {
  const keywords = query.split(/[\s,，。？?！!]+/).filter(k => k.length > 0);
  const scored = docs.map(doc => {
    let score = 0;
    const lowerContent = doc.content.toLowerCase();
    for (const kw of keywords) {
      if (lowerContent.includes(kw.toLowerCase())) score += 1;
    }
    return { ...doc, score };
  });

  return scored
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// 构建注入 prompt 的知识库上下文
function buildRagContext(query) {
  const docs = loadKnowledgeBase();
  const relevant = searchKnowledge(query, docs, 2);

  if (relevant.length === 0) return '';

  return `
【参考知识库】（基于用户问题匹配的相关内容，请参考以下信息回答）

${relevant.map(d => `
### ${d.title}
${d.content.slice(0, 800)}${d.content.length > 800 ? '\n...(内容过长，已截断)' : ''}
`).join('\n---\n')}

【知识库引用结束】
`;
}

module.exports = { loadKnowledgeBase, searchKnowledge, buildRagContext };
