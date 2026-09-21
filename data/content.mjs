// Content for the home page: News, Publications, Awards and Projects.
//
// Edit this file, then run   node tools/build.mjs   — it rewrites the matching
// blocks of index.html (between the "GENERATED" comments) so the page stays plain,
// crawler-friendly static HTML. Every text is an { en, zh } pair and the build
// fails loudly if one side is missing, so the two languages can no longer drift.
//
// Texts are HTML: write &amp; for "&", and you may use <em>…</em> and
// <a href="…" target="_blank">…</a> inside them.

// ---- News ---------------------------------------------------------------
// Newest first. `date` is 'YYYY-MM'; the English and Chinese date labels are
// derived from it. The first NEWS_VISIBLE items are always shown, the rest sit
// behind the "Show earlier updates" button.
export const NEWS_VISIBLE = 3;

export const news = [
  {
    date: "2026-09",
    text: {
      en: "Continuing as an academic master's student at Shaanxi Normal University, now advised by Prof. Fei Hao.",
      zh: "确定继续在陕西师范大学攻读学术型硕士，导师为郝飞教授。"
    }
  },
  {
    date: "2026-09",
    text: {
      en: "Concluded my undergraduate research assistantship at Xidian University with Prof. Zhihan Lyu.",
      zh: "结束了在西安电子科技大学吕智涵教授课题组的本科生科研助理工作。"
    }
  },
  {
    date: "2026-08",
    text: {
      en: "Finalized the research scope for a survey on neuro-symbolic agentic AI, organized around planning, memory, and safety/verification.",
      zh: "确定了神经符号智能体综述的研究范围，围绕规划、记忆与安全/验证三部分展开。"
    }
  },
  {
    date: "2026-03",
    text: {
      en: "Started my undergraduate research assistantship at Xidian University, supervised by Prof. Zhihan Lyu.",
      zh: "开始在西安电子科技大学吕智涵教授课题组担任本科生科研助理。"
    }
  },
  {
    date: "2026-01",
    text: {
      en: "Submitted my first-author paper on automated geography QA system based on LLM and three-way concept analysis to <em>Applied Soft Computing</em>.",
      zh: "以第一作者身份将基于大语言模型与三支概念分析的地理试题自动解答系统的论文投稿至 <em>Applied Soft Computing</em>。"
    }
  },
  {
    date: "2025-06",
    text: {
      en: "Started work on the automated geography QA system based on LLM and three-way concept analysis, supervised by Prof. Fei Hao.",
      zh: "在郝飞教授指导下开始进行基于大语言模型与三支概念分析的地理试题自动解答系统的研发工作。"
    }
  },
];

// ---- Publications -------------------------------------------------------
// One card per paper. `status` is one of:
//   'in-preparation' | 'under-review' | 'preprint' | 'published'
// `meta` (optional) is the short line next to the status, e.g. role and venue.
//
// `links` holds the buttons under each card. Fill them in once the paper is out:
//   pdf, arxiv, code   a URL
//   bibtex             the BibTeX entry itself (the button copies it to the clipboard)
// A link left empty shows as a quiet "coming soon" placeholder while
// SHOW_PLACEHOLDER_LINKS is true; set it to false to show only the links you have.
export const SHOW_PLACEHOLDER_LINKS = true;

export const publications = [
  {
    status: "in-preparation",
    title: {
      en: "A Survey of Neuro-Symbolic Agents",
      zh: "神经符号智能体综述"
    },
    links: { pdf: "", arxiv: "", code: "", bibtex: "" }
  },
  {
    status: "under-review",
    title: {
      en: "Leveraging Large Language Models and Three-Way Concept Analysis for Automated Geography Multiple-Choice Question Answering",
      zh: "融合大语言模型与三支概念分析的地理多选题自动解答"
    },
    meta: {
      en: "First author · Applied Soft Computing",
      zh: "第一作者 · Applied Soft Computing"
    },
    links: { pdf: "", arxiv: "", code: "", bibtex: "" }
  },
];

// ---- Awards ---------------------------------------------------------------
// One card per group. Put the strongest items first.
export const awards = [
  {
    // Only the first `visible` items show by default; the rest sit behind a
    // "Show more" button. Keep the strongest first.
    visible: 3,
    title: {
      en: "Competitions",
      zh: "竞赛获奖"
    },
    items: [
      {
        en: "National First Prize, China Robot and Artificial Intelligence Competition (2025)",
        zh: "中国机器人及人工智能大赛 · 国家级一等奖（2025）"
      },
      {
        en: "National First Prize, Geography Teaching AI Innovation Achievement Competition (2025)",
        zh: "地理教学人工智能创新成果评比 · 国家级一等奖（2025）"
      },
      {
        en: "National Third Prize, Global Campus Artificial Intelligence Algorithm Elite Competition (2025)",
        zh: "全球校园人工智能算法精英大赛 · 国家级三等奖（2025）"
      },
      {
        en: "Provincial First Prize (Shaanxi), China Robot and Artificial Intelligence Competition (2025)",
        zh: "中国机器人及人工智能大赛（陕西赛区）· 省级一等奖（2025）"
      },
      {
        en: "Provincial Second Prize (Shaanxi), Global Campus Artificial Intelligence Algorithm Elite Competition (2025)",
        zh: "全球校园人工智能算法精英大赛（陕西赛区）· 省级二等奖（2025）"
      },
      {
        en: "Second Prize, Information Security and Adversarial Technology Competition, Northwest Region (2025)",
        zh: "信息安全与对抗技术竞赛（西北赛区）· 二等奖（2025）"
      },
      {
        en: "Third Prize, China Collegiate Computing Design Competition, Northwest Region (2024)",
        zh: "中国计算机设计大赛（西北地区赛）· 三等奖（2024）"
      },
    ]
  },
  {
    title: {
      en: "Software Copyrights",
      zh: "软件著作权"
    },
    items: [
      {
        en: "\"Weather Teaching Assistant Platform\" (Reg. No. 16269380)",
        zh: "《气象教学助手平台》（登记号：16269380）"
      },
      {
        en: "\"Deep Learning-Based Face Recognition Classroom Attendance System\" (Reg. No. 16202857)",
        zh: "《基于深度学习的人脸识别课堂签到系统》（登记号：16202857）"
      },
    ]
  },
];

// ---- Projects ---------------------------------------------------------------
// Each project card can have:
//   tagline    a short line under the title (role, status, advisor)
//   figure     a small schematic: { type: 'flow', steps: [{ label, title }], caption }
//                             or   { type: 'scope', title, items: [...], caption }
//                             or   { type: 'image', src, alt, width, height, caption }  (your own figure)
//   links      [{ label, href }]
//   gallery    screenshots: [{ src, alt, width, height }]
export const projects = [
  {
    title: {
      en: "Automated Geography Question Answering with LLMs and Three-Way Concept Analysis",
      zh: "融合大语言模型与三支概念分析的地理试题自动解答"
    },
    tagline: {
      en: "First-author research · Under review at <em>Applied Soft Computing</em> · Advisor: <a href=\"https://fhaocs.github.io/\" target=\"_blank\">Prof. Fei Hao</a>",
      zh: "第一作者研究工作 · <em>Applied Soft Computing</em> 审稿中 · 导师：<a href=\"https://fhaocs.github.io/\" target=\"_blank\">郝飞教授</a>"
    },
    description: {
      en: "A system that answers geography multiple-choice questions by combining a large language model with three-way concept analysis. It turns implicit textbook knowledge into explicit decision rules — an attempt to ground a black-box model in reasoning that a person can inspect.",
      zh: "一个回答地理选择题的系统，把大语言模型与三支概念分析结合起来，将教材中隐含的知识转化为显式的决策规则——尝试让“黑箱”模型的推理过程变得可以被人检查。"
    },
    figure: {
      type: "flow",
      steps: [
        { label: { en: "Input", zh: "输入" }, title: { en: "Textbook knowledge + question", zh: "教材知识 + 题目" } },
        { label: { en: "Method", zh: "方法" }, title: { en: "LLM + three-way concept analysis", zh: "大语言模型 + 三支概念分析" } },
        { label: { en: "Output", zh: "输出" }, title: { en: "Explicit decision rules → answer", zh: "显式决策规则 → 作答" } }
      ],
      caption: { en: "Schematic overview of the approach.", zh: "方法示意图。" }
    }
  },
  {
    title: {
      en: "A Survey of Neuro-Symbolic Agents",
      zh: "神经符号智能体综述"
    },
    tagline: {
      en: "In preparation",
      zh: "撰写中"
    },
    description: {
      en: "A survey of neuro-symbolic agentic AI, organized around planning, memory, and safety/verification. To position it, I am reviewing the existing surveys to map what the literature already covers.",
      zh: "一篇神经符号智能体综述，围绕规划、记忆与安全/验证三部分展开。为了确定它的定位，我正在梳理已有的综述，看清这个领域已经覆盖了什么。"
    },
    figure: {
      type: "scope",
      title: { en: "Neuro-symbolic agentic AI", zh: "神经符号智能体" },
      items: [
        { en: "Planning", zh: "规划" },
        { en: "Memory", zh: "记忆" },
        { en: "Safety &amp; verification", zh: "安全与验证" }
      ]
    }
  },
  {
    title: {
      en: "NextScience — AI Research Platform for Early-Career Scientists",
      zh: "NextScience —— 面向早期科研人员的 AI 研究平台"
    },
    description: {
      en: "An AI-powered academic research platform built solo (Next.js, Supabase, DeepSeek API), featuring an AI Reader for paper summarization, a Literature Map for visualizing citation networks (Semantic Scholar + OpenAlex + React Flow), and Nova, an AI research mentor for personalized research planning. No longer actively maintained, but still live at <a href=\"https://www.nextscience.space\" target=\"_blank\" rel=\"noopener\">nextscience.space</a>.",
      zh: "独立设计与开发的 AI 学术研究平台（技术栈：Next.js、Supabase、DeepSeek API），核心功能包括论文智能摘要的 AI Reader、基于 Semantic Scholar 与 OpenAlex 数据构建的文献关系图谱（React Flow 可视化），以及提供个性化科研规划的 AI 导师 Nova。目前已停止运营维护，但网站仍可正常访问：<a href=\"https://www.nextscience.space\" target=\"_blank\" rel=\"noopener\">nextscience.space</a>。"
    },
    gallery: [
      { src: "images/nextscience-home-feed.webp", width: 1280, height: 690, alt: "NextScience home feed" },
      { src: "images/nextscience-literature-map.webp", width: 1280, height: 693, alt: "NextScience literature map" },
      { src: "images/nextscience-ai-reader.webp", width: 1280, height: 695, alt: "NextScience AI paper reader" },
      { src: "images/nextscience-nova-mentor.webp", width: 1280, height: 695, alt: "NextScience Nova research mentor" },
    ]
  },
  {
    title: {
      en: "Embodied Cell — Early-Stage Exploration",
      zh: "具身细胞——早期探索"
    },
    tagline: {
      en: "Research assistantship at Xidian University · Mar – Sep 2026 · Advisor: <a href=\"http://lvzhihan.com\" target=\"_blank\">Prof. Zhihan Lyu</a>",
      zh: "西安电子科技大学科研助理 · 2026 年 3 月至 9 月 · 导师：<a href=\"http://lvzhihan.com\" target=\"_blank\">吕智涵教授</a>"
    },
    description: {
      en: "An exploratory project on embodied, environment-reactive systems. It combined an ESP32-based physical prototype (light, force and time-of-flight sensors driving RGBW LEDs, with the structure modeled in Onshape) and a Unity digital-twin simulation of fungal hyphal networks and synthetic cells. I took part in it for about six months during my research assistantship, and what I took from it was mainly broader domain knowledge in digital twins and embodied systems, and hands-on practice with new tools such as Unity and Onshape. The images below are snapshots from my time on the project.",
      zh: "一个关于具身、能对环境作出反应的系统的探索性项目。它包含两部分：基于 ESP32 的实体原型（光敏、压力和飞行时间传感器驱动 RGBW LED 灯带，结构用 Onshape 建模），以及用 Unity 搭建的数字孪生仿真（模拟真菌菌丝网络与合成细胞）。我在科研助理期间参与了它大约半年，从中得到的主要是对数字孪生与具身系统这一领域的更多了解，以及 Unity、Onshape 等新工具的实际使用经验。下面的图片是我参与期间的一些记录。"
    },
    gallery: [
      { src: "images/embodied-cell-top-view.webp", width: 1400, height: 1050, alt: "Embodied cell prototype, top view" },
      { src: "images/embodied-cell-side-view.webp", width: 1400, height: 793, alt: "Embodied cell prototype, side view" },
      { src: "images/digital-twin-close-view.webp", width: 1400, height: 791, alt: "Digital twin simulation, close view" },
      { src: "images/digital-twin-top-down.webp", width: 1400, height: 792, alt: "Digital twin simulation, top-down view" },
    ]
  },
];
