// Content for the home page: News, Publications, Awards and Projects.
//
// Edit this file, then run   node tools/build.mjs   — it rewrites the matching
// blocks of index.html (between the "GENERATED" comments) so the page stays plain,
// crawler-friendly static HTML. Every text is an { en, zh } pair and the build
// fails loudly if one side is missing, so the two languages can no longer drift.
// A pair may also carry a third text, `de` (German). It is optional: without it
// the German page shows the English, and the build prints a reminder.
//
// Texts are HTML: write &amp; for "&", and you may use <em>…</em> and
// <a href="…" target="_blank">…</a> inside them. <em> is for the name of a
// journal or conference: it is set in the italic display face. Use it only for
// names in Latin letters, never around Chinese text.

// ---- News ---------------------------------------------------------------
// Newest first. `date` is 'YYYY-MM'; the English and Chinese date labels are
// derived from it. The first NEWS_VISIBLE items are always shown, the rest sit
// behind the "Show earlier updates" button.
export const NEWS_VISIBLE = 3;

export const news = [
  {
    date: "2026-09",
    text: {
      en: "Admitted to the academic master’s program at Shaanxi Normal University (starting Sep 2027), advised by Prof. Fei Hao.",
      zh: "获得陕西师范大学学术型硕士录取资格，2027 年 9 月入学，导师为郝飞教授。",
      de: "Zulassung zum forschungsorientierten Masterstudiengang an der Shaanxi Normal University (Beginn: Sept. 2027), betreut von Prof. Fei Hao."
    }
  },
  {
    date: "2026-09",
    text: {
      en: "Concluded my undergraduate research assistantship at Xidian University with Prof. Zhihan Lyu.",
      zh: "结束了在西安电子科技大学吕智涵教授课题组的本科生科研助理工作。",
      de: "Meine Tätigkeit als studentische Forschungshilfskraft an der Xidian University bei Prof. Zhihan Lyu ist abgeschlossen."
    }
  },
  {
    date: "2026-08",
    text: {
      en: "Finalized the research scope for a survey on neuro-symbolic agentic AI, organized around planning, memory, and safety/verification.",
      zh: "确定了神经符号智能体综述的研究范围，围绕规划、记忆与安全/验证三部分展开。",
      de: "Den Themenumfang für einen Übersichtsartikel zu neurosymbolischer agentischer KI festgelegt – gegliedert nach Planung, Gedächtnis sowie Sicherheit/Verifikation."
    }
  },
  {
    date: "2026-03",
    text: {
      en: "Started my undergraduate research assistantship at Xidian University, supervised by Prof. Zhihan Lyu.",
      zh: "开始在西安电子科技大学吕智涵教授课题组担任本科生科研助理。",
      de: "Beginn meiner Tätigkeit als studentische Forschungshilfskraft an der Xidian University, betreut von Prof. Zhihan Lyu."
    }
  },
  {
    date: "2026-01",
    text: {
      en: "Submitted my first-author paper on automated geography QA system based on LLM and three-way concept analysis to <em>Applied Soft Computing</em>.",
      zh: "以第一作者身份将基于大语言模型与三支概念分析的地理试题自动解答系统的论文投稿至 <em>Applied Soft Computing</em>。",
      de: "Meinen Artikel in Erstautorschaft über ein automatisiertes Frage-Antwort-System für Geographie auf Basis von LLMs und Drei-Wege-Begriffsanalyse bei <em>Applied Soft Computing</em> eingereicht."
    }
  },
  {
    date: "2025-06",
    text: {
      en: "Started work on the automated geography QA system based on LLM and three-way concept analysis, supervised by Prof. Fei Hao.",
      zh: "在郝飞教授指导下开始进行基于大语言模型与三支概念分析的地理试题自动解答系统的研发工作。",
      de: "Beginn der Arbeit am automatisierten Frage-Antwort-System für Geographie auf Basis von LLMs und Drei-Wege-Begriffsanalyse, betreut von Prof. Fei Hao."
    }
  },
];

// ---- Publications -------------------------------------------------------
// One card per paper. `status` is one of:
//   'in-preparation' | 'under-review' | 'preprint' | 'published'
// Papers that are 'in-preparation' are not part of the main list: the build
// puts them below it, under their own small heading "Manuscripts in
// Preparation" (wherever they sit in this array).
// `meta` (optional) is the short line next to the status, e.g. role and venue.
// Wrap the journal or conference name in <em>…</em> (see the top of this file).
//
// `links` holds the buttons under each card. Fill them in once the paper is out:
//   pdf, arxiv, code   a URL
//   bibtex             the BibTeX entry itself (the button copies it to the clipboard)
// Only the links you have filled in are shown. Set SHOW_PLACEHOLDER_LINKS to
// true to show the empty ones too, as quiet "coming soon" placeholders.
export const SHOW_PLACEHOLDER_LINKS = false;

export const publications = [
  {
    status: "in-preparation",
    title: {
      en: "A Survey of Neuro-Symbolic Agents",
      zh: "神经符号智能体综述",
      de: "A Survey of Neuro-Symbolic Agents"
    },
    links: { pdf: "", arxiv: "", code: "", bibtex: "" }
  },
  {
    status: "under-review",
    title: {
      en: "Leveraging Large Language Models and Three-Way Concept Analysis for Automated Geography Multiple-Choice Question Answering",
      zh: "融合大语言模型与三支概念分析的地理多选题自动解答",
      de: "Leveraging Large Language Models and Three-Way Concept Analysis for Automated Geography Multiple-Choice Question Answering"
    },
    meta: {
      en: "First author · <em>Applied Soft Computing</em>",
      zh: "第一作者 · <em>Applied Soft Computing</em>",
      de: "Erstautorschaft · <em>Applied Soft Computing</em>"
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
      zh: "竞赛获奖",
      de: "Wettbewerbe"
    },
    items: [
      {
        en: "National First Prize, China Robot and Artificial Intelligence Competition (2025)",
        zh: "中国机器人及人工智能大赛 · 国家级一等奖（2025）",
        de: "Nationaler erster Preis, China Robot and Artificial Intelligence Competition (2025)"
      },
      {
        en: "National First Prize, Geography Teaching AI Innovation Achievement Competition (2025)",
        zh: "地理教学人工智能创新成果评比 · 国家级一等奖（2025）",
        de: "Nationaler erster Preis, Geography Teaching AI Innovation Achievement Competition (2025)"
      },
      {
        en: "National Third Prize, Global Campus Artificial Intelligence Algorithm Elite Competition (2025)",
        zh: "全球校园人工智能算法精英大赛 · 国家级三等奖（2025）",
        de: "Nationaler dritter Preis, Global Campus Artificial Intelligence Algorithm Elite Competition (2025)"
      },
      {
        en: "Provincial First Prize (Shaanxi), China Robot and Artificial Intelligence Competition (2025)",
        zh: "中国机器人及人工智能大赛（陕西赛区）· 省级一等奖（2025）",
        de: "Erster Preis auf Provinzebene (Shaanxi), China Robot and Artificial Intelligence Competition (2025)"
      },
      {
        en: "Provincial Second Prize (Shaanxi), Global Campus Artificial Intelligence Algorithm Elite Competition (2025)",
        zh: "全球校园人工智能算法精英大赛（陕西赛区）· 省级二等奖（2025）",
        de: "Zweiter Preis auf Provinzebene (Shaanxi), Global Campus Artificial Intelligence Algorithm Elite Competition (2025)"
      },
      {
        en: "Second Prize, Information Security and Adversarial Technology Competition, Northwest Region (2025)",
        zh: "信息安全与对抗技术竞赛（西北赛区）· 二等奖（2025）",
        de: "Zweiter Preis, Information Security and Adversarial Technology Competition, Region Nordwest (2025)"
      },
      {
        en: "Third Prize, China Collegiate Computing Design Competition, Northwest Region (2024)",
        zh: "中国计算机设计大赛（西北地区赛）· 三等奖（2024）",
        de: "Dritter Preis, China Collegiate Computing Design Competition, Region Nordwest (2024)"
      },
    ]
  },
  {
    title: {
      en: "Software Copyrights",
      zh: "软件著作权",
      de: "Software-Urheberrechte"
    },
    items: [
      {
        en: "“Weather Teaching Assistant Platform” (Reg. No. 16269380)",
        zh: "《气象教学助手平台》（登记号：16269380）",
        de: "„Weather Teaching Assistant Platform“ (Reg.-Nr. 16269380)"
      },
      {
        en: "“Deep Learning-Based Face Recognition Classroom Attendance System” (Reg. No. 16202857)",
        zh: "《基于深度学习的人脸识别课堂签到系统》（登记号：16202857）",
        de: "„Deep Learning-Based Face Recognition Classroom Attendance System“ (Reg.-Nr. 16202857)"
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
      zh: "融合大语言模型与三支概念分析的地理试题自动解答",
      de: "Automatisierte Beantwortung von Geographiefragen mit LLMs und Drei-Wege-Begriffsanalyse"
    },
    tagline: {
      en: "First-author research · Under review at <em>Applied Soft Computing</em> · Advisor: <a href=\"https://fhaocs.github.io/\" target=\"_blank\">Prof. Fei Hao</a>",
      zh: "第一作者研究工作 · <em>Applied Soft Computing</em> 审稿中 · 导师：<a href=\"https://fhaocs.github.io/\" target=\"_blank\">郝飞教授</a>",
      de: "Forschungsarbeit in Erstautorschaft · In Begutachtung bei <em>Applied Soft Computing</em> · Betreuung: <a href=\"https://fhaocs.github.io/\" target=\"_blank\">Prof. Fei Hao</a>"
    },
    description: {
      en: "A system that answers geography multiple-choice questions by combining a large language model with three-way concept analysis. It turns implicit textbook knowledge into explicit decision rules — an attempt to ground a black-box model in reasoning that a person can inspect.",
      zh: "一个回答地理选择题的系统，把大语言模型与三支概念分析结合起来，将教材中隐含的知识转化为显式的决策规则——尝试让“黑箱”模型的推理过程变得可以被人检查。",
      de: "Ein System, das Multiple-Choice-Fragen der Geographie beantwortet, indem es ein großes Sprachmodell mit der Drei-Wege-Begriffsanalyse verbindet. Es überführt implizites Lehrbuchwissen in explizite Entscheidungsregeln – ein Versuch, ein Blackbox-Modell auf Schlussfolgerungen zu stützen, die ein Mensch nachprüfen kann."
    },
    figure: {
      type: "flow",
      steps: [
        { label: { en: "Input", zh: "输入", de: "Eingabe" }, title: { en: "Textbook knowledge + question", zh: "教材知识 + 题目", de: "Lehrbuchwissen + Frage" } },
        { label: { en: "Method", zh: "方法", de: "Methode" }, title: { en: "LLM + three-way concept analysis", zh: "大语言模型 + 三支概念分析", de: "LLM + Drei-Wege-Begriffsanalyse" } },
        { label: { en: "Output", zh: "输出", de: "Ausgabe" }, title: { en: "Explicit decision rules → answer", zh: "显式决策规则 → 作答", de: "Explizite Entscheidungsregeln → Antwort" } }
      ],
      caption: { en: "Schematic overview of the approach.", zh: "方法示意图。", de: "Schematische Übersicht des Ansatzes." }
    }
  },
  {
    title: {
      en: "NextScience — AI Research Platform for Early-Career Scientists",
      zh: "NextScience —— 面向早期科研人员的 AI 研究平台",
      de: "NextScience – KI-Forschungsplattform für Nachwuchsforschende"
    },
    description: {
      en: "An AI-powered academic research platform built solo (Next.js, Supabase, DeepSeek API), featuring an AI Reader for paper summarization, a Literature Map for visualizing citation networks (Semantic Scholar + OpenAlex + React Flow), and Nova, an AI research mentor for personalized research planning. No longer actively maintained, but still live at <a href=\"https://www.nextscience.space\" target=\"_blank\" rel=\"noopener\">nextscience.space</a>.",
      zh: "独立设计与开发的 AI 学术研究平台（技术栈：Next.js、Supabase、DeepSeek API），核心功能包括论文智能摘要的 AI Reader、基于 Semantic Scholar 与 OpenAlex 数据构建的文献关系图谱（React Flow 可视化），以及提供个性化科研规划的 AI 导师 Nova。目前已停止运营维护，但网站仍可正常访问：<a href=\"https://www.nextscience.space\" target=\"_blank\" rel=\"noopener\">nextscience.space</a>。",
      de: "Eine im Alleingang entwickelte KI-gestützte Plattform für akademische Forschung (Next.js, Supabase, DeepSeek API) mit einem AI Reader zur Zusammenfassung von Artikeln, einer Literature Map zur Visualisierung von Zitationsnetzwerken (Semantic Scholar + OpenAlex + React Flow) und Nova, einem KI-Mentor für die persönliche Forschungsplanung. Wird nicht mehr aktiv gepflegt, ist aber weiterhin erreichbar unter <a href=\"https://www.nextscience.space\" target=\"_blank\" rel=\"noopener\">nextscience.space</a>."
    },
    gallery: [
      { src: "images/nextscience-home-feed.webp", width: 1280, height: 690, alt: "NextScience home feed" },
      { src: "images/nextscience-literature-map.webp", width: 1280, height: 693, alt: "NextScience literature map" },
    ]
  },
  {
    title: {
      en: "Embodied Cell — Early-Stage Exploration",
      zh: "具身细胞——早期探索",
      de: "Embodied Cell – Erkundung in einer frühen Phase"
    },
    tagline: {
      en: "Research assistantship at Xidian University · Mar – Sep 2026 · Advisor: <a href=\"http://lvzhihan.com\" target=\"_blank\">Prof. Zhihan Lyu</a>",
      zh: "西安电子科技大学科研助理 · 2026 年 3 月至 9 月 · 导师：<a href=\"http://lvzhihan.com\" target=\"_blank\">吕智涵教授</a>",
      de: "Forschungshilfskraft an der Xidian University · März – Sept. 2026 · Betreuung: <a href=\"http://lvzhihan.com\" target=\"_blank\">Prof. Zhihan Lyu</a>"
    },
    description: {
      en: "An exploratory project on embodied, environment-reactive systems: an ESP32-based physical prototype (light, force and time-of-flight sensors driving RGBW LEDs), paired with a Unity digital-twin simulation of fungal hyphal networks and synthetic cells.",
      zh: "一个关于具身、能对环境作出反应的系统的探索性项目：基于 ESP32 的实体原型（光敏、压力和飞行时间传感器驱动 RGBW LED 灯带），配合用 Unity 搭建的数字孪生仿真（模拟真菌菌丝网络与合成细胞）。",
      de: "Ein exploratives Projekt zu verkörperten, umgebungsreaktiven Systemen: ein ESP32-Prototyp (Licht-, Kraft- und Time-of-Flight-Sensoren steuern RGBW-LEDs) und ein digitaler Zwilling in Unity, der Pilzhyphen-Netzwerke und synthetische Zellen simuliert."
    }
  },
];
