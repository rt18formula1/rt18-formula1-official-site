"use client";

import { useState, useEffect } from "react";

export function ShareButtons({ title }: { title: string }) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCurrentUrl(window.location.href);
    setCanShare(!!navigator.share);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = currentUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: currentUrl });
      } catch {
        // user cancelled
      }
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 py-8 border-y border-black/5">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mr-2">Share</span>
      
      {/* X (Twitter) */}
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X
      </a>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
          copied 
            ? "bg-green-500 text-white scale-105" 
            : "bg-gray-100 text-black hover:bg-gray-200 hover:scale-105"
        }`}
      >
        {copied ? (
          <>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-[3]"><path d="M5 13l4 4L19 7"/></svg>
            Copied!
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
            Copy Link
          </>
        )}
      </button>

      {/* Native Share (Other) */}
      {canShare && (
        <button
          onClick={handleNativeShare}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-black rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 hover:scale-105 transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4-4 4m4-4v13"/></svg>
          Other
        </button>
      )}
    </div>
  );
}
