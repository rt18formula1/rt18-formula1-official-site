"use client";

import React, { useState } from "react";

const LOGO_URL = "https://media.base44.com/images/public/69b87e9c6e1efd5a9a74241e/0bcbda8a2_rt18_formula1-icon.png";

interface F1ImageExportModalProps {
  output: string;
  onClose: () => void;
}

export default function F1ImageExportModal({ output, onClose }: F1ImageExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!output) return null;

  // ハッシュタグやメンションを取り除いたものをプレビュー・画像に使う
  const cleanedOutput = output
    .split("\n")
    .filter((line) => !(line.includes("#f1") || line.includes("#formula1") || line.includes("@f1") || line.includes("@rt18")))
    .join("\n")
    .trimEnd();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy text:", e);
    }
  };

  const handleExportJpeg = async () => {
    setExporting(true);
    try {
      const scale = 2;
      const width = 780 * scale;
      const paddingX = 56 * scale;
      const paddingTop = 48 * scale;
      const fontSize = 18 * scale;
      const lineHeight = fontSize * 1.6;
      const logoGap = 32 * scale;
      const logoH = 52 * scale;
      const paddingBottom = 48 * scale;

      const lines = cleanedOutput.split("\n");

      // Load logo first
      const logo = new window.Image();
      logo.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        logo.onload = () => resolve();
        logo.onerror = () => resolve();
        logo.src = LOGO_URL;
      });
      const logoAspect = logo.naturalWidth && logo.naturalHeight ? logo.naturalWidth / logo.naturalHeight : 3;
      const logoW = logoH * logoAspect;

      // Helper: measure wrapped lines using a temp canvas
      const wrapLine = (text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string[] => {
        if (!text.trim()) return [""];
        const words = text.split(" ");
        const wrapped: string[] = [];
        let current = "";
        for (const word of words) {
          const test = current ? current + " " + word : word;
          if (ctx.measureText(test).width > maxWidth && current) {
            wrapped.push(current);
            current = word;
          } else {
            current = test;
          }
        }
        if (current) wrapped.push(current);
        return wrapped;
      };

      // Step 1: measure total text height on a temp canvas
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = 100;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) throw new Error("Could not get 2d context for temp canvas");
      tempCtx.font = `${fontSize}px monospace`;
      const maxTextWidth = width - paddingX * 2;

      let totalLines = 0;
      lines.forEach((line) => {
        totalLines += wrapLine(line, maxTextWidth, tempCtx).length;
      });
      const textHeight = totalLines * lineHeight;

      // Step 2: compute canvas height to satisfy 4:5 ratio
      const contentHeight = paddingTop + textHeight + logoGap + logoH + paddingBottom;
      const requiredHeightFor45 = width * (5 / 4);
      const height = Math.max(contentHeight, requiredHeightFor45);

      // Step 3: draw on final canvas
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2d context for final canvas");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#111111";
      ctx.font = `${fontSize}px monospace`;
      ctx.textBaseline = "top";

      let y = paddingTop;
      lines.forEach((line) => {
        const wrappedLines = wrapLine(line, maxTextWidth, ctx);
        wrappedLines.forEach((wl) => {
          if (wl !== "") ctx.fillText(wl, paddingX, y);
          y += lineHeight;
        });
      });

      // Logo centered near bottom
      const logoX = (width - logoW) / 2;
      const logoY = height - paddingBottom - logoH;
      if (logo.naturalWidth) {
        ctx.drawImage(logo, logoX, logoY, logoW, logoH);
      }

      const link = document.createElement("a");
      link.download = "rt18_formula1.jpg";
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } catch (err) {
      console.error("Error exporting JPEG image:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 text-black"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <h3 className="font-semibold text-gray-900 text-[15px]">出力結果</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                <span>{copied ? "✓" : "□"}</span>
                <span>{copied ? "コピー済み" : "テキストコピー"}</span>
              </button>
              <button
                onClick={handleExportJpeg}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <span>↓</span>
                <span>{exporting ? "生成中..." : "JPEG保存"}</span>
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-gray-500">×</span>
              </button>
            </div>
          </div>

          {/* Text preview */}
          <div className="flex-1 overflow-y-auto p-5 bg-white">
            <pre className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-800 font-mono">
              {cleanedOutput}
            </pre>
          </div>
      </div>
    </div>
  );
}
