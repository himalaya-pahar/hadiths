"use client";
import React, { useState, useEffect } from "react";

interface Chapter {
  Chapter_Number: number;
  Chapter_Title_English: string;
}

interface Hadith {
  Book: string;
  Chapter_Number: number;
  Chapter_Title_Arabic: string;
  Chapter_Title_English: string;
  Arabic_Text: string;
  English_Text: string;
  Bangla_Text: string;
  Grade: string;
  Reference: string;
  "In-book reference": string;
}

const GRADE_CONFIG: Record<string, { label: string; color: string }> = {
  sahih:   { label: "Sahih",   color: "grade-sahih"  },
  hasan:   { label: "Hasan",   color: "grade-hasan"  },
  "da'if": { label: "Da'if",   color: "grade-daif"   },
  daif:    { label: "Da'if",   color: "grade-daif"   },
};
function getGrade(grade: string) {
  const key = grade?.toLowerCase().replace(/[^a-z']/g, "");
  return GRADE_CONFIG[key] ?? { label: grade, color: "grade-unknown" };
}

const formatEnglishOnly = (text: string) => {
  if (!text) return "";
  let c = text.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, "");
  c = c.replace(/^Chapter:\s*/i, "").replace(/[\s\-–—]+$/, "").trim();
  return c.length > 0 ? c : text;
};

const buildCopyText = (h: Hadith) =>
  `"${h.English_Text.replace(/\s+/g, " ").trim()}"\n\n— ${h.Book}, ${h["In-book reference"]}\nReference: ${h.Reference}`;

const API_BASE = "https://hadiths.onrender.com";

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
  </svg>
);
const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const IconFlag = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);
const IconLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
);
const IconMoon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);
const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IconChevron = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const IconClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconAlert = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ─── Sub-components ───────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="card animate-pulse">
      <div className="skeleton-line" style={{ width: "60%", height: "14px", marginBottom: "12px" }} />
      <div className="skeleton-line" style={{ width: "80%", height: "14px", marginBottom: "8px" }} />
      <div className="skeleton-line" style={{ width: "70%", height: "14px", marginBottom: "8px" }} />
      <div className="skeleton-line" style={{ width: "85%", height: "14px", marginBottom: "32px" }} />
      <div className="skeleton-line" style={{ width: "40%", height: "12px" }} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
        </svg>
      </div>
      <p className="empty-title">Select a book to begin</p>
      <p className="empty-sub">Then click "Read Hadith" to start your study</p>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  if (!grade) return null;
  const g = getGrade(grade);
  return <span className={`grade-badge ${g.color}`}>{g.label}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HadithApp() {
  const [dark, setDark] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [hadithKey, setHadithKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeLang, setActiveLang] = useState<"ar" | "bn" | "en">("en");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/sources`)
      .then(r => r.json())
      .then(d => setSources(d?.sources ?? []))
      .catch(() => setSources([]));
  }, []);

  useEffect(() => {
    if (!selectedSource) { setChapters([]); setSelectedChapter(""); return; }
    fetch(`${API_BASE}/chapters?source=${encodeURIComponent(selectedSource)}`)
      .then(r => r.json())
      .then(d => setChapters(d?.chapters ?? []))
      .catch(() => setChapters([]));
    setSelectedChapter("");
  }, [selectedSource]);

  useEffect(() => {
    if (!isReportOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setIsReportOpen(false); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isReportOpen]);

  const fetchRandomHadith = async () => {
    setLoading(true);
    setCopied(false);
    setFetchError(null);
    const params = new URLSearchParams();
    if (selectedSource) params.set("source", selectedSource);
    if (selectedChapter) params.set("chapter_no", selectedChapter);
    const q = params.toString() ? `?${params}` : "";
    try {
      const res = await fetch(`${API_BASE}/random-hadith${q}`);
      if (!res.ok) throw new Error("Bad response");
      setHadith(await res.json());
      setHadithKey(k => k + 1);
    } catch {
      setFetchError("Could not load hadith. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!hadith || copied) return;
    try {
      await navigator.clipboard.writeText(buildCopyText(hadith));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy. Please try again.");
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hadith || !reportText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/report-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_name: hadith.Book,
          hadith_ref: hadith["In-book reference"],
          issue_description: reportText.trim(),
        }),
      });
      if (res.ok) {
        setIsSuccess(true);
        setReportText("");
        setTimeout(() => { setIsReportOpen(false); setIsSuccess(false); }, 3000);
      }
    } catch {
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=Noto+Serif+Bengali:wght@400;500;600&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:           #E8E3D9;
          --bg2:          #DED8CC;
          --surface:      #F0EDE5;
          --surface2:     #E8E3D9;
          --border:       rgba(90,75,55,0.10);
          --border2:      rgba(90,75,55,0.18);
          --text1:        #1C1813;
          --text2:        #5A5248;
          --text3:        #9E9386;
          --accent:       #2D6E51;
          --accent2:      #215440;
          --accent-bg:    rgba(45,110,81,0.10);
          --accent-faint: rgba(45,110,81,0.07);
          --red:          #B83A2E;
          --red-bg:       rgba(184,58,46,0.08);
          --gold:         #A67628;
          --gold-bg:      rgba(166,118,40,0.10);
          --sky:          #2565A0;
          --sky-bg:       rgba(37,101,160,0.10);
          --gray-bg:      rgba(90,75,55,0.07);
          --shadow-sm:    0 1px 3px rgba(60,45,25,0.08), 0 4px 16px rgba(60,45,25,0.05);
          --shadow:       0 2px 8px rgba(60,45,25,0.08), 0 8px 32px rgba(60,45,25,0.06);
          --shadow-lg:    0 8px 24px rgba(60,45,25,0.12), 0 24px 64px rgba(60,45,25,0.10);
          --radius:       20px;
          --radius-sm:    12px;
          --radius-xs:    8px;
          --transition:   0.18s cubic-bezier(0.4,0,0.2,1);
        }
        .dark {
          --bg:           #131210;
          --bg2:          #1A1916;
          --surface:      #201F1C;
          --surface2:     #272521;
          --border:       rgba(255,245,230,0.07);
          --border2:      rgba(255,245,230,0.12);
          --text1:        #F2EDE6;
          --text2:        #A89E92;
          --text3:        #6E665C;
          --accent:       #4DB87E;
          --accent2:      #3DA06C;
          --accent-bg:    rgba(77,184,126,0.13);
          --accent-faint: rgba(77,184,126,0.07);
          --red:          #E07070;
          --red-bg:       rgba(224,112,112,0.10);
          --gold:         #CFA040;
          --gold-bg:      rgba(207,160,64,0.12);
          --sky:          #5AA8DC;
          --sky-bg:       rgba(90,168,220,0.12);
          --gray-bg:      rgba(255,255,255,0.04);
          --shadow-sm:    0 1px 4px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.18);
          --shadow:       0 2px 8px rgba(0,0,0,0.32), 0 8px 32px rgba(0,0,0,0.22);
          --shadow-lg:    0 8px 24px rgba(0,0,0,0.40), 0 24px 64px rgba(0,0,0,0.32);
        }

        body, #__next { background: var(--bg); }

        .app {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text1);
          font-family: 'Sora', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0 20px 80px;
          transition: background 0.3s ease, color 0.3s ease;
        }

        .wrapper {
          width: 100%;
          max-width: 700px;
          display: flex;
          flex-direction: column;
        }

        /* ── Top bar ── */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 0 0;
        }
        .topbar-logo { display: flex; align-items: center; gap: 11px; }
        .logo-mark {
          width: 38px; height: 38px;
          background: var(--accent);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(45,110,81,0.35);
        }
        .logo-mark svg { color: #fff; }
        .logo-text { font-size: 14.5px; font-weight: 600; color: var(--text1); letter-spacing: -0.2px; line-height: 1.2; }
        .logo-sub  { font-size: 11px; color: var(--text3); font-weight: 400; letter-spacing: 0.01em; }
        .dark-toggle {
          width: 40px; height: 40px;
          border-radius: var(--radius-xs);
          border: 1px solid var(--border2);
          background: var(--surface);
          color: var(--text2);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition);
        }
        .dark-toggle:hover { background: var(--surface2); color: var(--text1); border-color: var(--border2); }
        .dark-toggle:active { transform: scale(0.95); }

        /* ── Header ── */
        .header { text-align: center; padding: 60px 0 52px; }
        .header-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 10.5px; font-weight: 600; letter-spacing: 0.2em;
          color: var(--accent); text-transform: uppercase; margin-bottom: 20px;
        }
        .header-eyebrow::before,
        .header-eyebrow::after {
          content: ''; display: block;
          width: 24px; height: 1px; background: var(--accent); opacity: 0.5;
        }
        .header-title {
          font-size: clamp(34px, 6vw, 50px);
          font-weight: 600; color: var(--text1);
          letter-spacing: -1.8px; line-height: 1.08;
          margin-bottom: 18px;
        }
        .header-title span { color: var(--accent); }
        .header-sub { font-size: 14.5px; color: var(--text2); font-weight: 300; line-height: 1.7; max-width: 420px; margin: 0 auto; }

        /* ── Controls ── */
        .controls { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
        .select-wrap { flex: 1; min-width: 155px; position: relative; }
        .select-label {
          position: absolute; top: -9px; left: 13px;
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--text3);
          background: var(--surface); padding: 0 5px; z-index: 1;
          transition: color var(--transition); pointer-events: none;
        }
        .select-wrap:focus-within .select-label { color: var(--accent); }
        .select-icon {
          position: absolute; right: 14px; top: 50%;
          transform: translateY(-50%); pointer-events: none; color: var(--text3);
        }
        select {
          width: 100%; appearance: none;
          background: var(--surface); border: 1px solid var(--border2);
          border-radius: var(--radius-sm); color: var(--text1);
          font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 400;
          padding: 15px 40px 15px 16px; cursor: pointer; outline: none;
          box-shadow: var(--shadow-sm);
          transition: border-color var(--transition), box-shadow var(--transition);
        }
        select:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-faint), var(--shadow-sm);
        }
        select:disabled { opacity: 0.38; cursor: not-allowed; }

        .btn-primary {
          height: 54px; padding: 0 30px;
          background: var(--accent); color: #fff; border: none;
          border-radius: var(--radius-sm);
          font-family: 'Sora', sans-serif; font-size: 13px; font-weight: 600;
          cursor: pointer; display: flex; align-items: center; gap: 8px;
          white-space: nowrap; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(45,110,81,0.30), 0 1px 2px rgba(45,110,81,0.20);
          transition: background var(--transition), transform var(--transition),
                      box-shadow var(--transition), opacity var(--transition);
          letter-spacing: 0.01em;
        }
        .btn-primary:hover {
          background: var(--accent2);
          box-shadow: 0 4px 16px rgba(45,110,81,0.35), 0 1px 3px rgba(45,110,81,0.25);
        }
        .btn-primary:active { transform: scale(0.97); box-shadow: none; }
        .btn-primary:disabled { opacity: 0.52; cursor: not-allowed; transform: none; box-shadow: none; }

        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.28);
          border-top-color: #fff; border-radius: 50%;
          animation: spin 0.65s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Card ── */
        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          overflow: hidden;
          animation: slideUp 0.38s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.99); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* card top accent line */
        .card::before {
          content: '';
          display: block;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--accent) 30%, var(--accent) 70%, transparent);
          opacity: 0.5;
        }

        .card-header {
          padding: 18px 24px 16px;
          display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid var(--border);
          background: var(--surface2);
          gap: 12px; flex-wrap: wrap;
        }
        .card-header-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

        /* ── Grade badge ── */
        .grade-badge {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.12em;
          text-transform: uppercase; padding: 4px 11px; border-radius: 100px;
        }
        .grade-sahih  { background: var(--accent-bg); color: var(--accent); }
        .grade-hasan  { background: var(--sky-bg);    color: var(--sky);    }
        .grade-daif   { background: var(--gold-bg);   color: var(--gold);   }
        .grade-unknown{ background: var(--gray-bg);   color: var(--text2);  }

        /* ── Lang toggles ── */
        .lang-toggles { display: flex; align-items: center; gap: 5px; }
        .lang-btn {
          height: 28px; padding: 0 10px;
          border-radius: 6px; border: 1px solid var(--border2);
          background: transparent; color: var(--text3);
          font-family: 'Sora', sans-serif; font-size: 9.5px; font-weight: 700;
          letter-spacing: 0.1em; cursor: pointer;
          transition: all var(--transition);
        }
        .lang-btn.active {
          background: var(--accent); border-color: var(--accent); color: #fff;
          box-shadow: 0 1px 4px rgba(45,110,81,0.30);
        }
        .lang-btn:not(.active):hover { border-color: var(--accent); color: var(--accent); background: var(--accent-faint); }

        .copy-btn {
          width: 28px; height: 28px; border-radius: 6px;
          border: 1px solid var(--border2); background: transparent;
          color: var(--text3); display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: all var(--transition);
        }
        .copy-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-faint); }
        .copy-btn.copied {
          background: var(--accent-bg); border-color: var(--accent); color: var(--accent);
          width: auto; padding: 0 11px; gap: 5px;
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em;
          font-family: 'Sora', sans-serif;
        }

        /* ── Card body ── */
        .card-body {
          padding: 40px 36px 36px;
          display: flex; flex-direction: column; gap: 28px;
          min-height: 160px;
        }

        .arabic-text {
          font-family: 'Amiri', serif;
          font-size: clamp(24px, 4vw, 32px);
          line-height: 2.3; text-align: right; direction: rtl;
          color: var(--text1);
        }
        .bangla-text {
          font-family: 'Noto Serif Bengali', serif;
          font-size: clamp(17px, 2.5vw, 21px);
          line-height: 2.0; color: var(--text1);
          text-align: center; max-width: 580px; margin: 0 auto;
        }
        .english-text {
          font-size: clamp(15px, 2vw, 17px); line-height: 1.85;
          color: var(--text2); text-align: center;
          font-style: italic; font-weight: 300;
          max-width: 560px; margin: 0 auto;
        }

        /* ── Card footer ── */
        .card-footer {
          padding: 14px 24px;
          border-top: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
          background: var(--surface2);
        }
        .ref-block { display: flex; flex-direction: column; gap: 3px; }
        .ref-book {
          font-size: 13.5px; font-weight: 600; color: var(--accent);
          display: flex; align-items: center; gap: 6px;
        }
        .ref-book a { color: var(--text3); transition: color var(--transition); line-height: 1; }
        .ref-book a:hover { color: var(--accent); }
        .ref-sep { color: var(--border2); }
        .ref-inline { font-size: 12px; color: var(--text3); }
        .ref-chapter { font-size: 11px; color: var(--text3); font-style: italic; margin-top: 1px; }

        .report-btn {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 11px; border-radius: 6px;
          border: 1px solid transparent; background: transparent;
          color: var(--text3); font-family: 'Sora', sans-serif;
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; cursor: pointer;
          transition: all var(--transition); flex-shrink: 0;
        }
        .report-btn:hover {
          background: var(--red-bg); border-color: rgba(184,58,46,0.15); color: var(--red);
        }

        /* ── Error state ── */
        .error-state {
          background: var(--red-bg); border: 1px solid rgba(184,58,46,0.15);
          border-radius: var(--radius); padding: 40px 24px;
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; color: var(--red); text-align: center;
        }
        .error-state p { font-size: 14px; font-weight: 500; }

        /* ── Empty state ── */
        .empty-state {
          border: 1.5px dashed var(--border2); border-radius: var(--radius);
          padding: 72px 24px; display: flex; flex-direction: column;
          align-items: center; gap: 12px; text-align: center;
        }
        .empty-icon {
          width: 56px; height: 56px; background: var(--surface);
          border: 1px solid var(--border2); border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--text3); margin-bottom: 4px;
          box-shadow: var(--shadow-sm);
        }
        .empty-title { font-size: 15px; font-weight: 500; color: var(--text2); }
        .empty-sub { font-size: 13px; color: var(--text3); font-weight: 300; }

        /* ── Skeleton ── */
        .skeleton-line {
          background: var(--bg2); border-radius: 6px;
          animation: pulse 1.8s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .card.animate-pulse { padding: 36px; display: flex; flex-direction: column; gap: 12px; }

        /* ── Page footer ── */
        .page-footer {
          margin-top: 64px; padding-top: 24px;
          border-top: 1px solid var(--border);
          text-align: center; font-size: 10.5px; letter-spacing: 0.18em;
          text-transform: uppercase; color: var(--text3);
        }
        .page-footer a { color: var(--accent); font-weight: 600; text-decoration: none; transition: opacity var(--transition); }
        .page-footer a:hover { opacity: 0.75; }

        /* ── Modal ── */
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(20,16,10,0.55); backdrop-filter: blur(6px);
          z-index: 50; display: flex; align-items: center; justify-content: center;
          padding: 20px; animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }

        .modal {
          background: var(--surface); border: 1px solid var(--border2);
          border-radius: var(--radius); box-shadow: var(--shadow-lg);
          max-width: 460px; width: 100%; padding: 36px;
          animation: modalIn 0.28s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes modalIn {
          from { opacity:0; transform:scale(0.94) translateY(12px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }

        .modal-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 6px;
        }
        .modal-title { font-size: 21px; font-weight: 600; color: var(--text1); letter-spacing: -0.4px; }
        .modal-close {
          width: 32px; height: 32px; border-radius: var(--radius-xs);
          border: 1px solid var(--border2); background: transparent;
          color: var(--text3); display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all var(--transition);
        }
        .modal-close:hover { background: var(--bg2); color: var(--text1); }
        .modal-sub { font-size: 13px; color: var(--text3); margin-bottom: 24px; line-height: 1.5; }
        .modal-sub strong { color: var(--accent); font-weight: 600; }

        .modal-textarea-wrap {
          background: var(--surface2); border: 1px solid var(--border2);
          border-radius: var(--radius-sm); margin-bottom: 24px;
          transition: border-color var(--transition), box-shadow var(--transition);
        }
        .modal-textarea-wrap:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-faint);
        }
        textarea {
          width: 100%; background: transparent; border: none; outline: none;
          padding: 16px; font-family: 'Sora', sans-serif; font-size: 13.5px;
          color: var(--text1); min-height: 130px; resize: none; line-height: 1.7;
        }
        textarea::placeholder { color: var(--text3); font-style: italic; font-weight: 300; }

        .modal-actions { display: flex; justify-content: flex-end; align-items: center; gap: 16px; }
        .btn-ghost {
          background: transparent; border: none;
          font-family: 'Sora', sans-serif; font-size: 11px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text3); cursor: pointer; padding: 8px 4px;
          transition: color var(--transition);
        }
        .btn-ghost:hover { color: var(--text1); }
        .btn-submit {
          background: var(--accent); color: #fff; border: none;
          border-radius: var(--radius-xs); font-family: 'Sora', sans-serif;
          font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; padding: 12px 26px; cursor: pointer;
          box-shadow: 0 2px 8px rgba(45,110,81,0.28);
          transition: background var(--transition), transform var(--transition),
                      box-shadow var(--transition), opacity var(--transition);
        }
        .btn-submit:hover { background: var(--accent2); box-shadow: 0 4px 14px rgba(45,110,81,0.35); }
        .btn-submit:active { transform: scale(0.97); box-shadow: none; }
        .btn-submit:disabled { opacity: 0.42; cursor: not-allowed; transform: none; box-shadow: none; }

        /* ── Success ── */
        .modal-success {
          padding: 20px 0; display: flex; flex-direction: column;
          align-items: center; text-align: center; gap: 14px;
          animation: slideUp 0.32s cubic-bezier(0.22,1,0.36,1);
        }
        .success-icon {
          width: 64px; height: 64px; background: var(--accent-bg);
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          color: var(--accent); font-size: 28px;
          box-shadow: 0 0 0 6px var(--accent-faint);
        }
        .success-title { font-size: 21px; font-weight: 600; color: var(--text1); }
        .success-sub { font-size: 13.5px; color: var(--text3); font-weight: 300; line-height: 1.65; }

        @media (max-width: 600px) {
          .controls { flex-direction: column; }
          .btn-primary { width: 100%; justify-content: center; }
          .card-header { padding: 14px 16px; }
          .card-body { padding: 28px 20px 24px; }
          .card-footer { padding: 12px 16px; }
          .modal { padding: 24px; }
          .header { padding: 48px 0 40px; }
        }
        /* 1. Header container: Fixed height and no wrapping to keep it clean */
.card-header {
  padding: 18px 24px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--border);
  background: var(--surface2);
  flex-wrap: nowrap; /* Strictly prevent items from dropping to the next line */
}

/* 2. Left section: Grow to fill space but allow shrinking for ellipsis */
.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0; /* Essential for ellipsis to work inside a flex item */
}

/* 3. Chapter text: Truncate with dots (...) if it hits the buttons */
.ref-chapter {
  font-size: 11px;
  color: var(--text3);
  font-style: italic;
  white-space: nowrap; /* Keep text on a single line */
  overflow: hidden; /* Hide the overlapping text */
  text-overflow: ellipsis; /* Add the '...' dots */
  flex: 1; /* Take up as much space as possible */
}

/* 4. Language toggles: Locked to the right side, never shrinks */
.lang-toggles {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0; /* Prevent buttons from being squashed by long titles */
}
      `}</style>

      <div className={`app${dark ? " dark" : ""}`}>
        <div className="wrapper">

          {/* ── Top bar ── */}
          <div className="topbar">
            <div className="topbar-logo">
              <div className="logo-mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                </svg>
              </div>
              <div>
                <div className="logo-text">Hadith Collection</div>
                <div className="logo-sub">Authentic Prophetic Narrations</div>
              </div>
            </div>
            <button className="dark-toggle" onClick={() => setDark(d => !d)} aria-label="Toggle dark mode">
              {dark ? <IconSun /> : <IconMoon />}
            </button>
          </div>

          {/* ── Header ── */}
          <header className="header">
            <p className="header-eyebrow">Quranic & Prophetic Guidance</p>
            <h1 className="header-title">Explore Hadith<br/><span>Read & Reflect</span></h1>
            <p className="header-sub">A curated collection of authentic hadith — in Arabic, Bengali & English</p>
          </header>

          {/* ── Controls ── */}
          <section className="controls">
            <div className="select-wrap">
              {/* <span className="select-label">Book</span> */}
              <span className="select-icon"><IconChevron /></span>
              <select value={selectedSource} onChange={e => setSelectedSource(e.target.value)}>
                <option value="">All Books</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="select-wrap">
              {/* <span className="select-label">Chapter</span> */}
              <span className="select-icon"><IconChevron /></span>
              <select
                value={selectedChapter}
                onChange={e => setSelectedChapter(e.target.value)}
                disabled={!selectedSource}
              >
                <option value="">All Chapters</option>
                {chapters.map(c => (
                  <option key={`${c.Chapter_Number}-${c.Chapter_Title_English}`} value={c.Chapter_Number}>
                    {c.Chapter_Number}. {formatEnglishOnly(c.Chapter_Title_English)}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-primary" onClick={fetchRandomHadith} disabled={loading}>
              {loading ? (
                <><div className="spinner" />Searching…</>
              ) : "Read Hadith"}
            </button>
          </section>

          {/* ── Content ── */}
          {loading ? (
            <Skeleton />
          ) : fetchError ? (
            <div className="error-state">
              <IconAlert />
              <p>{fetchError}</p>
            </div>
          ) : hadith ? (
            <article key={hadithKey} className="card">

              {/* Card header */}
              <div className="card-header">
                <div className="card-header-left">
                  <GradeBadge grade={hadith.Grade} />
                  {hadith.Chapter_Title_English && (
                    <span className="ref-chapter" style={{ display: "inline" }}>
                      {formatEnglishOnly(hadith.Chapter_Title_English)}
                    </span>
                  )}
                </div>

                <div className="lang-toggles">
                  {hadith.Arabic_Text && (
                    <button
                      className={`lang-btn${activeLang === "ar" ? " active" : ""}`}
                      onClick={() => setActiveLang("ar")}
                      title="Show Arabic"
                    >AR</button>
                  )}
                  {hadith.Bangla_Text && (
                    <button
                      className={`lang-btn${activeLang === "bn" ? " active" : ""}`}
                      onClick={() => setActiveLang("bn")}
                      title="Show Bengali"
                    >BN</button>
                  )}
                  {hadith.English_Text && (
                    <button
                      className={`lang-btn${activeLang === "en" ? " active" : ""}`}
                      onClick={() => setActiveLang("en")}
                      title="Show English"
                    >EN</button>
                  )}
                  <button
                    className={`copy-btn${copied ? " copied" : ""}`}
                    onClick={handleCopy}
                    aria-label={copied ? "Copied!" : "Copy hadith"}
                  >
                    {copied ? <><IconCheck /><span>Copied</span></> : <IconCopy />}
                  </button>
                </div>
              </div>

              {/* Card body */}
              <div className="card-body">
                {hadith.Arabic_Text && activeLang === "ar" && (
                  <p className="arabic-text">{hadith.Arabic_Text}</p>
                )}
                {hadith.Bangla_Text && activeLang === "bn" && (
                  <p className="bangla-text">{hadith.Bangla_Text}</p>
                )}
                {hadith.English_Text && activeLang === "en" && (
                  <p className="english-text">"{hadith.English_Text}"</p>
                )}
              </div>

              {/* Card footer */}
              <div className="card-footer">
                <div className="ref-block">
                  <div className="ref-book">
                    <span>{hadith.Book}</span>
                    <span className="ref-sep">·</span>
                    <span className="ref-inline">{hadith["In-book reference"]}</span>
                  </div>
                </div>

                <button className="report-btn" onClick={() => setIsReportOpen(true)}>
                  <IconFlag />
                  Report Issue
                </button>
              </div>
            </article>
          ) : (
            <EmptyState />
          )}

          {/* ── Page footer ── */}
          <footer className="page-footer">
            Developed by{" "}
            <a href="https://www.linkedin.com/in/nafis-shahriar-687402287/" target="_blank" rel="noopener noreferrer">
              Nafis Shahriar
            </a>
          </footer>
        </div>

        {/* ── Report Modal ── */}
        {isReportOpen && (
          <div
            className="modal-backdrop"
            onClick={e => e.target === e.currentTarget && setIsReportOpen(false)}
          >
            <div className="modal">
              {!isSuccess ? (
                <>
                  <div className="modal-header">
                    <h2 className="modal-title">Report Issue</h2>
                    <button className="modal-close" onClick={() => setIsReportOpen(false)} aria-label="Close">
                      <IconClose />
                    </button>
                  </div>
                  <p className="modal-sub">
                    Reporting <strong>{hadith?.Book} — {hadith?.["In-book reference"]}</strong>
                  </p>
                  <form onSubmit={handleReportSubmit}>
                    <div className="modal-textarea-wrap">
                      <textarea
                        required
                        autoFocus
                        placeholder="Describe the issue (e.g. typo, missing text, incorrect translation)…"
                        value={reportText}
                        onChange={e => setReportText(e.target.value)}
                      />
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn-ghost" onClick={() => setIsReportOpen(false)}>Cancel</button>
                      <button type="submit" className="btn-submit" disabled={!reportText.trim()}>Submit</button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="modal-success">
                  <div className="success-icon">✓</div>
                  <h2 className="success-title">Jazakallah Khair</h2>
                  <p className="success-sub">Your report has been received.<br/>Returning to the collection…</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
