import { useState, useEffect } from "react";

// ─── COLOR PALETTE ───────────────────────────────────────────────
const C = {
  mahogany: "#805841",
  pearl: "#dcf7f3",
  daffodil: "#fffcdd",
  gossamer: "#ffd8d8",
  dreamy: "#f5a2a2",
  white: "#ffffff",
  text: "#3a2a1a",
  muted: "#9a7a5a",
  border: "#e8d8d0",
};

// ─── COURSE CONFIG ────────────────────────────────────────────────
const COURSE_START = new Date(2026, 4, 13); // May 13
const RTK_INTRO_DATE = new Date(2026, 5, 3);  // Jun 3 — read introduction
const RTK_LESSON1_DATE = new Date(2026, 5, 4); // Jun 4 — first kanji writing day

// Genki L7 kanji (class-assigned)
const L7_KANJI = ["父", "母", "兄", "姉", "弟", "妹", "家族", "自分", "友", "体", "顔", "髪", "目", "耳", "口", "手", "足"];
// Genki L8 kanji (class-assigned)
const L8_KANJI = ["会社", "仕事", "新聞", "読む", "書く", "聞く", "話す", "休む", "働く", "電気", "次", "車", "思う", "言う"];

// Genki L7 workbook exercises
const L7_WORKBOOK = [
  "L7–1 (p.69): Verb forms — わかります, やります, etc.",
  "L7–2 (p.70): ~ています — singing, drinking, eating, etc.",
  "L7–3 (p.71): ~ています (jobs/states) — 銀行で働いています",
  "L7–4 (p.72): Appearance — 背が高い, 太っている",
  "L7–5 (p.73): ~て connective — 安くておいしい",
  "L7–6 (p.74): ~に行く/来る — 大阪に会いに行きます",
  "L7–7 (p.75): Counters — 何人います",
  "L7–8 (p.76): Free response — describe a friend",
  "L7–9 (p.77): Listening comprehension",
];
const L8_WORKBOOK = [
  "L8–1 (p.78): Plain form conjugation — あける, かう, すわる",
  "L8–2 (p.79): Plain form Q&A — よくバスに乗る？",
  "L8–3 (p.80): ~と思います",
  "L8–4 (p.81): ~と言っていました",
  "L8–5 (p.82): ~ないでください",
  "L8–6 (p.83): のが好き/上手",
  "L8–7 (p.84): が subject marker",
  "L8–8 (p.85): Free response — opinions",
  "L8–9 (p.86): Listening comprehension",
];

// RTK kanji in order, 5–7 per study day starting Jun 4
// Lesson 1: kanji 1–34 (Stories), progressing ~6/day
const RTK_ENTRIES = [
  // Day 1 (Jun 4, Thu)
  ["一 (one)","二 (two)","三 (three)","四 (four)","五 (five)","六 (six)","七 (seven)"],
  // Day 2 (Jun 5, Fri)
  ["八 (eight)","九 (nine)","十 (ten)","口 (mouth)","日 (sun/day)","月 (moon/month)","田 (rice field)"],
  // Day 3 (Jun 8, Mon — following Monday after first class post Jun 4)
  ["目 (eye)","古 (old)","吾 (I/myself)","冒 (risk)","朋 (companion)","明 (bright)","唱 (chant)"],
  // Day 4 (Jun 11, Thu)
  ["晶 (sparkle)","品 (goods)","呂 (spine)","昌 (prosperous)","早 (early)","旭 (rising sun)","世 (generation)"],
  // Day 5 (Jun 12, Fri)
  ["胃 (stomach)","旦 (nightbreak)","胆 (gall bladder)","亘 (span)","凹 (concave)","凸 (convex)","旧 (olden times)"],
  // Day 6 (Jun 15, Mon)
  ["自 (oneself)","白 (white)","百 (hundred)","中 (in/middle)","千 (thousand)","舌 (tongue)","升 (measuring box)"],
  // Day 7 (Jun 18, Thu)
  ["昇 (rise up)","丸 (round)","寸 (measurement)","専 (specialty)","博 (doctor)","占 (fortune-telling)","上 (above)"],
  // Day 8 (Jun 19, Fri)
  ["下 (below)","卓 (eminent)","朝 (morning)","嘲 (derision)","只 (only)","貝 (shellfish)","唄 (pop song)"],
];

// Map a date string to an RTK day index (0-based), starting Jun 4
// Study days are Mon/Thu/Fri (matching schedule)
function getRtkDayIndex(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const start = new Date(RTK_LESSON1_DATE);
  if (d < start) return -1;

  // Count study days (Mon, Thu, Fri) from Jun 4 onward
  let count = 0;
  const cur = new Date(start);
  while (cur <= d) {
    const dow = cur.getDay();
    if (dow === 1 || dow === 4 || dow === 5) { // Mon, Thu, Fri
      if (isSameDay(cur, d)) return count;
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return -1;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatDate(d) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getWednesdayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = 3 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── DETERMINE CURRENT GENKI LESSON from date ───────────────────
function getGenkiLesson(date) {
  // Course covers L7–8 May 13 – Jun 24
  // We'll treat L7 as the first half, L8 the second
  const midpoint = new Date(2026, 5, 3); // Jun 3 ~ midpoint
  return date >= midpoint ? 8 : 7;
}

function getGenkiKanji(lesson) {
  return lesson === 7 ? L7_KANJI : L8_KANJI;
}

// ─── TASK GENERATOR ──────────────────────────────────────────────
function getTasksForDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const dow = d.getDay();
  const courseEnd = new Date(2026, 5, 24);
  if (d < COURSE_START || d > courseEnd) return [];
  if (dow === 0 || dow === 6) return [];

  const wed = getWednesdayOfWeek(d);
  const isClassDay = isSameDay(d, wed);
  const isPreClass = d < wed;
  const daysSinceWed = Math.floor((d - wed) / (24 * 60 * 60 * 1000));

  const lesson = getGenkiLesson(d);
  const lessonKanji = getGenkiKanji(lesson);
  const workbook = lesson === 7 ? L7_WORKBOOK : L8_WORKBOOK;

  const tasks = [];

  // ── CLASS DAY ──
  if (isClassDay) {
    tasks.push({
      id: "class",
      label: "📚 In-Person Class — SJJACC",
      resource: "SJJACC Group Class",
      duration: "1.5 hrs",
      note: `Lesson ${lesson} grammar, speaking, partner exercises. Teacher-led. No solo prep needed — just show up!`,
      color: C.dreamy,
      category: "class",
    });
    return tasks;
  }

  // ── RTK INTRODUCTION (Jun 3 only) ──
  if (isSameDay(d, RTK_INTRO_DATE)) {
    tasks.push({
      id: "rtk_intro",
      label: "RTK — Read the Introduction",
      resource: "Remembering the Kanji 1 (Heisig)",
      duration: "30–45 min",
      note: "Read the full introduction to understand the system before starting kanji tomorrow. No writing yet.",
      color: C.daffodil,
      category: "rtk",
    });
    // Also BunPro/WaniKani on this day
    tasks.push({
      id: "bunpro",
      label: "BunPro — Reviews + new vocab",
      resource: "BunPro",
      duration: "15 min",
      note: "Reviews first, then new vocabulary for current lesson",
      color: C.pearl,
      category: "srs",
    });
    tasks.push({
      id: "wanikani",
      label: "WaniKani — Clear review queue",
      resource: "WaniKani",
      duration: "10–15 min",
      note: "Clear reviews before any new items",
      color: C.pearl,
      category: "srs",
    });
    return tasks;
  }

  // ── SRS — always on study days ──
  tasks.push({
    id: "bunpro",
    label: "BunPro — Reviews + new vocab",
    resource: "BunPro",
    duration: "15 min",
    note: "Always do reviews first before adding new items",
    color: C.pearl,
    category: "srs",
  });
  tasks.push({
    id: "wanikani",
    label: "WaniKani — Clear review queue + new items",
    resource: "WaniKani",
    duration: "10–15 min",
    note: "Clear reviews first, then unlock new items matching current lesson kanji",
    color: C.pearl,
    category: "srs",
  });

  // ── PRE-CLASS: Mon & Tue ──
  if (isPreClass) {
    if (dow === 1) {
      // Monday — first kanji exposure
      tasks.push({
        id: "utp",
        label: `Understanding through Pictures — L${lesson} kanji (first pass)`,
        resource: "Understanding through Pictures",
        duration: "5–8 min",
        note: `Kanji: ${lessonKanji.slice(0, 8).join("、")} — read each visual explanation, trace/write once or twice`,
        color: C.gossamer,
        category: "kanji",
      });
      tasks.push({
        id: "genki_kanji",
        label: `Genki Online — L${lesson} kanji recognition drills`,
        resource: "Genki Online (genki.japantimes.co.jp)",
        duration: "8–10 min",
        note: `Run kanji recognition + reading exercises for Lesson ${lesson}`,
        color: C.gossamer,
        category: "kanji",
      });
    } else if (dow === 2) {
      // Tuesday — reinforce kanji
      tasks.push({
        id: "utp2",
        label: `Understanding through Pictures — L${lesson} kanji (review)`,
        resource: "Understanding through Pictures",
        duration: "5–8 min",
        note: `Revisit any kanji that felt shaky on Monday. ${lessonKanji.slice(8).join("、")}`,
        color: C.gossamer,
        category: "kanji",
      });
      tasks.push({
        id: "genki_vocab",
        label: `Genki Online — L${lesson} vocab + kanji drills`,
        resource: "Genki Online",
        duration: "15–20 min",
        note: `Vocab drills + kanji exercises. Catch-up buffer if needed.`,
        color: C.gossamer,
        category: "kanji",
      });
    }
    return tasks;
  }

  // ── POST-CLASS ──
  const rtkIdx = getRtkDayIndex(d);
  const rtkEntries = rtkIdx >= 0 && rtkIdx < RTK_ENTRIES.length ? RTK_ENTRIES[rtkIdx] : null;

  if (daysSinceWed === 1) {
    // Thursday — Textbook Part 1 + RTK
    if (rtkEntries) {
      tasks.push({
        id: "rtk",
        label: `RTK — Lesson 1, Day ${rtkIdx + 1} (${rtkEntries.length} kanji)`,
        resource: "Remembering the Kanji 1",
        duration: "15 min",
        note: `Write each with its keyword + story: ${rtkEntries.join("、")}`,
        color: C.daffodil,
        category: "rtk",
      });
    }
    tasks.push({
      id: "textbook1",
      label: `Genki Textbook — L${lesson} Grammar Part 1`,
      resource: "Genki I Textbook",
      duration: "25 min",
      note: lesson === 7
        ? "First ⅓ of class content: ~ています (ongoing actions), appearance descriptions"
        : "First ⅓ of class content: plain form verbs, short-form speech",
      color: C.gossamer,
      category: "textbook",
    });
  } else if (daysSinceWed === 2) {
    // Friday — Textbook Part 2 + UTP + Genki Online
    tasks.push({
      id: "utp3",
      label: `Understanding through Pictures — L${lesson} kanji (post-class review)`,
      resource: "Understanding through Pictures",
      duration: "5–8 min",
      note: "Revisit any kanji from this lesson that didn't click before class",
      color: C.gossamer,
      category: "kanji",
    });
    tasks.push({
      id: "genki_review",
      label: `Genki Online — L${lesson} kanji recognition + reading`,
      resource: "Genki Online",
      duration: "8–10 min",
      note: "Reinforce kanji now that you've heard them in class context",
      color: C.gossamer,
      category: "kanji",
    });
    if (rtkEntries) {
      tasks.push({
        id: "rtk",
        label: `RTK — Lesson 1, Day ${rtkIdx + 1} (${rtkEntries.length} kanji)`,
        resource: "Remembering the Kanji 1",
        duration: "15 min",
        note: `Write each with its keyword + story: ${rtkEntries.join("、")}`,
        color: C.daffodil,
        category: "rtk",
      });
    }
    tasks.push({
      id: "textbook2",
      label: `Genki Textbook — L${lesson} Grammar Part 2`,
      resource: "Genki I Textbook",
      duration: "20 min",
      note: lesson === 7
        ? "Middle section: ~ています (states/jobs), ~に行く/来る purpose"
        : "Middle section: ~と思います, ~と言っていました",
      color: C.gossamer,
      category: "textbook",
    });
  } else if (daysSinceWed >= 5 && dow === 1) {
    // Following Monday — Textbook Part 3 + Workbook
    if (rtkEntries) {
      tasks.push({
        id: "rtk",
        label: `RTK — Lesson 1, Day ${rtkIdx + 1} (${rtkEntries.length} kanji)`,
        resource: "Remembering the Kanji 1",
        duration: "15 min",
        note: `Write each with its keyword + story: ${rtkEntries.join("、")}`,
        color: C.daffodil,
        category: "rtk",
      });
    }
    tasks.push({
      id: "textbook3",
      label: `Genki Textbook — L${lesson} Grammar Part 3`,
      resource: "Genki I Textbook",
      duration: "20 min",
      note: lesson === 7
        ? "Final section: counters (何人), reading passage"
        : "Final section: ~ないでください, のが好き/上手, reading passage",
      color: C.gossamer,
      category: "textbook",
    });
    tasks.push({
      id: "workbook",
      label: `Genki Workbook — L${lesson} (one section)`,
      resource: "Genki I Workbook",
      duration: "20 min",
      note: `Complete one full section, flag wrong answers: ${workbook[0]}`,
      color: C.dreamy,
      category: "workbook",
    });
  }

  return tasks;
}

// ─── STORAGE ─────────────────────────────────────────────────────
const STORAGE_KEY = "jpStudyTracker_v4";

async function loadData() {
  try {
    const r = await window.storage.get(STORAGE_KEY);
    return r ? JSON.parse(r.value) : {};
  } catch { return {}; }
}

async function saveData(data) {
  try { await window.storage.set(STORAGE_KEY, JSON.stringify(data)); }
  catch (e) { console.error(e); }
}

// ─── APP ─────────────────────────────────────────────────────────
export default function App() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState(today);
  const [completions, setCompletions] = useState({});
  const [vacations, setVacations] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("day");

  useEffect(() => {
    loadData().then(d => {
      setCompletions(d.completions || {});
      setVacations(d.vacations || {});
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveData({ completions, vacations });
  }, [completions, vacations, loaded]);

  function dateKey(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function toggleTask(date, taskId) {
    const k = dateKey(date);
    setCompletions(prev => {
      const day = { ...(prev[k] || {}) };
      day[taskId] = !day[taskId];
      return { ...prev, [k]: day };
    });
  }
  function toggleVacation(date) {
    const k = dateKey(date);
    setVacations(prev => ({ ...prev, [k]: !prev[k] }));
  }
  function isVacation(date) { return !!vacations[dateKey(date)]; }
  function isComplete(date, taskId) { return !!(completions[dateKey(date)] || {})[taskId]; }
  function dayProgress(date) {
    const tasks = getTasksForDay(date);
    if (!tasks.length) return null;
    const done = tasks.filter(t => isComplete(date, t.id)).length;
    return { done, total: tasks.length };
  }

  function getWeekDays(date) {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const dow = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    return Array.from({ length: 5 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      return day;
    });
  }

  function moveWeek(dir) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(d);
  }

  const weekDays = getWeekDays(selectedDate);
  const selectedTasks = getTasksForDay(selectedDate);
  const selectedVacation = isVacation(selectedDate);
  const dow = selectedDate.getDay();
  const isWeekend = dow === 0 || dow === 6;

  function categoryLabel(cat) {
    return { srs:"SRS", kanji:"漢字", textbook:"Textbook", workbook:"Workbook", class:"Class", rtk:"RTK" }[cat] || cat;
  }
  function categoryBadgeColor(cat) {
    return { srs:C.pearl, kanji:C.gossamer, textbook:"#fff0e4", workbook:C.dreamy, class:C.dreamy, rtk:C.daffodil }[cat] || C.white;
  }
  function borderColor(cat) {
    return { srs:"#a8dfd8", kanji:C.dreamy, textbook:"#f0c8a0", workbook:"#e89898", class:"#e07878", rtk:"#d4c060" }[cat] || C.border;
  }

  const S = {
    app: { fontFamily:"'Georgia',serif", background:`linear-gradient(160deg,${C.daffodil} 0%,#fff 55%,${C.pearl} 100%)`, minHeight:"100vh", color:C.text },
    header: { background:C.mahogany, color:C.daffodil, padding:"16px 20px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 2px 10px rgba(100,60,30,0.25)" },
    title: { fontSize:"20px", fontWeight:"bold", margin:0, letterSpacing:"0.3px" },
    subtitle: { fontSize:"12px", color:C.dreamy, marginTop:"2px", fontStyle:"italic" },
    toggleBtn: (a) => ({ padding:"4px 14px", borderRadius:"20px", border:`1px solid ${a?C.daffodil:"rgba(255,255,255,0.35)"}`, background:a?C.daffodil:"transparent", color:a?C.mahogany:C.daffodil, cursor:"pointer", fontSize:"12px", fontFamily:"Georgia,serif", fontWeight:a?"bold":"normal" }),
    navRow: { display:"flex", justifyContent:"center", alignItems:"center", gap:"14px", padding:"10px 0 2px", background:"rgba(255,255,255,0.5)" },
    navBtn: { padding:"4px 14px", borderRadius:"20px", border:`1px solid ${C.border}`, background:C.white, color:C.mahogany, cursor:"pointer", fontSize:"12px", fontFamily:"Georgia,serif" },
    weekRow: { display:"flex", gap:"4px", padding:"8px 12px 10px", background:"rgba(255,255,255,0.55)", borderBottom:`1px solid ${C.border}`, overflowX:"auto" },
    chip: (sel, isToday, vac) => ({ flex:1, minWidth:"50px", padding:"7px 3px 5px", borderRadius:"10px", textAlign:"center", cursor:"pointer", border:sel?`2px solid ${C.mahogany}`:`1px solid ${C.border}`, background:vac?"#eee":sel?C.gossamer:isToday?C.daffodil:C.white, opacity:vac?0.55:1 }),
    chipDay: (isToday) => ({ fontSize:"9px", textTransform:"uppercase", letterSpacing:"0.6px", color:isToday?C.mahogany:C.muted, fontWeight:isToday?"bold":"normal" }),
    chipNum: (sel) => ({ fontSize:"16px", fontWeight:sel?"bold":"normal", color:sel?C.mahogany:C.text, lineHeight:1.2 }),
    dots: { display:"flex", justifyContent:"center", gap:"2px", marginTop:"3px", minHeight:"7px" },
    dot: (done, col) => ({ width:"5px", height:"5px", borderRadius:"50%", background:done?col:C.border }),
    body: { padding:"14px 16px" },
    dateHeader: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" },
    dateTitle: { fontSize:"17px", fontWeight:"bold", color:C.mahogany },
    vacBtn: (v) => ({ padding:"4px 12px", borderRadius:"20px", border:`1px solid ${v?"#bbb":C.dreamy}`, background:v?"#e4e4e4":C.gossamer, color:v?"#777":C.mahogany, cursor:"pointer", fontSize:"11px", fontFamily:"Georgia,serif" }),
    taskCard: (done) => ({ borderRadius:"10px", border:`1px solid ${C.border}`, marginBottom:"9px", background:done?"#f6f4f2":C.white, opacity:done?0.65:1, transition:"opacity 0.2s" }),
    taskRow: (cat) => ({ display:"flex", alignItems:"flex-start", gap:"10px", padding:"11px 12px 8px", borderLeft:`4px solid ${borderColor(cat)}`, cursor:"pointer", borderRadius:"0 8px 8px 0" }),
    checkbox: (done) => ({ width:"19px", height:"19px", borderRadius:"5px", border:`2px solid ${done?C.mahogany:C.border}`, background:done?C.mahogany:"white", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"1px", color:"white", fontSize:"12px" }),
    taskLabel: (done) => ({ fontSize:"13px", fontWeight:"bold", color:done?"#999":C.text, textDecoration:done?"line-through":"none", lineHeight:1.4 }),
    meta: { display:"flex", gap:"6px", flexWrap:"wrap", marginTop:"4px", alignItems:"center" },
    pill: (col) => ({ padding:"2px 8px", borderRadius:"10px", background:col, fontSize:"10px", color:C.mahogany, border:`1px solid ${C.border}` }),
    note: { fontSize:"12px", color:C.muted, fontStyle:"italic", padding:"0 12px 10px 41px", lineHeight:1.55 },
    empty: { textAlign:"center", padding:"36px 16px", color:C.muted, fontStyle:"italic", fontSize:"14px", lineHeight:1.8 },
    // week view
    wCard: (isToday) => ({ borderRadius:"10px", border:`1px solid ${isToday?C.mahogany:C.border}`, background:C.white, marginBottom:"10px", overflow:"hidden" }),
    wHead: (isToday) => ({ padding:"8px 14px", background:isToday?C.mahogany:C.daffodil, color:isToday?C.daffodil:C.mahogany, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }),
    wTitle: { fontSize:"14px", fontWeight:"bold" },
    wProg: { fontSize:"12px", fontStyle:"italic" },
    wTask: { display:"flex", gap:"8px", alignItems:"center", padding:"6px 14px", borderBottom:`1px solid ${C.border}`, cursor:"pointer" },
    wLabel: (done) => ({ fontSize:"13px", color:done?"#aaa":C.text, textDecoration:done?"line-through":"none", flex:1 }),
  };

  const dayNames = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  return (
    <div style={S.app}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.title}>日本語 Study Tracker</div>
          <div style={S.subtitle}>Genki I · L7–8 · SJJACC Level 4 · May 13–Jun 24</div>
        </div>
        <div style={{ display:"flex", gap:"6px" }}>
          <button style={S.toggleBtn(view==="day")} onClick={()=>setView("day")}>Day</button>
          <button style={S.toggleBtn(view==="week")} onClick={()=>setView("week")}>Week</button>
        </div>
      </div>

      {/* Nav */}
      <div style={S.navRow}>
        <button style={S.navBtn} onClick={()=>moveWeek(-1)}>← Prev</button>
        <span style={{ fontSize:"12px", color:C.muted, fontStyle:"italic" }}>Week of {formatDate(weekDays[0])}</span>
        <button style={S.navBtn} onClick={()=>moveWeek(1)}>Next →</button>
      </div>

      {/* Day chips */}
      <div style={S.weekRow}>
        {weekDays.map(day => {
          const sel = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const vac = isVacation(day);
          const tasks = getTasksForDay(day);
          const prog = dayProgress(day);
          return (
            <div key={day.toISOString()} style={S.chip(sel,isToday,vac)} onClick={()=>{setSelectedDate(day);setView("day");}}>
              <div style={S.chipDay(isToday)}>{dayNames[day.getDay()]}</div>
              <div style={S.chipNum(sel)}>{day.getDate()}</div>
              <div style={S.dots}>
                {prog ? tasks.map((t,i) => (
                  <div key={i} style={S.dot(isComplete(day,t.id), borderColor(t.category))} />
                )) : <div style={{width:"5px",height:"5px"}} />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div style={S.body}>
        {view === "day" ? (
          <>
            <div style={S.dateHeader}>
              <div style={S.dateTitle}>{formatDate(selectedDate)}</div>
              <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                {!isWeekend && (() => {
                  const prog = dayProgress(selectedDate);
                  return prog ? (
                    <span style={{ fontSize:"12px", color:C.muted }}>
                      {prog.done}/{prog.total}{prog.done===prog.total&&prog.total>0?" 🌸":""}
                    </span>
                  ) : null;
                })()}
                {!isWeekend && (
                  <button style={S.vacBtn(selectedVacation)} onClick={()=>toggleVacation(selectedDate)}>
                    {selectedVacation ? "✓ Vacation" : "Vacation Day"}
                  </button>
                )}
              </div>
            </div>

            {isWeekend ? (
              <div style={S.empty}>🌸 Weekend — rest up!<br/><span style={{fontSize:"13px"}}>No tasks scheduled.</span></div>
            ) : selectedVacation ? (
              <div style={S.empty}>
                ✈️ Vacation Day<br/>
                <span style={{fontSize:"13px",color:"#bbb"}}>Nothing is rescheduled. Pick up where you left off tomorrow.</span>
              </div>
            ) : selectedTasks.length === 0 ? (
              <div style={S.empty}>No tasks scheduled today.<br/><span style={{fontSize:"12px"}}>Tasks follow your Wednesday class cycle.</span></div>
            ) : (
              selectedTasks.map(task => {
                const done = isComplete(selectedDate, task.id);
                return (
                  <div key={task.id} style={S.taskCard(done)}>
                    <div style={S.taskRow(task.category)} onClick={()=>toggleTask(selectedDate,task.id)}>
                      <div style={S.checkbox(done)}>{done?"✓":""}</div>
                      <div style={{flex:1}}>
                        <div style={S.taskLabel(done)}>{task.label}</div>
                        <div style={S.meta}>
                          <span style={S.pill(categoryBadgeColor(task.category))}>{categoryLabel(task.category)}</span>
                          <span style={S.pill(C.daffodil)}>{task.duration}</span>
                          <span style={{fontSize:"10px",color:C.muted,fontStyle:"italic"}}>{task.resource}</span>
                        </div>
                      </div>
                    </div>
                    {task.note && <div style={S.note}>{task.note}</div>}
                  </div>
                );
              })
            )}
          </>
        ) : (
          weekDays.map(day => {
            const isToday = isSameDay(day, today);
            const tasks = getTasksForDay(day);
            const vac = isVacation(day);
            const prog = dayProgress(day);
            return (
              <div key={day.toISOString()} style={S.wCard(isToday)}>
                <div style={S.wHead(isToday)} onClick={()=>{setSelectedDate(day);setView("day");}}>
                  <div style={S.wTitle}>{formatDate(day)}{isToday?" · Today":""}</div>
                  <div style={S.wProg}>{vac?"✈️ Vacation":prog?`${prog.done}/${prog.total} done`:"—"}</div>
                </div>
                {!vac && tasks.map(task => {
                  const done = isComplete(day, task.id);
                  return (
                    <div key={task.id} style={S.wTask} onClick={()=>toggleTask(day,task.id)}>
                      <div style={S.checkbox(done)}>{done?"✓":""}</div>
                      <div style={S.wLabel(done)}>{task.label}</div>
                      <span style={S.pill(categoryBadgeColor(task.category))}>{task.duration}</span>
                    </div>
                  );
                })}
                {vac && <div style={{padding:"8px 14px",fontSize:"12px",color:"#bbb",fontStyle:"italic"}}>Vacation — no tasks counted</div>}
                {!vac && tasks.length===0 && <div style={{padding:"8px 14px",fontSize:"12px",color:C.muted,fontStyle:"italic"}}>No tasks scheduled</div>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
