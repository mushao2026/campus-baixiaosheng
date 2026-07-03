import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Article {
  id: string;
  title: string;
  icon: string;
  summary: string;
  tag: string;
  content: string;
}

const articles: Article[] = [
  {
    id: '1',
    title: '大学选课终极攻略',
    icon: '📚',
    summary: '从抢课技巧到课程搭配，手把手教你成为选课高手',
    tag: '学业',
    content: '选课前一定先看培养方案！必修课优先，选修课看老师口碑。热门课要提前登录教务系统等着，准备好至少 2 个备选方案。\n\n⚠️ 注意课程时间不能冲突，保留选课截图作为凭证。\n\n补退选阶段可以调整课程，第一周先去试听再决定。',
  },
  {
    id: '2',
    title: '奖学金申请完全指南',
    icon: '💰',
    summary: '国家奖学金、励志奖学金、校内奖学金全解析',
    tag: '奖学金',
    content: '国家奖学金 8000元/年，要求 GPA 排名前 2%。国家励志奖学金 5000元/年，品学兼优且家庭经济困难。\n\n申请关键：提前准备成绩单、获奖证书、个人陈述。个人陈述要突出你的亮点和对社会的贡献。\n\n💡 综测和 GPA 两手抓，多参加竞赛和社团活动加分！',
  },
  {
    id: '3',
    title: '大学生竞赛全景图',
    icon: '🏆',
    summary: '从数学建模到互联网+，一文看懂大学所有重要竞赛',
    tag: '竞赛',
    content: '入门级：数学建模（校赛）、蓝桥杯、大英赛\n进阶级：互联网+、挑战杯、ACM\n\n大一建议从校赛开始练手，积累经验。大三冲刺省赛国赛，获奖对保研和找工作帮助很大！\n\n💡 组队很关键，找靠谱队友比找学霸更重要。',
  },
  {
    id: '4',
    title: '毕业论文写作秘籍',
    icon: '📝',
    summary: '从选题到答辩，每一步都有章可循',
    tag: '学习',
    content: '① 选题：去知网搜热门方向，选小而精的角度\n② 框架：先列大纲给导师过目，别写完才给看\n③ 查重：引用规范、用自己的话改写、控制重复率\n\n💡 答辩时保持自信，对自己写的内容要了如指掌。',
  },
  {
    id: '5',
    title: '大学恋爱必修课',
    icon: '💕',
    summary: '校园恋爱的甜蜜与智慧',
    tag: '生活',
    content: '大学恋爱很美好，但别为了谈而谈。\n\n先把自己过好，优秀的人自然会互相吸引。真诚最重要，别玩套路。同时也别耽误学业，挂科可不是闹着玩的。\n\n💡 遇到对的人就勇敢去追，没遇到就好好享受单身时光～',
  },
  {
    id: '6',
    title: '时间管理：学霸的24小时',
    icon: '⏰',
    summary: '高效学习方法 + 时间规划技巧',
    tag: '学习',
    content: '番茄工作法：25分钟专注 + 5分钟休息\n费曼学习法：用教别人的方式倒逼自己理解\n\n每天列出最重要的 3 件事，先做完再说。图书馆比宿舍效率高 10 倍。\n\n💡 手机是效率杀手，学习时把它放远点！',
  },
];

const KnowledgeBase: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = articles.filter(
    a =>
      a.title.includes(searchQuery) ||
      a.summary.includes(searchQuery) ||
      a.tag.includes(searchQuery)
  );

  return (
    <div className="flex flex-col h-full">
      {/* 搜索栏 */}
      <div className="px-4 pt-4 pb-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索知识库..."
            className="w-full h-10 pl-10 pr-4 bg-white rounded-full text-sm outline-none border border-gray-100 text-gray-700 placeholder-gray-400"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
          />
        </div>
      </div>

      {/* 文章列表 / 详情 */}
      <AnimatePresence mode="wait">
        {selectedArticle ? (
          <motion.div
            key="detail"
            className="flex-1 overflow-y-auto px-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setSelectedArticle(null)}
              className="flex items-center gap-1 text-sm text-[#FF6B35] font-medium mb-4 cursor-pointer bg-transparent border-none"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              返回列表
            </button>
            <div className="bg-white rounded-[24px] p-5" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{selectedArticle.icon}</span>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{selectedArticle.title}</h2>
                  <span className="text-xs text-[#FF6B35] font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                    {selectedArticle.tag}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-4">{selectedArticle.summary}</p>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedArticle.content}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            className="flex-1 overflow-y-auto px-4 pb-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* 分类标签 */}
            <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {['全部', '学业', '奖学金', '竞赛', '学习', '生活'].map(tag => (
                <button
                  key={tag}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium cursor-pointer border-none ${
                    tag === '全部' ? 'bg-[#FF6B35] text-white' : 'bg-white text-gray-500'
                  }`}
                  style={tag !== '全部' ? { boxShadow: '0 1px 4px rgba(0,0,0,0.04)' } : {}}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* 文章卡片 */}
            <div className="space-y-3">
              {filtered.map(article => (
                <motion.div
                  key={article.id}
                  className="bg-white rounded-[20px] p-4 cursor-pointer"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
                  onClick={() => setSelectedArticle(article)}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ y: -2, boxShadow: '0 6px 24px rgba(0,0,0,0.08)' }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{article.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-800 truncate">{article.title}</h3>
                        <span className="text-[10px] text-[#FF6B35] bg-orange-50 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                          {article.tag}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">{article.summary}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部占位 */}
      <div className="h-[72px] flex-shrink-0" />
    </div>
  );
};

export default KnowledgeBase;
