"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useCallback, useEffect } from "react";
import {
  ReactFlow,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
  BackgroundVariant,
  MarkerType,
  Node,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getAlbumRelations, getAlbumsByType } from "@/lib/supabase-queries";
import { supabase } from "@/lib/supabaseClient";

const AlbumNode = ({ data }: { data: any }) => {
  const bg = data.albumType === "backnumber" ? "#dbeafe" : "#d1fae5";
  const border = data.albumType === "backnumber" ? "2px solid #3b82f6" : "2px solid #10b981";
  return (
    <div style={{ background: bg, border, borderRadius: 6, padding: "8px 14px", minWidth: 140, textAlign: "center", fontSize: 12, fontWeight: 500, cursor: "grab" }}>
      <Handle type="target" position={Position.Top} style={{ width: 10, height: 10, background: "#888" }} />
      <div style={{ pointerEvents: "none" }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ width: 10, height: 10, background: "#555" }} />
    </div>
  );
};

const nodeTypes = { album: AlbumNode };

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as any[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as any[]);

  useEffect(() => {
    const init = async () => {
      const [portfolioAlbums, backnumberAlbums] = await Promise.all([
        getAlbumsByType("portfolio"),
        getAlbumsByType("backnumber"),
      ]);
      const allAlbums = [...portfolioAlbums, ...backnumberAlbums];
      const initialNodes = allAlbums.map((album: any) => ({
        id: album.id,
        type: "album",
        data: { label: album.name_ja || album.name_en, albumType: album.type },
        position: { x: Number(album.position_x) || 0, y: Number(album.position_y) || 0 },
      }));
      const relations: any[] = await getAlbumRelations();
      const initialEdges = relations.map((r) => ({
        id: `${r.parent_id}__${r.child_id}`,
        source: r.parent_id,
        target: r.child_id,
        markerEnd: { type: MarkerType.ArrowClosed },
      }));
      setNodes(initialNodes as any);
      setEdges(initialEdges as any);
    };
    init();
  }, [setNodes, setEdges]);

  const onConnect = useCallback(async (params: Connection) => {
    console.log("onConnect fired:", params);
    if (!supabase || !params.source || !params.target) return;
    const newEdge = {
      ...params,
      id: `${params.source}__${params.target}`,
      markerEnd: { type: MarkerType.ArrowClosed },
    };
    setEdges((eds: any[]) => addEdge(newEdge, eds) as any[]);
    const { error } = await supabase.from("album_relations").insert({
      parent_id: params.source,
      child_id: params.target,
      sort_order: 0,
    });
    if (error) console.error("Insert failed:", error);
  }, [setEdges]);

  const onEdgeClick = useCallback(async (_: React.MouseEvent, edge: any) => {
    if (!supabase) return;
    setEdges((eds: any[]) => eds.filter((e: any) => e.id !== edge.id));
    const { error } = await supabase.from("album_relations")
      .delete().eq("parent_id", edge.source).eq("child_id", edge.target);
    if (error) console.error("Delete failed:", error);
  }, [setEdges]);

  const onNodeDragStop = useCallback(async (_: React.MouseEvent, node: Node) => {
    if (!supabase) return;
    await supabase.from("albums")
      .update({ position_x: node.position.x, position_y: node.position.y })
      .eq("id", node.id);
  }, []);

  const handleAutoLayout = useCallback(async () => {
    if (!supabase) return;
    const { data: relations } = await supabase.from("album_relations").select("*");
    const [portfolioAlbums, backnumberAlbums] = await Promise.all([
      getAlbumsByType("portfolio"),
      getAlbumsByType("backnumber"),
    ]);
    const allAlbums = [...portfolioAlbums, ...backnumberAlbums];
    const childIds = new Set((relations || []).map((r: any) => r.child_id));
    const rootNodes = allAlbums.filter((a: any) => !childIds.has(a.id));
    const layout: { [key: string]: { level: number; index: number } } = {};
    const levels: string[][] = [rootNodes.map((n: any) => n.id)];
    rootNodes.forEach((n: any, i: number) => { layout[n.id] = { level: 0, index: i }; });
    let cur = 0;
    while (levels[cur]?.length) {
      const next: string[] = [];
      levels[cur].forEach((pid) => {
        (relations || []).filter((r: any) => r.parent_id === pid).forEach((r: any) => {
          if (!layout[r.child_id]) {
            layout[r.child_id] = { level: cur + 1, index: next.length };
            next.push(r.child_id);
          }
        });
      });
      if (next.length) levels[cur + 1] = next;
      cur++;
    }
    await Promise.all(Object.entries(layout).map(([id, { level, index }]) =>
      supabase!.from("albums").update({ position_x: (index + 1) * 220, position_y: level * 180 }).eq("id", id)
    ));
    setNodes((prev: any[]) => prev.map((n: any) => {
      const l = layout[n.id];
      return l ? { ...n, position: { x: (l.index + 1) * 220, y: l.level * 180 } } : n;
    }));
  }, [setNodes]);

  return (
    <div style={{ height: 600, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
      <div style={{ padding: 8, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleAutoLayout} style={{ padding: "4px 12px", background: "#22c55e", color: "#fff", fontSize: 12, fontWeight: 700, borderRadius: 4, border: "none", cursor: "pointer" }}>
          Auto Layout
        </button>
      </div>
      <div style={{ height: 550 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}

export function AlbumNodeEditor() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}