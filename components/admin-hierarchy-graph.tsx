"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { DbAlbum } from "@/lib/supabase-queries";

type NodePos = { x: number; y: number; w: number; h: number };

export function AdminHierarchyGraph({
  albums,
  onDeleteAlbum,
  onCreateChild,
}: {
  albums: DbAlbum[];
  onDeleteAlbum: (id: string) => void;
  onCreateChild: (parentId: string | null, type: "portfolio" | "backnumber") => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [positions, setPositions] = useState<Map<string, NodePos>>(new Map());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const portfolioRoots = albums.filter(a => a.type === "portfolio" && !a.parent_id);
  const backnumberRoots = albums.filter(a => a.type === "backnumber" && !a.parent_id);
  const getChildren = useCallback((parentId: string) => albums.filter(a => a.parent_id === parentId), [albums]);

  const measureNodes = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const newPositions = new Map<string, NodePos>();
    nodeRefs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect();
      newPositions.set(id, {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top,
        w: rect.width,
        h: rect.height,
      });
    });
    setPositions(newPositions);
  }, []);

  useEffect(() => {
    const timer = setTimeout(measureNodes, 100);
    window.addEventListener("resize", measureNodes);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureNodes);
    };
  }, [albums, measureNodes]);

  const connections: { from: string; to: string }[] = [];
  albums.forEach(album => {
    if (album.parent_id) {
      connections.push({ from: album.parent_id, to: album.id });
    }
  });

  const renderNode = (album: DbAlbum, depth: number = 0) => {
    const children = getChildren(album.id);
    const isSelected = selectedNode === album.id;
    const typeColor = album.type === "portfolio" ? "border-blue-400" : "border-orange-400";
    const typeBg = album.type === "portfolio" ? "bg-blue-50" : "bg-orange-50";
    const typeBadge = album.type === "portfolio" ? "bg-blue-500" : "bg-orange-500";

    return (
      <div key={album.id} className="flex flex-col items-center">
        <div
          ref={(el) => { if (el) nodeRefs.current.set(album.id, el); else nodeRefs.current.delete(album.id); }}
          onClick={() => setSelectedNode(isSelected ? null : album.id)}
          className={`relative border-2 ${typeColor} rounded-2xl p-3 w-44 cursor-pointer transition-all hover:shadow-lg ${isSelected ? "shadow-xl ring-2 ring-black/20" : "shadow-sm"} ${typeBg}`}
        >
          <span className={`absolute -top-2.5 left-3 text-[9px] font-black text-white px-2 py-0.5 rounded-full ${typeBadge}`}>
            {album.type === "portfolio" ? "ALBUM" : "BACKNUMBER"}
          </span>

          <div className="flex items-center gap-2 mt-1">
            <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden border border-black/10 bg-white">
              {album.cover_image_url ? (
                <img src={album.cover_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm">📁</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-xs truncate leading-tight">{album.name_en}</p>
              {album.name_ja && album.name_ja !== album.name_en && (
                <p className="text-[10px] text-gray-500 truncate">{album.name_ja}</p>
              )}
            </div>
          </div>

          {isSelected && (
            <div className="mt-2 pt-2 border-t border-black/10 flex gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); onCreateChild(album.id, album.type); }}
                className="flex-1 text-[10px] font-bold bg-black text-white rounded-lg py-1.5 hover:bg-black/80 transition"
              >
                + Child
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${album.name_en}"?`)) onDeleteAlbum(album.id); }}
                className="text-[10px] font-bold text-red-500 border border-red-200 rounded-lg px-2 py-1.5 hover:bg-red-50 transition"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {children.length > 0 && (
          <div className="flex gap-6 mt-10 relative">
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const svgHeight = containerRef.current?.scrollHeight ?? 0;
  const svgWidth = containerRef.current?.scrollWidth ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs font-bold text-gray-500">Portfolio Albums</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs font-bold text-gray-500">Backnumbers</span>
        </div>
      </div>

      <div ref={containerRef} className="relative overflow-x-auto pb-8 min-h-[200px]">
        {/* SVG Arrow Layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={svgWidth || "100%"}
          height={svgHeight || "100%"}
          style={{ overflow: "visible" }}
        >
          <defs>
            <marker
              id="arrow-portfolio"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#3B82F6" />
            </marker>
            <marker
              id="arrow-backnumber"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#F97316" />
            </marker>
          </defs>
          {connections.map(({ from, to }) => {
            const fromPos = positions.get(from);
            const toPos = positions.get(to);
            if (!fromPos || !toPos) return null;
            const targetAlbum = albums.find(a => a.id === to);
            const color = targetAlbum?.type === "portfolio" ? "#3B82F6" : "#F97316";
            const markerId = targetAlbum?.type === "portfolio" ? "arrow-portfolio" : "arrow-backnumber";

            const x1 = fromPos.x;
            const y1 = fromPos.y + fromPos.h;
            const x2 = toPos.x;
            const y2 = toPos.y;
            const midY = (y1 + y2) / 2;

            return (
              <path
                key={`${from}-${to}`}
                d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeDasharray={targetAlbum?.type !== albums.find(a => a.id === from)?.type ? "6 3" : "none"}
                markerEnd={`url(#${markerId})`}
              />
            );
          })}
        </svg>

        {/* Node Tree Layout */}
        <div className="relative flex gap-20 justify-center pt-4">
          {/* Portfolio Albums Tree */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-blue-600">Portfolio Albums</h3>
              <button
                onClick={() => onCreateChild(null, "portfolio")}
                className="text-[10px] font-bold bg-blue-500 text-white rounded-full px-3 py-1 hover:bg-blue-600 transition"
              >
                + New
              </button>
            </div>
            <div className="flex gap-6">
              {portfolioRoots.length > 0 ? (
                portfolioRoots.map(root => renderNode(root))
              ) : (
                <p className="text-xs text-gray-400 italic">No portfolio albums</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px bg-black/10 self-stretch" />

          {/* Backnumber Tree */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-orange-600">Backnumbers</h3>
              <button
                onClick={() => onCreateChild(null, "backnumber")}
                className="text-[10px] font-bold bg-orange-500 text-white rounded-full px-3 py-1 hover:bg-orange-600 transition"
              >
                + New
              </button>
            </div>
            <div className="flex gap-6">
              {backnumberRoots.length > 0 ? (
                backnumberRoots.map(root => renderNode(root))
              ) : (
                <p className="text-xs text-gray-400 italic">No backnumbers</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
