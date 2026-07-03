# 大学生活智能体 (Campus Assistant)

专为大一新生提供大学生活全方位指导的 AI 智能助手。

## 项目简介

本项目是一个基于 AI 的智能问答系统，旨在帮助大一新生快速适应大学生活。涵盖选课、奖学金、学分GPA、社团实践、竞赛、学习方法等多个维度。

## 功能特色

- 📚 **丰富知识库**：7大知识模块，覆盖大学生活方方面面
- 🤖 **专属智能体**：选课顾问、竞赛规划师、奖学金助手三大专项助手
- 💬 **友好交互**：清新校园风格界面，支持 Markdown 渲染
- 🎯 **精准回答**：基于本地知识库，回答有据可依

## 技术栈

- 前端：React + TypeScript + Vite
- 样式：CSS Modules
- Markdown：react-markdown
- 后端：Node.js (Mock Server)

## 快速开始

1. 安装依赖：`npm install`
2. 启动前端：`npm run dev`
3. 启动后端（新终端）：`npm run server`

## 项目结构

```
campus-assistant/
├── knowledge/          # 知识库文件
├── .claude/agents/     # 子智能体配置
├── src/                # 前端源代码
├── CLAUDE.md           # AI 智能体宪法
└── README.md           # 项目说明
```

## 使用说明

1. 在输入框输入你的问题（如"怎么选课？"）
2. AI 会根据问题类型自动调用对应的专项智能体
3. 查看历史对话，获取更多建议

## 贡献指南

欢迎补充知识库内容或优化智能体回答逻辑！

## 许可证

MIT License
