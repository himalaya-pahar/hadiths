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
  Grade: string;
  Reference: string;
  "In-book reference": string;
}

// ─── Grade badge config ───────────────────────────────────────────────────────
const GRADE_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  sahih:  { bg: "bg-emerald-50",  text: "text-emerald-700", dot: "bg-emerald-500" },
  hasan:  { bg: "bg-sky-50",      text: "text-sky-700",     dot: "bg-sky-500"     },
  "da'if":{ bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
  daif:   { bg: "bg-amber-50",    text: "text-amber-700",   dot: "bg-amber-500"   },
};
function getGradeStyle(grade: string) {
  const key = grade?.toLowerCase().replace(/[^a-z']/g, "");
  return GRADE_STYLE[key] ?? { bg: "bg-stone-100", text: "text-stone-500", dot: "bg-stone-400" };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatEnglishOnly = (text: string) => {
  if (!text) return "";
  let c = text.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, "");
  c = c.replace(/^Chapter:\s*/i, "").replace(/[\s\-–—]+$/, "").trim();
  return c.length > 0 ? c : text;
};

const buildCopyText = (h: Hadith) =>
  `"${h.English_Text.replace(/\s+/g, " ").trim()}"\n\n— ${h.Book}, ${h["In-book reference"]}\nReference: ${h.Reference}`;

const API_BASE = "https://hadiths.onrender.com";

// ─── Sub-components ───────────────────────────────────────────────────────────

function GeometricOrnament() {
  return (
    <svg width="120" height="24" viewBox="0 0 120 24" fill="none" className="opacity-30">
      <line x1="0" y1="12" x2="42" y2="12" stroke="#134D37" strokeWidth="0.75"/>
      <polygon points="52,2 60,12 52,22 44,12" stroke="#134D37" strokeWidth="0.75" fill="none"/>
      <circle cx="60" cy="12" r="3" fill="#134D37"/>
      <polygon points="68,2 76,12 68,22 60,12" stroke="#134D37" strokeWidth="0.75" fill="none"/>
      <line x1="78" y1="12" x2="120" y2="12" stroke="#134D37" strokeWidth="0.75"/>
    </svg>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  if (!grade) return null;
  const s = getGradeStyle(grade);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {grade}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
      <div className="flex flex-col items-center gap-3 min-h-[180px] justify-center animate-pulse">
        {/* Arabic skeleton */}
        <div className="h-4 bg-stone-100 rounded-full w-2/3 mb-2" />
        <div className="h-4 bg-stone-100 rounded-full w-3/4" />
        {/* Divider */}
        <div className="w-8 h-px bg-stone-100 my-3" />
        {/* English skeleton */}
        <div className="h-5 bg-stone-100 rounded-full w-4/5" />
        <div className="h-5 bg-stone-100 rounded-full w-3/4" />
        <div className="h-5 bg-stone-100 rounded-full w-5/6" />
        <div className="h-5 bg-stone-100 rounded-full w-2/3" />
      </div>
      <div className="mt-8 pt-6 border-t border-stone-100 flex justify-between animate-pulse">
        <div className="flex gap-2 items-center">
          <div className="h-4 bg-stone-100 rounded w-28" />
          <div className="h-4 bg-stone-100 rounded w-16" />
        </div>
        <div className="h-6 bg-stone-100 rounded-full w-16" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-72 flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-2xl gap-5">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="opacity-20">
        <rect x="8" y="4" width="26" height="34" rx="3" stroke="#134D37" strokeWidth="1.5"/>
        <rect x="14" y="4" width="26" height="34" rx="3" stroke="#134D37" strokeWidth="1.5" fill="white"/>
        <line x1="20" y1="14" x2="34" y2="14" stroke="#134D37" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="20" y1="19" x2="34" y2="19" stroke="#134D37" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="20" y1="24" x2="28" y2="24" stroke="#134D37" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <div className="text-center">
        <p className="text-stone-400 text-sm font-serif italic">Select a book and click Read Hadith</p>
        <p className="text-stone-300 text-xs font-serif mt-1">to begin your study</p>
      </div>
    </div>
  );
}

function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 relative group w-full min-w-0">
      <label className="absolute -top-2 left-3 px-1.5 bg-[#FCFBF8] text-[10px] font-bold tracking-widest text-stone-400 uppercase z-10 transition-colors group-focus-within:text-[#134D37] pointer-events-none">
        {label}
      </label>
      {children}
      <div className="absolute right-4 top-0 bottom-0 flex items-center pointer-events-none text-stone-400 group-focus-within:text-[#134D37] transition-colors">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HadithApp() {
  const [sources, setSources]               = useState<string[]>([]);
  const [chapters, setChapters]             = useState<Chapter[]>([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [hadith, setHadith]                 = useState<Hadith | null>(null);
  const [hadithKey, setHadithKey]           = useState(0); // forces re-animation
  const [loading, setLoading]               = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [showArabic, setShowArabic]         = useState(true);
  const [isReportOpen, setIsReportOpen]     = useState(false);
  const [reportText, setReportText]         = useState("");
  const [isSuccess, setIsSuccess]           = useState(false);
  const [fetchError, setFetchError]         = useState<string | null>(null);

  // Load sources
  useEffect(() => {
    fetch(`${API_BASE}/sources`)
      .then(r => r.json())
      .then(d => setSources(d?.sources ?? []))
      .catch(() => setSources([]));
  }, []);

  // Load chapters on source change
  useEffect(() => {
    if (!selectedSource) { setChapters([]); setSelectedChapter(""); return; }
    fetch(`${API_BASE}/chapters?source=${encodeURIComponent(selectedSource)}`)
      .then(r => r.json())
      .then(d => setChapters(d?.chapters ?? []))
      .catch(() => setChapters([]));
    setSelectedChapter("");
  }, [selectedSource]);

  // Escape key closes modal
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
      setFetchError("Could not load a hadith. Please try again.");
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

  const SELECT = "appearance-none w-full bg-white border border-stone-200 text-stone-700 text-sm rounded-xl focus:border-[#134D37] focus:ring-1 focus:ring-[#134D37] block p-3.5 pr-12 outline-none shadow-sm transition-all cursor-pointer min-h-[52px]";

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@400;500&family=Scheherazade+New:wght@400;700&display=swap');
        .font-serif  { font-family: 'Crimson Pro', Georgia, serif; }
        .font-sans   { font-family: 'DM Sans', system-ui, sans-serif; }
        .font-arabic { font-family: 'Scheherazade New', serif; }
        ::selection  { background: #E8F0EB; color: #134D37; }
      `}</style>

      <div className="min-h-screen bg-[#FCFBF8] text-stone-800 p-6 md:p-12 font-sans flex flex-col items-center">
        <div className="max-w-3xl w-full flex-grow flex flex-col gap-10">

          {/* ── Header ── */}
          <header className="flex flex-col items-center text-center mt-8 gap-3">
            <GeometricOrnament />
            <h1 className="text-5xl font-serif font-bold tracking-tight text-[#134D37]">
              Hadith Collection
            </h1>
            <p className="text-stone-400 text-sm italic font-serif">
              A window to authentic wisdom
            </p>
            <GeometricOrnament />
          </header>

          {/* ── Controls ── */}
          <section className="flex flex-col sm:flex-row gap-4">
            <Dropdown label="Book">
              <select
                className={SELECT}
                value={selectedSource}
                onChange={e => setSelectedSource(e.target.value)}
              >
                <option value="">Select a Book</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Dropdown>

            <Dropdown label="Chapter">
              <select
                className={`${SELECT} disabled:opacity-40 disabled:cursor-not-allowed`}
                value={selectedChapter}
                onChange={e => setSelectedChapter(e.target.value)}
                disabled={!selectedSource}
              >
                <option value="">All Chapters</option>
                {chapters.map(c => (
                  <option
                    key={`${c.Chapter_Number}-${c.Chapter_Title_English}`}
                    value={c.Chapter_Number}
                  >
                    {c.Chapter_Number}. {formatEnglishOnly(c.Chapter_Title_English)}
                  </option>
                ))}
              </select>
            </Dropdown>

            <button
              onClick={fetchRandomHadith}
              disabled={loading}
              className="bg-[#134D37] hover:bg-[#0D3626] active:scale-95 disabled:opacity-60 text-white font-serif font-medium tracking-wide rounded-xl text-sm px-8 h-[52px] transition-all shadow-md shrink-0"
            >
              {loading
                ? <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg>
                    Seeking…
                  </span>
                : "Read Hadith"
              }
            </button>
          </section>

          {/* ── Content area ── */}
          {loading ? (
            <Skeleton />
          ) : fetchError ? (
            <div className="h-48 flex flex-col items-center justify-center border border-red-100 bg-red-50/40 rounded-2xl gap-2">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
              <p className="text-red-400 text-sm font-serif italic">{fetchError}</p>
            </div>
          ) : hadith ? (
            /* ── Hadith Card ── */
            <article
              key={hadithKey}
              className="bg-white border border-stone-100 rounded-2xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {/* Top accent bar */}
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#134D37]/20 to-transparent" />

              <div className="p-8 sm:p-12">
                {/* ── Top row: grade + controls ── */}
                <div className="flex items-center justify-between mb-8">
                  <GradeBadge grade={hadith.Grade} />

                  <div className="flex items-center gap-2">
                    {/* Toggle Arabic */}
                    {hadith.Arabic_Text && (
                      <button
                        onClick={() => setShowArabic(v => !v)}
                        title={showArabic ? "Hide Arabic" : "Show Arabic"}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                          showArabic
                            ? "bg-[#134D37] text-white border-[#134D37]"
                            : "bg-white text-stone-400 border-stone-200 hover:border-[#134D37] hover:text-[#134D37]"
                        }`}
                      >
                        ع
                      </button>
                    )}

                    {/* Copy button */}
                    <button
                      onClick={handleCopy}
                      aria-label={copied ? "Copied!" : "Copy hadith"}
                      className={`flex items-center justify-center overflow-hidden rounded-full border transition-all duration-300 active:scale-90 ${
                        copied
                          ? "bg-[#E8F0EB] border-[#134D37]/30 text-[#134D37] w-28 h-10"
                          : "bg-white border-stone-200 text-stone-400 hover:text-[#134D37] hover:border-[#134D37] w-10 h-10"
                      }`}
                    >
                      {copied ? (
                        <span className="flex items-center gap-1.5 whitespace-nowrap px-3 text-[10px] font-bold tracking-widest uppercase">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                          </svg>
                          Copied
                        </span>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* ── Arabic text ── */}
                {hadith.Arabic_Text && showArabic && (
                  <div className="mb-8 pb-8 border-b border-stone-50">
                    <p
                      dir="rtl"
                      lang="ar"
                      className="font-arabic text-right text-stone-700 leading-[2.2] text-2xl sm:text-3xl"
                    >
                      {hadith.Arabic_Text}
                    </p>
                  </div>
                )}

                {/* ── English text ── */}
                <div className="flex flex-col items-center justify-center py-2">
                  <p className="text-stone-800 text-xl sm:text-2xl leading-loose font-serif text-center max-w-2xl">
                    &ldquo;{hadith.English_Text}&rdquo;
                  </p>
                </div>

                {/* ── Footer ── */}
                <footer className="mt-10 pt-6 border-t border-stone-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm font-serif">
                  {/* Left: book info */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#134D37] font-semibold text-base">{hadith.Book}</span>
                      <span className="text-stone-400">·</span>
                      <span className="text-stone-500 italic">{hadith["In-book reference"]}</span>
                      {hadith.Reference && (
                        <a
                          href={hadith.Reference}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-stone-300 hover:text-[#134D37] transition-colors"
                          title="Open reference source"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                          </svg>
                        </a>
                      )}
                    </div>
                    {hadith.Chapter_Title_English && (
                      <span className="text-stone-400 text-xs italic hidden md:block">
                        {formatEnglishOnly(hadith.Chapter_Title_English)}
                      </span>
                    )}
                  </div>

                  {/* Right: report */}
                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100 shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Report Issue</span>
                  </button>
                </footer>
              </div>
            </article>
          ) : (
            <EmptyState />
          )}

        </div>

        {/* ── Page footer ── */}
        <footer className="mt-20 py-8 text-center text-stone-400 text-[10px] tracking-[0.2em] font-serif border-t border-stone-100 w-full max-w-3xl uppercase">
          Developed by{" "}
          <a
            href="https://www.linkedin.com/in/nafis-shahriar-687402287/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#134D37] font-bold hover:underline transition-all"
          >
            Nafis Shahriar
          </a>
        </footer>

        {/* ── Report Modal ── */}
        {isReportOpen && (
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setIsReportOpen(false)}
          >
            <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-10 animate-in fade-in zoom-in duration-300">
              {!isSuccess ? (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-3xl font-serif font-bold text-stone-800">Report Issue</h2>
                    <button
                      onClick={() => setIsReportOpen(false)}
                      className="text-stone-300 hover:text-stone-500 transition-colors p-1 rounded-full hover:bg-stone-100 mt-1"
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  <p className="text-sm text-stone-400 mb-8 font-serif">
                    Reporting{" "}
                    <span className="text-[#134D37] font-semibold">
                      {hadith?.Book} — {hadith?.["In-book reference"]}
                    </span>
                  </p>

                  <form onSubmit={handleReportSubmit} className="flex flex-col gap-8">
                    <div className="bg-[#F9F8F4] rounded-[24px] p-2 border border-stone-100">
                      <textarea
                        required
                        autoFocus
                        className="w-full bg-transparent border-none p-5 text-stone-700 text-sm focus:ring-0 outline-none min-h-[160px] placeholder:text-stone-300 placeholder:italic resize-none font-serif"
                        placeholder="Describe the issue (e.g., typo, missing text)…"
                        value={reportText}
                        onChange={e => setReportText(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-6 justify-end items-center">
                      <button
                        type="button"
                        onClick={() => setIsReportOpen(false)}
                        className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-stone-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!reportText.trim()}
                        className="bg-[#1D4033] hover:bg-[#134D37] disabled:opacity-50 text-white px-10 py-4 rounded-[18px] text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="py-12 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="w-20 h-20 bg-[#E8F0EB] rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-[#134D37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">Jazakallah Khair</h2>
                  <p className="text-stone-400 font-serif leading-relaxed text-sm">
                    Your report has been received.<br/>
                    Returning to the collection…
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
