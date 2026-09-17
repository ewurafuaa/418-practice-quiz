import React, { useState, useEffect, useMemo, useCallback } from "react";
import { chapter3 } from "./data/chapter3";
import { chapter4 } from "./data/chapter4";
import { chapter5 } from "./data/chapter5";
import { chapter7 } from "./data/chapter7";
import { chapter8 } from "./data/chapter8";
import { chapter9 } from "./data/chapter9";
import { chapter10 } from "./data/chapter10";
import { chapter13 } from "./data/chapter13";

const CHAPTERS = [chapter3, chapter4, chapter5, chapter7, chapter8, chapter9, chapter10, chapter13];

/* ----------------------------- bank ---------------------------- */

const SECTION_KINDS = { tf: "tf", mcq: "mcq", fib: "fib", fib2: "fib" };

function buildBank() {
  const out = [];
  const problems = [];

  CHAPTERS.forEach((ch) => {
    Object.keys(SECTION_KINDS).forEach((section) => {
      const kind = SECTION_KINDS[section];
      (ch[section] || []).forEach((row) => {
        const [id, text] = row;
        const where = `${ch.id} / ${section} / Q${id}`;

        if (typeof text !== "string") {
          problems.push(`${where}: question text is missing or not a string`);
          return;
        }
        const base = { key: ch.id + "-" + id, id, chapter: ch.id, section, kind, text };

        if (kind === "tf") {
          if (row[2] !== 0 && row[2] !== 1) {
            problems.push(`${where}: answer must be 0 or 1, got ${JSON.stringify(row[2])}`);
            return;
          }
          out.push({ ...base, answer: row[2], note: row[3] || "" });

        } else if (kind === "mcq") {
          if (!Array.isArray(row[2]) || row[2].length < 2) {
            problems.push(`${where}: options must be an array of at least 2 items`);
            return;
          }
          if (typeof row[3] !== "number" || row[3] < 0 || row[3] >= row[2].length) {
            problems.push(`${where}: correct index ${JSON.stringify(row[3])} is out of range`);
            return;
          }
          out.push({ ...base, options: row[2], correct: row[3], note: row[4] || "" });

        } else {
          if (!Array.isArray(row[2]) || row[2].length === 0) {
            problems.push(`${where}: answers must be a non-empty array`);
            return;
          }
          const blanks = (text.match(/___/g) || []).length;
          if (blanks !== row[2].length) {
            problems.push(`${where}: ${blanks} blank(s) but ${row[2].length} answer(s)`);
          }
          out.push({ ...base, answers: row[2], note: row[3] || "" });
        }
      });
    });
  });

  if (problems.length) {
    console.warn(
      `Skipped or flagged ${problems.length} malformed question(s):\n` + problems.join("\n")
    );
  }
  return out;
}
const BANK = buildBank();
const chapterOf = (id) => CHAPTERS.find((c) => c.id === id);

/* ---------------------------- theme ---------------------------- */

const C = {
  void: "#060811",
  ground: "#060811",
  panel: "rgba(255,255,255,0.05)",
  ink: "#E9EDFA",          // primary text
  body: "#C3CCE6",         // body text
  muted: "#8E9CBE",
  faint: "#66739A",
  line: "rgba(168,185,230,0.14)",
  lineSoft: "rgba(168,185,230,0.08)",
  hairStrong: "rgba(168,185,230,0.30)",
  gold: "#35D0EE",         // accent (cyan end of the gradient)
  goldSoft: "rgba(53,208,238,0.14)",
  violet: "#6E5BFF",
  ok: "#3DDC97",
  okSoft: "rgba(61,220,151,0.13)",
  bad: "#FF6B81",
  badSoft: "rgba(255,107,129,0.13)",
};

const ACCENT = `linear-gradient(120deg, ${C.violet}, ${C.gold})`;

const DISPLAY = "'Inter var','Inter','SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";
const SANS = DISPLAY;
const MONO = "'SFMono-Regular','JetBrains Mono',Menlo,Consolas,'Liberation Mono',monospace";

// frosted panel; level 2 sits nearer the light
const glass = (level = 1, radius = 18) => ({
  background: level === 2
    ? "linear-gradient(160deg, rgba(255,255,255,0.11), rgba(255,255,255,0.035))"
    : "linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.022))",
  border: `1px solid ${C.line}`,
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  boxShadow: "0 28px 60px -34px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.07)",
  borderRadius: radius,
});

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .glass { background: rgba(14,18,36,0.94) !important; }
  }
  button, input { font: inherit; }
  button:focus-visible, input:focus-visible {
    outline: 2px solid ${C.gold}; outline-offset: 3px; border-radius: 6px;
  }
  .press { transition: transform 120ms ease, background 160ms ease, border-color 160ms ease, box-shadow 160ms ease; }
  .press:hover:not(:disabled) { border-color: ${C.hairStrong}; }
  .press:active:not(:disabled) { transform: translateY(1px); }
  .lift { transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease; }
  .lift:hover { border-color: ${C.hairStrong}; transform: translateY(-2px);
    box-shadow: 0 36px 70px -34px rgba(0,0,0,1), inset 0 1px 0 rgba(255,255,255,0.12); }
  .opt { transition: background 140ms ease, border-color 140ms ease; }
  .opt:hover:not(:disabled) { background: rgba(255,255,255,0.075); }
  input::placeholder { color: ${C.faint}; }
  ::selection { background: rgba(110,91,255,0.45); color: #fff; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

/* --------------------------- helpers --------------------------- */

const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/\u00D7/g, "x")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019']/g, "")
    .replace(/[()]/g, " ")
    .replace(/[-_]/g, " ")
    .replace(/[.,;:!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

function fibMatch(input, expected) {
  const given = norm(input);
  if (!given) return false;
  for (const alt of String(expected).split("|")) {
    const full = norm(alt);
    const noParen = norm(alt.replace(/\(.*?\)/g, ""));
    const inParen = (alt.match(/\((.*?)\)/) || [])[1];
    if (given === full || given === noParen) return true;
    if (inParen && given === norm(inParen)) return true;
  }
  return false;
}

const firstAnswer = (a) => String(a).split("|")[0];

function rngFrom(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dedupe(list) {
  const seen = new Set();
  return list.filter((q) => {
    const k = q.chapter + "|" + q.kind + "|" + norm(q.text);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const store = {
  async get(key) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const r = await window.storage.get(key, false);
        return r ? JSON.parse(r.value) : null;
      }
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    try {
      if (typeof window !== "undefined" && window.storage) {
        await window.storage.set(key, JSON.stringify(value), false);
        return;
      }
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* keep going without saving */
    }
  },
};

const pad = (n) => String(n).padStart(2, "0");
const clockText = (secs) => `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`;
const SECTION_LABELS = {};
CHAPTERS.forEach((ch) => ch.sections.forEach((s) => { SECTION_LABELS[s.id] = s.label; }));
const sectionLabel = (id) => SECTION_LABELS[id] || id;

/* ------------------------- small pieces ------------------------ */

function BitStrip({ marks, current, onJump, compact }) {
  const cell = compact ? 8 : 11;
  return (
    <div className="flex flex-wrap" style={{ gap: 2 }}>
      {marks.map((m, i) => {
        const bg = m === "correct" ? C.ok : m === "wrong" ? C.bad
          : m === "done" ? "rgba(168,185,230,0.55)" : "rgba(255,255,255,0.08)";
        const lit = m === "correct" || m === "wrong";
        return (
          <button
            key={i}
            onClick={onJump ? () => onJump(i) : undefined}
            aria-label={`Question ${i + 1}`}
            style={{
              width: cell, height: cell, background: bg, borderRadius: 2,
              outline: i === current ? `1.5px solid ${C.gold}` : "none",
              outlineOffset: 2, cursor: onJump ? "pointer" : "default",
              border: "none", padding: 0,
              boxShadow: i === current ? `0 0 12px ${C.gold}` : lit ? `0 0 8px ${bg}55` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

function Button({ children, onClick, tone = "solid", size = "md", disabled, style, full }) {
  const base = {
    fontFamily: SANS, fontWeight: 500, borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
    transition: "background 120ms, border-color 120ms", width: full ? "100%" : undefined,
  };
  const sizes = {
    sm: { padding: "6px 12px", fontSize: 13 },
    md: { padding: "10px 18px", fontSize: 15 },
    lg: { padding: "14px 24px", fontSize: 16 },
  };
  const tones = {
    solid: {
      background: "linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.05))",
      color: C.ink, border: `1px solid ${C.hairStrong}`,
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    },
    gold: {
      background: ACCENT, color: "#07091A", border: "1px solid transparent", fontWeight: 600,
      boxShadow: "0 14px 34px -16px rgba(110,91,255,0.9)",
    },
    quiet: { background: "rgba(255,255,255,0.035)", color: C.body, border: `1px solid ${C.line}` },
    ghost: { background: "transparent", color: C.muted, border: "1px solid transparent" },
  };
  return (
    <button className="press" onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ ...base, ...sizes[size], ...tones[tone], ...style }}>
      {children}
    </button>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button className="press" onClick={onClick} style={{
      fontFamily: SANS, fontSize: 14, padding: "8px 14px", borderRadius: 999, cursor: "pointer",
      background: active ? "rgba(110,91,255,0.26)" : "rgba(255,255,255,0.035)",
      color: active ? C.ink : C.muted,
      border: `1px solid ${active ? "rgba(140,124,255,0.62)" : C.line}`,
      boxShadow: active ? "0 10px 26px -16px rgba(110,91,255,0.9)" : "none",
    }}>{children}</button>
  );
}

function Tag({ children, color = C.muted, bg = "transparent" }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 11, letterSpacing: 0.4, color, background: bg,
      border: `1px solid ${C.lineSoft}`, padding: "3px 8px", borderRadius: 999,
    }}>{children}</span>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: C.ink, margin: 0 }}>{label}</h2>
      {hint && <p style={{ fontFamily: SANS, fontSize: 13, color: C.muted, margin: "4px 0 0" }}>{hint}</p>}
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button onClick={() => onChange(!on)} className="flex items-center"
      style={{ gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer" }}>
      <span style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? ACCENT : "rgba(255,255,255,0.10)",
        border: `1px solid ${on ? "transparent" : C.line}`,
        position: "relative", transition: "background 150ms", flexShrink: 0,
      }}>
        <span style={{
          position: "absolute", top: 2, left: on ? 20 : 2, width: 20, height: 20,
          borderRadius: 10, background: on ? "#0A0D1C" : "#C3CCE6", transition: "left 150ms",
        }} />
      </span>
      <span style={{ fontFamily: SANS, fontSize: 14, color: C.body }}>{label}</span>
    </button>
  );
}

function FibSentence({ text, render }) {
  const parts = text.split("___");
  return (
    <span>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {p}
          {i < parts.length - 1 ? render(i) : null}
        </React.Fragment>
      ))}
    </span>
  );
}

/* ---------------------------- screens -------------------------- */

function Home({ onPick, stats }) {
  const grid = Array.from({ length: 64 }, (_, i) => i);
  const litCount = Math.round((stats.knownCount / BANK.length) * 64);
  return (
    <div className="mx-auto px-6 py-12" style={{ maxWidth: 900 }}>
      <div className="flex flex-col md:flex-row md:items-end" style={{ gap: 40 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: MONO, fontSize: 12, color: C.gold, marginBottom: 14 }}>
            {CHAPTERS.length} chapters, {BANK.length} questions
          </p>
          <h1 style={{ fontFamily: DISPLAY, fontSize: 48, fontWeight: 600, lineHeight: 1.04,
            color: C.ink, letterSpacing: -1.6, margin: 0 }}>
            DCIT418 Practice Questions
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.6, color: C.muted, marginTop: 16, maxWidth: "60ch" }}>
            Read through with the answers in view, or sit a timed test and find out what actually stuck.
          </p>
        </div>
        <div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(8, 14px)", gap: 3 }} aria-hidden="true">
            {grid.map((i) => (
              <div key={i} style={{
                width: 14, height: 14, borderRadius: 3,
                background: i < litCount ? ACCENT : "rgba(255,255,255,0.06)",
                border: `1px solid ${i < litCount ? "transparent" : C.lineSoft}`,
                boxShadow: i < litCount ? "0 0 14px rgba(90,120,255,0.5)" : "none",
              }} />
            ))}
          </div>
          <p style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 10 }}>
            {stats.knownCount} of {BANK.length} marked as known
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2" style={{ gap: 20, marginTop: 48 }}>
        <ModeCard title="Learning mode"
          lead="Every question with its answer and the reason behind it. Move at your own pace and tick off what you know."
          action="Start learning" onClick={() => onPick("learn")} />
        <ModeCard title="Exam mode"
          lead="Answer first, see the result after. Questions and options come up shuffled, and you get a score and a list of what you missed."
          action="Start a test" onClick={() => onPick("exam")} accent />
      </div>

      {stats.history.length > 0 && (
        <div style={{ marginTop: 44 }}>
          <h2 style={{ fontFamily: SANS, fontSize: 14, color: C.ink, marginBottom: 12 }}>Recent tests</h2>
          <div style={{ borderTop: `1px solid ${C.lineSoft}` }}>
            {stats.history.slice(0, 5).map((h, i) => (
              <div key={i} className="flex items-center justify-between"
                style={{ padding: "12px 0", borderBottom: `1px solid ${C.lineSoft}` }}>
                <span style={{ fontFamily: SANS, fontSize: 14, color: C.body }}>
                  Chapter {h.chapterNumber}, {h.sections.map(sectionLabel).join(", ").toLowerCase()}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 13, color: C.ink }}>
                  {h.score}/{h.total}
                  <span style={{ color: C.muted }}>{"  "}{Math.round((h.score / h.total) * 100)}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModeCard({ title, lead, action, onClick, accent }) {
  return (
    <div className="glass" style={{
      ...glass(accent ? 2 : 1, 20), padding: 28, display: "flex", flexDirection: "column",
      borderColor: accent ? "rgba(110,91,255,0.45)" : C.line,
    }}>
      <h2 style={{ fontFamily: DISPLAY, fontSize: 25, fontWeight: 600, letterSpacing: -0.5, color: C.ink, margin: 0 }}>{title}</h2>
      <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.6, color: C.muted, margin: "12px 0 24px", flex: 1 }}>{lead}</p>
      <Button onClick={onClick} tone={accent ? "gold" : "solid"} size="lg" full>{action}</Button>
    </div>
  );
}

function ChapterPicker({ mode, onBack, onPick, known }) {
  return (
    <div className="mx-auto px-6 py-10" style={{ maxWidth: 760 }}>
      <Button tone="ghost" size="sm" onClick={onBack} style={{ paddingLeft: 0 }}>Back</Button>
      <h1 style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 600, letterSpacing: -1, color: C.ink, margin: "16px 0 6px" }}>Pick a chapter</h1>
      <p style={{ fontFamily: SANS, fontSize: 15, color: C.muted, marginBottom: 32 }}>
        {mode === "learn" ? "You can filter down to sections on the next screen." : "Test length and feedback come next."}
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        {CHAPTERS.map((ch) => {
          const qs = BANK.filter((q) => q.chapter === ch.id);
          const knownHere = qs.filter((q) => known.includes(q.key)).length;
          return (
            <button key={ch.id} onClick={() => onPick(ch)}
              className="glass lift flex items-center justify-between" style={{
                ...glass(1, 20), padding: "22px 24px", cursor: "pointer",
                textAlign: "left", gap: 20, width: "100%", color: "inherit",
              }}>
              <span>
                <span style={{ fontFamily: MONO, fontSize: 12, color: C.gold }}>Chapter {ch.number}</span>
                <span style={{ display: "block", fontFamily: DISPLAY, fontSize: 21, fontWeight: 600, letterSpacing: -0.4, color: C.ink, margin: "6px 0 8px" }}>
                  {ch.title}
                </span>
                <span style={{ fontFamily: SANS, fontSize: 14, color: C.muted }}>
                  {qs.length} questions, {knownHere} marked as known
                </span>
              </span>
              <span style={{ fontFamily: MONO, fontSize: 12, color: C.gold, whiteSpace: "nowrap" }}>{ch.sections.length} sections</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Setup({ mode, chapter, onBack, onStart, saved }) {
  const initial = saved && saved.chapter === chapter.id ? saved : null;
  const [sections, setSections] = useState(initial?.sections || chapter.sections.map((s) => s.id));
  const [count, setCount] = useState(initial?.count ?? 20);
  const [instant, setInstant] = useState(initial?.instant ?? true);
  const [timed, setTimed] = useState(initial?.timed ?? false);
  const [skipRepeats, setSkipRepeats] = useState(initial?.skipRepeats ?? true);
  const [shuffled, setShuffled] = useState(initial?.shuffled ?? false);
  const [hideAnswers, setHideAnswers] = useState(initial?.hideAnswers ?? false);

  const toggleSection = (id) =>
    setSections((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const pool = useMemo(() => {
    let list = BANK.filter((q) => q.chapter === chapter.id && sections.includes(q.section));
    if (skipRepeats) list = dedupe(list);
    return list;
  }, [sections, skipRepeats, chapter.id]);

  const counts = useMemo(() => {
    const m = {};
    chapter.sections.forEach((s) => {
      const all = BANK.filter((q) => q.chapter === chapter.id && q.section === s.id);
      m[s.id] = { all: all.length, unique: dedupe(all).length };
    });
    return m;
  }, [chapter.id]);

  const lengths = [10, 20, 40, 0];
  const canStart = sections.length > 0 && pool.length > 0;

  return (
    <div className="mx-auto px-6 py-10" style={{ maxWidth: 760 }}>
      <Button tone="ghost" size="sm" onClick={onBack} style={{ paddingLeft: 0 }}>All chapters</Button>

      <h1 style={{ fontFamily: DISPLAY, fontSize: 34, fontWeight: 600, letterSpacing: -1, color: C.ink, margin: "16px 0 6px" }}>
        {mode === "learn" ? "Set up your reading" : "Set up your test"}
      </h1>
      <p style={{ fontFamily: SANS, fontSize: 15, color: C.muted, marginBottom: 32 }}>
        Chapter {chapter.number}: {chapter.title}
      </p>

      <Field label="Which sections?">
        <div className="flex flex-wrap" style={{ gap: 10 }}>
          {chapter.sections.map((s) => (
            <Chip key={s.id} active={sections.includes(s.id)} onClick={() => toggleSection(s.id)}>
              {s.label}
              <span style={{ fontFamily: MONO, fontSize: 11, marginLeft: 8, opacity: 0.7 }}>
                {skipRepeats ? counts[s.id].unique : counts[s.id].all}
              </span>
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Repeated questions"
        hint="The bank repeats a lot of items word for word, especially in the later sections.">
        <Toggle on={skipRepeats} onChange={setSkipRepeats}
          label={skipRepeats ? "Showing each question once" : "Showing all questions, repeats included"} />
      </Field>

      {mode === "exam" ? (
        <>
          <Field label="How many questions?">
            <div className="flex flex-wrap" style={{ gap: 10 }}>
              {lengths.map((n) => (
                <Chip key={n} active={count === n} onClick={() => setCount(n)}>
                  {n === 0 ? `All ${pool.length}` : n}
                </Chip>
              ))}
            </div>
          </Field>
          <Field label="When do you want the answer?">
            <div className="flex flex-wrap" style={{ gap: 10 }}>
              <Chip active={instant} onClick={() => setInstant(true)}>Right after each question</Chip>
              <Chip active={!instant} onClick={() => setInstant(false)}>At the end</Chip>
            </div>
          </Field>
          <Field label="Timer">
            <Toggle on={timed} onChange={setTimed} label={timed ? "Counting up" : "No timer"} />
          </Field>
        </>
      ) : (
        <>
          <Field label="Order">
            <div className="flex flex-wrap" style={{ gap: 10 }}>
              <Chip active={!shuffled} onClick={() => setShuffled(false)}>Question order</Chip>
              <Chip active={shuffled} onClick={() => setShuffled(true)}>Shuffled</Chip>
            </div>
          </Field>
          <Field label="Answers" hint="Hide them if you want to guess first, then reveal.">
            <Toggle on={hideAnswers} onChange={setHideAnswers}
              label={hideAnswers ? "Hidden until you reveal" : "Shown with each question"} />
          </Field>
        </>
      )}

      <div className="flex items-center justify-between"
        style={{ marginTop: 36, paddingTop: 24, borderTop: `1px solid ${C.lineSoft}` }}>
        <span style={{ fontFamily: MONO, fontSize: 13, color: C.muted }}>{pool.length} questions available</span>
        <Button size="lg" tone={mode === "exam" ? "gold" : "solid"} disabled={!canStart}
          onClick={() => onStart({
            chapter: chapter.id, sections, count, instant, timed, skipRepeats, shuffled, hideAnswers,
          })}>
          {mode === "exam" ? "Start test" : "Start learning"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------ learning mode ------------------------ */

function Learn({ config, onExit, known, flagged, toggleKnown, toggleFlag }) {
  const [filter, setFilter] = useState("all");
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(!config.hideAnswers);
  const [query, setQuery] = useState("");
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));

  const list = useMemo(() => {
    let l = BANK.filter((q) => q.chapter === config.chapter && config.sections.includes(q.section));
    if (config.skipRepeats) l = dedupe(l);
    if (filter === "unknown") l = l.filter((q) => !known.includes(q.key));
    if (filter === "flagged") l = l.filter((q) => flagged.includes(q.key));
    if (query.trim()) {
      const t = query.toLowerCase();
      l = l.filter((q) => q.text.toLowerCase().includes(t));
    }
    if (config.shuffled) l = shuffle(l, rngFrom(seed));
    return l;
  }, [config, filter, known, flagged, query, seed]);

  useEffect(() => { setIdx(0); }, [filter, query]);
  useEffect(() => { setRevealed(!config.hideAnswers); }, [idx, config.hideAnswers]);

  const q = list[Math.min(idx, list.length - 1)];

  const go = useCallback(
    (d) => setIdx((i) => Math.min(Math.max(i + d, 0), Math.max(list.length - 1, 0))),
    [list.length]
  );

  // Mark known / flag, then move on to the next question automatically.
  const handleToggleKnown = useCallback((key) => {
    toggleKnown(key);
    go(1);
  }, [toggleKnown, go]);

  const handleToggleFlag = useCallback((key) => {
    toggleFlag(key);
    go(1);
  }, [toggleFlag, go]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === " ") { e.preventDefault(); setRevealed((r) => !r); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!q) {
    return (
      <div className="mx-auto px-6 py-16 text-center" style={{ maxWidth: 620 }}>
        <p style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, letterSpacing: -0.5, color: C.ink }}>Nothing matches those filters.</p>
        <p style={{ fontFamily: SANS, fontSize: 15, color: C.muted, marginTop: 8 }}>
          Clear the search or switch back to all questions.
        </p>
        <div className="flex justify-center" style={{ gap: 10, marginTop: 20 }}>
          <Button tone="quiet" onClick={() => { setFilter("all"); setQuery(""); }}>Show all</Button>
          <Button onClick={onExit}>Back to setup</Button>
        </div>
      </div>
    );
  }

  const isKnown = known.includes(q.key);
  const isFlagged = flagged.includes(q.key);

  return (
    <div className="mx-auto px-6 py-8" style={{ maxWidth: 820 }}>
      <div className="flex flex-wrap items-center justify-between" style={{ gap: 12 }}>
        <Button tone="ghost" size="sm" onClick={onExit} style={{ paddingLeft: 0 }}>Setup</Button>
        <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
          {["all", "unknown", "flagged"].map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "unknown" ? "Not yet known" : "Flagged"}
            </Chip>
          ))}
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions"
            style={{
              fontFamily: SANS, fontSize: 14, padding: "8px 14px", borderRadius: 999,
              border: `1px solid ${C.line}`, background: "rgba(255,255,255,0.04)",
              color: C.ink, width: 180, outline: "none",
            }} />
        </div>
      </div>

      <div style={{ margin: "18px 0 14px" }}>
        <BitStrip compact marks={list.map((item) => (known.includes(item.key) ? "correct" : "todo"))}
          current={idx} onJump={setIdx} />
      </div>

      <div className="glass" style={{ ...glass(1, 20), padding: 28 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <Tag color={C.gold}>Q{q.id}</Tag>
            <Tag>{sectionLabel(q.section)}</Tag>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>{idx + 1} of {list.length}</span>
        </div>

        <p style={{ fontFamily: DISPLAY, fontSize: 21, lineHeight: 1.62, color: C.ink, margin: 0, maxWidth: "60ch" }}>
          {q.kind === "fib" ? (
            <FibSentence text={q.text} render={(i) =>
              revealed ? (
                <span style={{
                  fontFamily: MONO, fontSize: 18, color: C.gold, padding: "1px 7px",
                  background: C.goldSoft, borderRadius: 7,
                  border: "1px solid rgba(53,208,238,0.35)",
                }}>{firstAnswer(q.answers[i])}</span>
              ) : (
                <span style={{ color: C.muted }}>______</span>
              )
            } />
          ) : q.text}
        </p>

        {!revealed && (
          <div style={{ marginTop: 24 }}>
            <Button tone="quiet" onClick={() => setRevealed(true)}>Reveal answer</Button>
            <span style={{ fontFamily: SANS, fontSize: 13, color: C.muted, marginLeft: 12 }}>or press space</span>
          </div>
        )}

        {revealed && (
          <div style={{ marginTop: 22 }}>
            {q.kind === "tf" && (
              <div style={{
                display: "inline-block", background: q.answer ? C.okSoft : C.badSoft,
                border: `1px solid ${q.answer ? "rgba(61,220,151,0.5)" : "rgba(255,107,129,0.5)"}`,
                color: q.answer ? C.ok : C.bad, fontFamily: SANS, fontWeight: 600,
                fontSize: 15, padding: "9px 18px", borderRadius: 999,
              }}>{q.answer ? "True" : "False"}</div>
            )}

            {q.kind === "mcq" && (
              <div style={{ display: "grid", gap: 8 }}>
                {q.options.map((opt, i) => {
                  const right = i === q.correct;
                  return (
                    <div key={i} style={{
                      display: "flex", gap: 12, padding: "11px 15px", borderRadius: 12,
                      background: right ? C.okSoft : "rgba(255,255,255,0.03)",
                      border: `1px solid ${right ? "rgba(61,220,151,0.5)" : C.lineSoft}`,
                    }}>
                      <span style={{ fontFamily: MONO, fontSize: 13, color: right ? C.ok : C.muted, paddingTop: 2 }}>
                        {"ABCD"[i]}
                      </span>
                      <span style={{
                        fontFamily: SANS, fontSize: 15, color: right ? C.ok : C.body,
                        fontWeight: right ? 600 : 400,
                      }}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {q.note && (
              <p style={{
                fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: C.muted, marginTop: 16,
                maxWidth: "68ch", borderLeft: `2px solid rgba(53,208,238,0.45)`, paddingLeft: 14,
              }}>{q.note}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between" style={{ gap: 12, marginTop: 18 }}>
        <div className="flex" style={{ gap: 8 }}>
          <Button tone="quiet" onClick={() => go(-1)} disabled={idx === 0}>Previous</Button>
          <Button onClick={() => go(1)} disabled={idx >= list.length - 1}>Next</Button>
        </div>
        <div className="flex" style={{ gap: 8 }}>
          <Button size="sm" tone="quiet" onClick={() => handleToggleFlag(q.key)}
            style={isFlagged ? { borderColor: C.gold, color: C.gold, background: C.goldSoft } : undefined}>
            {isFlagged ? "Flagged" : "Flag this"}
          </Button>
          <Button size="sm" tone="quiet" onClick={() => handleToggleKnown(q.key)}
            style={isKnown ? { borderColor: C.ok, color: C.ok, background: C.okSoft } : undefined}>
            {isKnown ? "Known" : "Mark as known"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------- exam mode -------------------------- */

function buildExam(config, only) {
  let list = only || BANK.filter((q) => q.chapter === config.chapter && config.sections.includes(q.section));
  if (!only && config.skipRepeats) list = dedupe(list);
  list = shuffle(list);
  if (!only && config.count > 0) list = list.slice(0, config.count);
  return list.map((q) => {
    if (q.kind !== "mcq") return { ...q, order: null };
    return { ...q, order: shuffle(q.options.map((_, i) => i)) };
  });
}

function Exam({ config, questions, onFinish, onExit }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState({});
  const [draft, setDraft] = useState([]);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!config.timed) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [config.timed]);

  const q = questions[idx];
  useEffect(() => {
    if (!q) return;
    setDraft(answers[q.key]?.value ?? (Array.isArray(q.answers) ? q.answers.map(() => "") : null));
  }, [idx]);

  const grade = (question, value) => {
    if (value === null || value === undefined) return false;
    if (question.kind === "tf") return value === question.answer;
    if (question.kind === "mcq") return value === question.correct;
    return Array.isArray(question.answers)
      && question.answers.every((a, i) => fibMatch(value[i], a));
  };

  const record = (value) => {
    const correct = grade(q, value);
    setAnswers((a) => ({ ...a, [q.key]: { value, correct } }));
    if (config.instant) setChecked((c) => ({ ...c, [q.key]: true }));
    return correct;
  };

  const answered = answers[q.key];
  const showResult = config.instant && checked[q.key];

  const next = () => {
    if (idx < questions.length - 1) setIdx(idx + 1);
    else finish();
  };

  const finish = () => {
    const results = questions.map((qq) => ({
      q: qq,
      given: answers[qq.key]?.value ?? null,
      correct: answers[qq.key]?.correct ?? false,
    }));
    onFinish({ results, seconds });
  };

  const submitFib = () => record(Array.isArray(draft) ? draft.slice() : []);

  useEffect(() => {
    const onKey = (e) => {
      if (!q) return;
      if (e.target.tagName === "INPUT") {
        if (e.key === "Enter" && q.kind === "fib" && !showResult) submitFib();
        return;
      }
      if (showResult || answered?.value !== undefined) {
        if (e.key === "Enter") next();
      }
      if (q.kind === "tf" && !showResult) {
        if (e.key.toLowerCase() === "t") record(1);
        if (e.key.toLowerCase() === "f") record(0);
      }
      if (q.kind === "mcq" && !showResult && Array.isArray(q.order) && "1234".includes(e.key)) {
        const pick = q.order[Number(e.key) - 1];
        if (pick !== undefined) record(pick);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const marks = questions.map((qq) => {
    const a = answers[qq.key];
    if (!a) return "todo";
    return config.instant ? (a.correct ? "correct" : "wrong") : "done";
  });

  const answeredCount = Object.keys(answers).length;
  const correctCount = Object.values(answers).filter((a) => a.correct).length;

  if (!q) return null;

  return (
    <div className="mx-auto px-6 py-8" style={{ maxWidth: 820 }}>
      <div className="flex flex-wrap items-center justify-between" style={{ gap: 12 }}>
        <Button tone="ghost" size="sm" onClick={onExit} style={{ paddingLeft: 0 }}>Leave test</Button>
        <div className="flex items-center" style={{ gap: 16 }}>
          {config.timed && <span style={{ fontFamily: MONO, fontSize: 14, color: C.body }}>{clockText(seconds)}</span>}
          {config.instant && answeredCount > 0 && (
            <span style={{ fontFamily: MONO, fontSize: 14, color: C.body }}>{correctCount}/{answeredCount}</span>
          )}
          <Button size="sm" tone="quiet" onClick={finish}>Finish now</Button>
        </div>
      </div>

      <div style={{ margin: "18px 0 14px" }}>
        <BitStrip compact marks={marks} current={idx} onJump={setIdx} />
      </div>

      <div className="glass" style={{ ...glass(1, 20), padding: 28 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 18 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <Tag color={C.gold}>Q{q.id}</Tag>
            <Tag>{sectionLabel(q.section)}</Tag>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>{idx + 1} of {questions.length}</span>
        </div>

        <p style={{ fontFamily: DISPLAY, fontSize: 21, lineHeight: 1.62, color: C.ink, margin: "0 0 26px", maxWidth: "60ch" }}>
          {q.kind === "fib" ? (
            <FibSentence text={q.text} render={(i) => (
              <input value={draft[i] ?? ""} disabled={showResult} autoFocus={i === 0}
                onChange={(e) => {
                  const d = draft.slice();
                  d[i] = e.target.value;
                  setDraft(d);
                }}
                style={{
                  fontFamily: MONO, fontSize: 16, width: 152, padding: "4px 10px", margin: "0 5px",
                  color: C.ink, background: "rgba(255,255,255,0.05)", borderRadius: 8,
                  border: `1px solid ${C.hairStrong}`, outline: "none",
                }} />
            )} />
          ) : q.text}
        </p>

        {q.kind === "tf" && (
          <div className="flex" style={{ gap: 12 }}>
            {[1, 0].map((v) => {
              const picked = answered?.value === v;
              const isRight = v === q.answer;
              let bg = "transparent", bd = C.line, fg = C.body;
              if (showResult) {
                if (isRight) { bg = C.okSoft; bd = "rgba(61,220,151,0.55)"; fg = C.ok; }
                else if (picked) { bg = C.badSoft; bd = "rgba(255,107,129,0.55)"; fg = C.bad; }
              } else if (picked) {
                bg = "rgba(110,91,255,0.26)"; bd = "rgba(140,124,255,0.65)"; fg = C.ink;
              }
              return (
                <button key={v} className="opt" onClick={() => !showResult && record(v)}
                  style={{
                    flex: 1, padding: "20px 0", fontFamily: SANS, fontSize: 17, fontWeight: 600,
                    borderRadius: 14, background: bg, color: fg, border: `1px solid ${bd}`,
                    cursor: showResult ? "default" : "pointer",
                  }}>{v ? "True" : "False"}</button>
              );
            })}
          </div>
        )}

        {q.kind === "mcq" && (
          <div style={{ display: "grid", gap: 8 }}>
            {q.order.map((optIdx, i) => {
              const picked = answered?.value === optIdx;
              const isRight = optIdx === q.correct;
              let bg = "rgba(255,255,255,0.035)", bd = C.lineSoft, fg = C.body;
              if (showResult) {
                if (isRight) { bg = C.okSoft; bd = "rgba(61,220,151,0.55)"; fg = C.ok; }
                else if (picked) { bg = C.badSoft; bd = "rgba(255,107,129,0.55)"; fg = C.bad; }
              } else if (picked) {
                bg = "rgba(110,91,255,0.26)"; bd = "rgba(140,124,255,0.65)"; fg = C.ink;
              }
              return (
                <button key={optIdx} className="opt" onClick={() => !showResult && record(optIdx)}
                  style={{
                    display: "flex", gap: 12, textAlign: "left", padding: "13px 16px", borderRadius: 12,
                    background: bg, border: `1px solid ${bd}`, cursor: showResult ? "default" : "pointer",
                  }}>
                  <span style={{ fontFamily: MONO, fontSize: 13, color: fg, paddingTop: 2 }}>{"ABCD"[i]}</span>
                  <span style={{ fontFamily: SANS, fontSize: 15, color: fg }}>{q.options[optIdx]}</span>
                </button>
              );
            })}
          </div>
        )}

        {q.kind === "fib" && !showResult && (
          <Button onClick={submitFib}
            disabled={!Array.isArray(draft) || draft.every((d) => !String(d).trim())}>Check answer</Button>
        )}

        {showResult && (
          <div style={{
            marginTop: 22, padding: "16px 18px", borderRadius: 14,
            background: answered.correct ? C.okSoft : C.badSoft,
            border: `1px solid ${answered.correct ? "rgba(61,220,151,0.4)" : "rgba(255,107,129,0.4)"}`,
          }}>
            <p style={{
              fontFamily: SANS, fontWeight: 600, fontSize: 15,
              color: answered.correct ? C.ok : C.bad, margin: 0,
            }}>{answered.correct ? "Correct" : "Not this time"}</p>
            {!answered.correct && (
              <p style={{ fontFamily: SANS, fontSize: 15, color: C.body, margin: "8px 0 0" }}>
                Answer: <strong>
                  {q.kind === "tf" ? (q.answer ? "True" : "False")
                    : q.kind === "mcq" ? q.options[q.correct]
                    : q.answers.map(firstAnswer).join(", ")}
                </strong>
              </p>
            )}
            {q.note && (
              <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: C.body, margin: "8px 0 0" }}>{q.note}</p>
            )}
            {!answered.correct && q.kind === "fib" && (
              <Button size="sm" tone="quiet" style={{ marginTop: 12 }}
                onClick={() => setAnswers((a) => ({ ...a, [q.key]: { ...a[q.key], correct: true } }))}>
                My answer was right, count it
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between" style={{ marginTop: 18 }}>
        <Button tone="quiet" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>Previous</Button>
        <Button tone="gold" onClick={next} disabled={config.instant && !answered}>
          {idx === questions.length - 1 ? "Finish" : "Next"}
        </Button>
      </div>
    </div>
  );
}

/* --------------------------- results --------------------------- */

function Results({ data, onRetryMissed, onNewTest, onHome }) {
  const { results, seconds } = data;
  const total = results.length;
  const score = results.filter((r) => r.correct).length;
  const pct = Math.round((score / total) * 100);
  const missed = results.filter((r) => !r.correct);
  const [open, setOpen] = useState(true);

  const bySection = {};
  results.forEach((r) => {
    const s = (bySection[r.q.section] ||= { total: 0, score: 0 });
    s.total++;
    if (r.correct) s.score++;
  });

  return (
    <div className="mx-auto px-6 py-10" style={{ maxWidth: 820 }}>
      <p style={{ fontFamily: MONO, fontSize: 12, color: C.gold, margin: 0 }}>test complete</p>
      <div className="flex items-baseline" style={{ gap: 16, marginTop: 10 }}>
        <span style={{
          fontFamily: DISPLAY, fontSize: 72, fontWeight: 600, lineHeight: 1, letterSpacing: -2,
          background: ACCENT, WebkitBackgroundClip: "text", backgroundClip: "text",
          color: "transparent",
        }}>{pct}%</span>
        <span style={{ fontFamily: SANS, fontSize: 18, color: C.muted }}>
          {score} of {total} correct{seconds > 0 ? ` in ${clockText(seconds)}` : ""}
        </span>
      </div>

      <div style={{ margin: "26px 0" }}>
        <BitStrip marks={results.map((r) => (r.correct ? "correct" : "wrong"))} current={-1} />
      </div>

      <div className="flex flex-wrap" style={{ gap: 24, marginBottom: 30 }}>
        {Object.entries(bySection).map(([sec, v]) => (
          <div key={sec}>
            <p style={{ fontFamily: SANS, fontSize: 13, color: C.muted, margin: 0 }}>{sectionLabel(sec)}</p>
            <p style={{ fontFamily: MONO, fontSize: 18, color: C.ink, margin: "4px 0 0" }}>{v.score}/{v.total}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap" style={{ gap: 10, marginBottom: 36 }}>
        {missed.length > 0 && (
          <Button tone="gold" onClick={() => onRetryMissed(missed.map((m) => m.q))}>
            Retry the {missed.length} you missed
          </Button>
        )}
        <Button tone="quiet" onClick={onNewTest}>New test</Button>
        <Button tone="quiet" onClick={onHome}>Home</Button>
      </div>

      {missed.length > 0 && (
        <div>
          <button onClick={() => setOpen(!open)}
            style={{
              fontFamily: SANS, fontSize: 15, fontWeight: 600, color: C.ink,
              background: "none", border: "none", padding: 0, cursor: "pointer",
            }}>
            {open ? "Hide" : "Show"} what you missed
          </button>
          {open && (
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              {missed.map(({ q, given }) => (
                <div key={q.key} className="glass" style={{ ...glass(1, 16), padding: 18 }}>
                  <div className="flex items-center" style={{ gap: 8, marginBottom: 10 }}>
                    <Tag color={C.gold}>Q{q.id}</Tag>
                    <Tag>{sectionLabel(q.section)}</Tag>
                  </div>
                  <p style={{ fontFamily: DISPLAY, fontSize: 17, lineHeight: 1.6, color: C.ink, margin: 0 }}>
                    {q.kind === "fib" ? q.text.replace(/___/g, "______") : q.text}
                  </p>
                  <p style={{ fontFamily: SANS, fontSize: 14, color: C.ok, margin: "10px 0 0" }}>
                    Answer: {q.kind === "tf" ? (q.answer ? "True" : "False")
                      : q.kind === "mcq" ? q.options[q.correct]
                      : q.answers.map(firstAnswer).join(", ")}
                  </p>
                  {given !== null && given !== undefined && (
                    <p style={{ fontFamily: SANS, fontSize: 14, color: C.bad, margin: "4px 0 0" }}>
                      You put: {q.kind === "tf" ? (given ? "True" : "False")
                        : q.kind === "mcq" ? q.options[given]
                        : Array.isArray(given) ? (given.filter(Boolean).join(", ") || "nothing")
                        : String(given)}
                    </p>
                  )}
                  {q.note && (
                    <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: C.muted, margin: "10px 0 0" }}>
                      {q.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- app ----------------------------- */

class Boundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("Study app crashed:", err, info); }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="mx-auto px-6 py-16" style={{ maxWidth: 620 }}>
        <p style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 600, color: C.ink }}>
          Something broke on this question.
        </p>
        <p style={{ fontFamily: SANS, fontSize: 15, color: C.muted, marginTop: 8 }}>
          {String(this.state.err && this.state.err.message)}
        </p>
        <p style={{ fontFamily: SANS, fontSize: 14, color: C.faint, marginTop: 8 }}>
          The details are in the browser console.
        </p>
        <Button tone="gold" style={{ marginTop: 20 }} onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    );
  }
}

export default function StudyApp() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState("learn");
  const [chapter, setChapter] = useState(CHAPTERS[0]);
  const [config, setConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [result, setResult] = useState(null);
  const [known, setKnown] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [history, setHistory] = useState([]);
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    (async () => {
      const p = await store.get("progress");
      if (p) {
        setKnown(p.known || []);
        setFlagged(p.flagged || []);
        setHistory(p.history || []);
        setSaved(p.settings || null);
      }
    })();
  }, []);

  const persist = (patch) => {
    store.set("progress", { known, flagged, history, settings: saved, ...patch });
  };

  const toggleKnown = (key) => {
    const next = known.includes(key) ? known.filter((x) => x !== key) : [...known, key];
    setKnown(next);
    persist({ known: next });
  };
  const toggleFlag = (key) => {
    const next = flagged.includes(key) ? flagged.filter((x) => x !== key) : [...flagged, key];
    setFlagged(next);
    persist({ flagged: next });
  };

  const start = (cfg) => {
    setConfig(cfg);
    setSaved(cfg);
    persist({ settings: cfg });
    if (mode === "learn") setScreen("learn");
    else {
      setQuestions(buildExam(cfg));
      setScreen("exam");
    }
  };

  const finishExam = (data) => {
    setResult(data);
    const entry = {
      when: Date.now(),
      chapterNumber: chapterOf(config.chapter).number,
      sections: config.sections,
      score: data.results.filter((r) => r.correct).length,
      total: data.results.length,
    };
    const nextHistory = [entry, ...history].slice(0, 20);
    setHistory(nextHistory);
    persist({ history: nextHistory });
    setScreen("results");
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: C.void, color: C.body }}>
      <style>{GLOBAL_CSS}</style>

      {/* colour field the frosted panels sit on */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background:
          "radial-gradient(58% 44% at 10% 4%, rgba(84,58,214,0.50), transparent 68%)," +
          "radial-gradient(52% 40% at 92% 14%, rgba(14,124,142,0.42), transparent 70%)," +
          "radial-gradient(60% 48% at 62% 100%, rgba(112,34,140,0.40), transparent 68%)",
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
      <header className="glass" style={{
        position: "sticky", top: 0, zIndex: 20,
        borderBottom: `1px solid ${C.line}`,
        background: "linear-gradient(180deg, rgba(10,13,28,0.75), rgba(10,13,28,0.45))",
        backdropFilter: "blur(18px) saturate(150%)",
        WebkitBackdropFilter: "blur(18px) saturate(150%)",
      }}>
        <div className="mx-auto px-6 flex items-center justify-between" style={{ maxWidth: 900, height: 56 }}>
          <button onClick={() => setScreen("home")}
            style={{
              fontFamily: DISPLAY, fontSize: 17, fontWeight: 600, letterSpacing: -0.2,
              color: C.ink, background: "none", border: "none", padding: 0, cursor: "pointer",
            }}>Practice Questions</button>
          <span style={{ fontFamily: MONO, fontSize: 12, color: C.muted }}>
            {screen === "learn" ? "learning mode"
              : screen === "exam" ? "exam mode"
              : screen === "home" ? CHAPTERS.length + " chapters"
              : "chapter " + chapter.number}
          </span>
        </div>
      </header>

      <Boundary>
      {screen === "home" && (
        <Home stats={{ knownCount: known.length, history }}
          onPick={(m) => { setMode(m); setScreen("chapters"); }} />
      )}

      {screen === "chapters" && (
        <ChapterPicker mode={mode} known={known} onBack={() => setScreen("home")}
          onPick={(ch) => { setChapter(ch); setScreen("setup"); }} />
      )}

      {screen === "setup" && (
        <Setup mode={mode} chapter={chapter} saved={saved}
          onBack={() => setScreen("chapters")} onStart={start} />
      )}

      {screen === "learn" && config && (
        <Learn config={config} known={known} flagged={flagged}
          toggleKnown={toggleKnown} toggleFlag={toggleFlag} onExit={() => setScreen("setup")} />
      )}

      {screen === "exam" && config && questions.length > 0 && (
        <Exam config={config} questions={questions} onFinish={finishExam} onExit={() => setScreen("home")} />
      )}

      {screen === "results" && result && (
        <Results data={result}
          onRetryMissed={(qs) => { setQuestions(buildExam(config, qs)); setScreen("exam"); }}
          onNewTest={() => setScreen("setup")} onHome={() => setScreen("home")} />
      )}
      </Boundary>
      </div>
    </div>
  );
}