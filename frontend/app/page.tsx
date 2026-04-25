"use client";
import React, { useState, useEffect, ChangeEvent } from "react";

// নতুন ডেটাসেট অনুযায়ী ইন্টারফেস আপডেট করা হলো
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

export default function HadithApp() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedChapter, setSelectedChapter] = useState<string>("");
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Report States
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");

  const API_BASE = "http://localhost:8000";

  // Arabic text clean korar logic
  const formatEnglishOnly = (text: string) => {
    if (!text) return "";
    let cleaned = text.replace(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
    cleaned = cleaned.replace(/^Chapter:\s*/i, ''); // "Chapter: " লেখাটা মুছে দিবে
    cleaned = cleaned.replace(/[\s\-–—]+$/, '').trim();
    return cleaned.length > 0 ? cleaned : text;
  };

  useEffect(() => {
    fetch(`${API_BASE}/sources`)
      .then((res) => res.json())
      .then((data) => setSources(data?.sources || []))
      .catch(() => setSources([]));
  }, []);

  useEffect(() => {
    if (selectedSource) {
      fetch(`${API_BASE}/chapters?source=${encodeURIComponent(selectedSource)}`)
        .then((res) => res.json())
        .then((data) => setChapters(data?.chapters || []))
        .catch(() => setChapters([]));
    } else {
      setChapters([]);
    }
    setSelectedChapter("");
  }, [selectedSource]);

  const fetchRandomHadith = async () => {
    setLoading(true);
    setCopied(false);
    let url = `${API_BASE}/random-hadith?`;
    if (selectedSource) url += `source=${encodeURIComponent(selectedSource)}&`;
    if (selectedChapter) url += `chapter_no=${selectedChapter}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      setHadith(data);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // আপডেটেড Copy ফাংশন
  const handleCopy = async () => {
    if (!hadith) return;
    
    try {
      // স্পেস ঠিক করার লজিক
      const cleanedText = hadith.English_Text.replace(/\s+/g, ' ').trim();
      // কপিতে রেফারেন্স লিংক যোগ করা হলো
      const textToCopy = `"${cleanedText}"\n\n— ${hadith.Book}, ${hadith["In-book reference"]}\nReference: ${hadith.Reference}`;
      
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Failed to copy text. Please try again.");
    }
  };

    const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hadith || !reportText.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/report-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          book_name: hadith.Book,
          hadith_ref: hadith["In-book reference"],
          issue_description: reportText,
        }),
      });

      if (response.ok) {
        setIsSuccess(true); // সাকসেস মেসেজ দেখাবে
        setReportText("");
        
        // ৩ সেকেন্ড পর সব বন্ধ করে মেইন পেজে ফিরবে
        setTimeout(() => {
          setIsReportOpen(false);
          setIsSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Report error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

    const Dropdown = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex-1 relative group w-full min-w-0">
      <label className="absolute -top-2 left-3 px-1.5 bg-[#FCFBF8] text-[10px] font-bold tracking-widest text-stone-400 uppercase z-10 transition-colors group-focus-within:text-[#134D37]">
        {label}
      </label>
      {children}
      {/* Arrow-এর পজিশনিং ঠিক করা হলো এবং flex-shrink-0 অ্যাড করা হলো */}
      <div className="absolute right-4 top-0 bottom-0 flex items-center justify-center pointer-events-none text-stone-400 group-focus-within:text-[#134D37]">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBF8] text-stone-800 p-6 md:p-12 font-sans flex flex-col items-center">
      <div className="max-w-3xl w-full flex-grow flex flex-col gap-10">
        
        {/* Header */}
        <header className="flex flex-col gap-1 items-center text-center mt-6">
          <h1 className="text-4xl font-serif font-bold tracking-tight text-[#134D37]">Hadith Collection</h1>
          <p className="text-stone-500 text-sm italic font-serif">A window to authentic wisdom</p>
        </header>

                {/* Controls - Updated Chapter logic and Fixes */}
        <section className="flex flex-col sm:flex-row gap-4 mt-2">
          <Dropdown label="Book">
            <select className="appearance-none w-full bg-white border border-stone-200 text-stone-700 text-sm rounded-xl focus:border-[#134D37] focus:ring-1 focus:ring-[#134D37] block p-3.5 pr-12 outline-none shadow-sm transition-all cursor-pointer min-h-[52px] h-full" value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
              <option value="">Select a Book</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Dropdown>

          <Dropdown label="Chapter">
            <select 
              className="appearance-none w-full bg-white border border-stone-200 text-stone-700 text-sm rounded-xl focus:border-[#134D37] focus:ring-1 focus:ring-[#134D37] block p-3.5 pr-12 outline-none disabled:opacity-50 transition-all cursor-pointer overflow-hidden whitespace-normal break-words min-h-[52px] h-full" 
              value={selectedChapter} 
              onChange={(e) => setSelectedChapter(e.target.value)} 
              disabled={!selectedSource}
            >
              <option value="">All Chapters</option>
              {chapters.map((c) => (
                <option key={`${c.Chapter_Number}-${c.Chapter_Title_English}`} value={c.Chapter_Number} className="py-2">
                {c.Chapter_Number}. {formatEnglishOnly(c.Chapter_Title_English)}
                </option>
              ))}
            </select>
          </Dropdown>

          <button onClick={fetchRandomHadith} className="bg-[#134D37] hover:bg-[#0D3626] text-white font-medium rounded-xl text-sm px-8 py-3.5 transition-all shadow-md active:scale-95 h-[52px] font-serif tracking-wide shrink-0" disabled={loading}>
            {loading ? "Seeking..." : "Read Hadith"}
          </button>
        </section>

        {/* Content Card */}
        {hadith ? (
          <article className="bg-white border border-stone-100 rounded-2xl p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.03)] relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Morphing Copy Button */}
            <button 
              onClick={handleCopy}
              type="button"
              className={`group absolute top-5 right-5 flex items-center justify-center overflow-hidden rounded-full transition-all duration-300 ease-out border active:scale-90 ${
                copied 
                  ? "bg-[#E8F0EB] border-[#134D37]/30 text-[#134D37] w-28 h-10 shadow-sm" 
                  : "bg-white border-stone-200 text-stone-500 hover:text-[#134D37] hover:border-[#134D37] w-10 h-10"
              }`}
            >
              {copied ? (
                <div className="flex items-center gap-1.5 whitespace-nowrap px-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-bold text-[10px] tracking-widest uppercase">Copied</span>
                </div>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>

            <div className="flex flex-col items-center justify-center min-h-[180px] py-6">
              <p className="text-stone-800 text-xl sm:text-2xl leading-loose font-serif text-center max-w-2xl selection:bg-[#E8F0EB]">
                "{hadith.English_Text}"
              </p>
            </div>

            <footer className="mt-8 pt-6 border-t border-stone-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm font-serif">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[#134D37] font-semibold text-base">{hadith.Book}</span>
                <span className="text-stone-600 italic">{hadith["In-book reference"]}</span>
                
                {/* External Link Icon for Reference */}
                {hadith.Reference && (
                  <a href={hadith.Reference} target="_blank" rel="noopener noreferrer" className="text-stone-400 hover:text-[#134D37] transition-colors" title="View Reference">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-stone-600 text-xs hidden md:inline max-w-[200px] whitespace-normal break-words">{formatEnglishOnly(hadith.Chapter_Title_English)}</span>
                <button onClick={() => setIsReportOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-stone-600 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Report</span>
                </button>
              </div>
            </footer>
          </article>
        ) : !loading && (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-2xl text-stone-600 text-sm font-serif italic">
            Select criteria and read a hadith to begin.
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-20 py-8 text-center text-stone-600 text-[10px] tracking-[0.2em] font-serif border-t border-stone-100 w-full max-w-3xl uppercase">
        Developed by <a href="https://www.linkedin.com/in/nafis-shahriar-687402287/?skipRedirect=true" target="_blank" rel="noopener noreferrer" className="text-[#134D37] font-bold hover:underline transition-all">Nafis Shahriar</a>
      </footer>

            {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-md w-full p-10 animate-in fade-in zoom-in duration-300 overflow-hidden">
            {!isSuccess ? (
              <>
                <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">Report Issue</h2>
                <p className="text-sm text-stone-500 mb-8 font-serif">
                  Reporting <span className="text-[#134D37] font-bold">{hadith?.Book} - {hadith?.["In-book reference"]}</span>
                </p>
                
                <form onSubmit={handleReportSubmit} className="flex flex-col gap-8">
                  <div className="bg-[#F9F8F4] rounded-[24px] p-2 border border-stone-100 shadow-inner">
                    <textarea 
                      required
                      className="w-full bg-transparent border-none rounded-[20px] p-5 text-stone-700 text-sm focus:ring-0 outline-none min-h-[160px] placeholder:text-stone-400 placeholder:italic resize-none"
                      placeholder="Describe the issue (e.g., text missing, typo)..."
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-6 justify-end items-center">
                    <button type="button" onClick={() => setIsReportOpen(false)} className="text-[12px] font-bold uppercase tracking-[0.2em] text-stone-400 hover:text-stone-600 transition-colors">Cancel</button>
                    <button type="submit" className="bg-[#1D4033] text-white px-10 py-4 rounded-[18px] text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-[#134D37] shadow-lg active:scale-95 transition-all">Submit</button>
                  </div>
                </form>
              </>
            ) : (
              // সুন্দর সাকসেস মেসেজ
              <div className="py-12 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 bg-[#E8F0EB] rounded-full flex items-center justify-center mb-6">
                  <svg className="w-10 h-10 text-[#134D37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-serif font-bold text-stone-800 mb-2">Jazakallah Khair</h2>
                <p className="text-stone-500 font-serif leading-relaxed">
                  Your report has been received. <br />
                  Returning to the collection...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}