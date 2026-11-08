// Machine translation of reading notes between English, Chinese and German,
// through any OpenAI-compatible chat API (SiliconFlow's free models by default).
//
// The key lives outside the repo, which is public:
//   ~/.config/personal-website/llm.env
//     LLM_BASE_URL=https://api.siliconflow.cn/v1
//     LLM_API_KEY=sk-...
//     LLM_MODEL=Qwen/Qwen3-8B
//     LLM_FALLBACK=THUDM/GLM-4-9B-0414      (optional, comma-separated: used while the main model is rate-limited)
// Environment variables of the same names override the file. The file is read
// on every request, so a new model takes effect without restarting the tool.
//
// A small model does not reliably follow typographic rules, so the result is
// tidied afterwards (spacing, punctuation and quotes as in the existing notes).

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CONFIG_FILE = path.join(os.homedir(), '.config', 'personal-website', 'llm.env');

export function loadConfig() {
  const cfg = {};
  try {
    for (const line of fs.readFileSync(CONFIG_FILE, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m) cfg[m[1]] = m[2].replace(/^(["'])(.*)\1$/, '$2');
    }
  } catch { /* no file: fall back to the environment */ }
  for (const k of ['LLM_BASE_URL', 'LLM_API_KEY', 'LLM_MODEL', 'LLM_FALLBACK']) if (process.env[k]) cfg[k] = process.env[k];
  return {
    baseUrl: (cfg.LLM_BASE_URL || 'https://api.siliconflow.cn/v1').replace(/\/+$/, ''),
    apiKey: cfg.LLM_API_KEY || '',
    model: cfg.LLM_MODEL || 'Qwen/Qwen3-8B',
    fallback: (cfg.LLM_FALLBACK || '').split(',').map(s => s.trim()).filter(Boolean)
  };
}

const NAME = { en: 'English', zh: 'Simplified Chinese', de: 'German' };

const COMMON = from => `Translate faithfully: add nothing, drop nothing, and do not spell out acronyms the source leaves as acronyms. Keep the sentence boundaries of the source. Reply with the translation only, as one paragraph, without any preface or comment.
Keep names of models, systems, benchmarks, datasets and tools, acronyms and formulas exactly as in the source.`;

const STYLE = {
  zh: `Write natural academic Chinese, not English word order.
Typography: full-width punctuation (，。：；（）); quotation marks “…”; one half-width space between Chinese characters and Latin letters or digits (在 3 个领域上使用 GPT-4), but no space next to full-width punctuation.
Personal names stay in Latin letters, never transliterated: "Yao et al." is "Yao 等人", "Qi" stays "Qi". "The authors" is "作者".
Terminology: domain 领域, planner 规划器, agent 智能体, baseline 基线, fine-tune 微调, precondition 前提条件, postcondition 后置条件, invariant 不变式, token 词元, model checking 模型检测, guardrail 护栏, contract 契约, judge 评判者.
Formal concept analysis: formal context 形式背景 (never 上下文), context 背景, concept 概念, concept lattice 概念格, object 对象, attribute 属性, extent 外延, intent 内涵, implication 蕴含, three-way 三支 (never 三元 or 三向), triadic 三元, incomplete 不完备, interval set 区间集, three-way decision 三支决策, rough set 粗糙集.`,
  de: `Check grammatical gender and case carefully. "LLM" is neuter: das LLM, ein LLM.
Typography: German quotation marks „…“; decimal comma (95,5); a space before the percent sign (95,5 %).
Where the English says "the authors", write "die Arbeit". Keep "X et al." as it is.
Terminology: LLM judge LLM-Richter, reasoning Reasoning, guardrail Guardrail, constraint Constraint (der), model checker Model Checker, planner Planer, baseline Baseline.
Formal concept analysis (use the German terms of Ganter and Wille): formal context formaler Kontext, concept Begriff (never Konzept), concept lattice Begriffsverband, object Gegenstand, attribute Merkmal, extent Umfang, intent Inhalt, implication Implikation, three-way Drei-Wege- (three-way concept Drei-Wege-Begriff), triadic triadisch, incomplete unvollständig, interval set Intervallmenge, three-way decision Drei-Wege-Entscheidung, rough set Rough Set.`,
  en: `Write plain academic English. Use straight quotes (" and '). "X 等人" is "X et al.".`
};

// The category names on the site are translations already settled (三支概念,
// Drei-Wege-Begriffe, …); handing them over keeps the notes consistent with them.
function glossary(projects, from, to) {
  const lines = [];
  for (const p of projects || []) {
    for (const g of [p, ...(p.groups || [])]) {
      const a = g['label_' + from], b = g['label_' + to];
      if (a && b && a !== b && !lines.some(l => l.startsWith(a + ' = '))) lines.push(a + ' = ' + b);
    }
  }
  return lines.length ? 'Names of research areas as used on the site: ' + lines.join('; ') + '.' : '';
}

function systemPrompt(from, to, projects) {
  return [`You translate reading notes on research papers from ${NAME[from]} into ${NAME[to]} for an academic website.`,
    COMMON(from), STYLE[to], glossary(projects, from, to)].filter(Boolean).join('\n');
}

// One worked example taken from the notes already on the site, so the model
// sees the voice and conventions to match: a note written in all three
// languages, from the same project if there is one, about 700 characters long.
function pickExample(papers, from, to, project) {
  let best = null, bestGap = Infinity;
  const inProject = p => [].concat(p.project).includes(project);
  const pool = papers.filter(p => p.note_en && p.note_zh && p.note_de);
  const same = pool.filter(inProject);
  for (const p of same.length ? same : pool) {
    const gap = Math.abs(p.note_en.length - 700);
    if (gap < bestGap) { best = p; bestGap = gap; }
  }
  return best && { source: best['note_' + from], target: best['note_' + to] };
}

const wait = ms => new Promise(r => setTimeout(r, ms));

// Surnames of the paper's authors. A model is tempted to write these in
// Chinese characters (Yao -> 姚) although the notes keep them in Latin letters,
// and an instruction alone does not stop it; so they are swapped for tokens
// like ⟦1⟧ before translating and put back afterwards.
function surnames(authors) {
  return [...new Set(String(authors || '').split(',').map(a => a.trim().split(/\s+/).pop()).filter(n => /^[A-Z][\p{L}'-]+$/u.test(n)))];
}

export async function translate({ text, from, to, papers, projects, project, authors }) {
  if (!NAME[from] || !NAME[to] || from === to) throw new Error('不支持的翻译方向');
  if (!text || !text.trim()) throw new Error('没有可翻译的文字');
  const cfg = loadConfig();
  if (!cfg.apiKey) throw new Error('没有找到 API key：请在 ' + CONFIG_FILE + ' 里写上 LLM_API_KEY=…');

  let system = systemPrompt(from, to, projects);
  let source = text.trim();
  const names = surnames(authors).filter(n => new RegExp('\\b' + n + '\\b').test(source));
  names.forEach((n, i) => { source = source.replace(new RegExp('\\b' + n + '\\b', 'g'), '⟦' + (i + 1) + '⟧'); });
  if (names.length) system += '\nTokens such as ⟦1⟧ stand for personal names: copy them unchanged.';
  const restore = out => out.replace(/⟦\s*(\d+)\s*⟧/g, (m, i) => names[i - 1] || m);

  const messages = [{ role: 'system', content: system }];
  const ex = pickExample(papers || [], from, to, project);
  if (ex) messages.push({ role: 'user', content: ex.source }, { role: 'assistant', content: ex.target });
  messages.push({ role: 'user', content: source });

  // The free tier allows only so many requests and tokens per minute. On a
  // 429, wait and try the main model again; only then turn to the fallback
  // (which has its own quota but follows the glossary less well).
  const fb = cfg.fallback.filter(m => m !== cfg.model);
  const plan = fb.length ? [cfg.model, cfg.model, fb[0], cfg.model, fb[0], cfg.model] : Array(6).fill(cfg.model);
  const delays = [5000, 4000, 10000, 15000, 25000];
  for (let attempt = 0; ; attempt++) {
    const model = plan[Math.min(attempt, plan.length - 1)];
    const body = { model, messages, temperature: 0.2, max_tokens: 2048, stream: false };
    // Qwen3 models think out loud unless told not to; SiliconFlow takes this flag.
    if (/qwen3/i.test(model)) body.enable_thinking = false;
    let res, data;
    try {
      res = await fetch(cfg.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + cfg.apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120000)
      });
      data = await res.json().catch(() => ({}));
    } catch (err) {
      if (attempt < 2) { await wait(delays[attempt]); continue; }
      throw new Error('连不上翻译服务（' + new URL(cfg.baseUrl).host + '）：' + (err.cause?.code || err.message));
    }
    if (res.ok) {
      const out = data.choices?.[0]?.message?.content;
      if (!out) throw new Error('翻译服务没有返回内容');
      return { text: tidy(restore(out), to), model };
    }
    const retry = res.status === 429 || res.status >= 500;
    if (retry && attempt < delays.length) { await wait(delays[attempt]); continue; }
    const msg = data.message || data.error?.message || res.statusText;
    if (res.status === 429) throw new Error('免费模型限流了（' + msg + '），过一分钟再试。');
    if (res.status === 401) throw new Error('API key 无效（401），请检查 ' + CONFIG_FILE);
    throw new Error('翻译失败（' + res.status + '）：' + msg);
  }
}

// ---- Tidying ------------------------------------------------------------------

const CJK = '\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff';
const isCJK = ch => !!ch && new RegExp('[' + CJK + ']').test(ch);

function common(s) {
  return s
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .replace(/^```[a-z]*\s*|\s*```$/g, '')
    .replace(/[​‌‍﻿]/g, '')
    .trim();
}

// Notes are a single paragraph on the page.
function oneParagraph(s, lang) {
  s = s.replace(/\s*\n+\s*/g, lang === 'zh' ? '\n' : ' ');
  if (lang === 'zh') s = s.replace(/\n/g, (m, i) => (isCJK(s[i - 1]) || /[，。：；）”]/.test(s[i - 1]) ? '' : ' '));
  return s.replace(/[ \t]{2,}/g, ' ').trim();
}

export function tidyZh(s) {
  s = oneParagraph(common(s), 'zh');
  // Half-width punctuation that touches a Chinese character becomes full-width.
  const pair = (ch, full) => {
    s = s.replace(new RegExp('([' + CJK + '）”])\\s*\\' + ch + '\\s*', 'g'), '$1' + full);
    s = s.replace(new RegExp('\\s*\\' + ch + '\\s*([' + CJK + '（“])', 'g'), full + '$1');
  };
  pair(',', '，'); pair(';', '；'); pair(':', '：'); pair('?', '？'); pair('!', '！');
  s = s.replace(new RegExp('([' + CJK + '）”])\\.(?=\\s|$)', 'g'), '$1。');
  s = s.replace(/\(([^()]*)\)/g, (m, inner, i, all) =>
    isCJK(all[i - 1]) || isCJK(all[i + m.length]) || new RegExp('[' + CJK + ']').test(inner) ? '（' + inner.trim() + '）' : m);
  s = s.replace(/"([^"]*)"/g, '“$1”').replace(/「([^」]*)」/g, '“$1”');
  // A space between Chinese and Latin letters or digits, none next to full-width punctuation.
  s = s.replace(new RegExp('([' + CJK + '])([A-Za-z0-9])', 'g'), '$1 $2');
  s = s.replace(new RegExp('([A-Za-z0-9%])([' + CJK + '])', 'g'), '$1 $2');
  s = s.replace(/\s*([，。：；？！、（）“”])\s*/g, '$1');
  return s;
}

export function tidyDe(s) {
  s = oneParagraph(common(s), 'de');
  s = s.replace(/“([^“”]*)”/g, '„$1“').replace(/"([^"]*)"/g, '„$1“');
  s = s.replace(/(\d) ?%/g, '$1 %');
  return s;
}

export function tidyEn(s) {
  return oneParagraph(common(s), 'en').replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
}

function tidy(s, lang) {
  return lang === 'zh' ? tidyZh(s) : lang === 'de' ? tidyDe(s) : tidyEn(s);
}
