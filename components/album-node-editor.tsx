"use client";

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
  Edge,
  Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getAlbumRelations, getAlbumsByType } from "@/lib/supabase-queries";
import { supabase } from "@/lib/supabaseClient";

type AlbumNodeData = { label: string; type: string };

const AlbumNode = ({ data }: { data: AlbumNodeData }) => {
  const bg = data.type === "backnumber" ? "#dbeafe" : "#d1fae5";
  const border = data.type === "backnumber" ? "1px solid #3b82f6" : "1px solid #10b981";
  return (
    <div style={{ background: bg, border, borderRadius: 6, padding: "8px 14px", minWidth: 120, textAlign: "center", fontSize: 12, fontWeight: 500 }}>
      <Handle type="target" position={Position.Top} />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const nodeTypes = { album: AlbumNode };

export function AlbumNodeEditor() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<AlbumNodeData>>([] as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([] as any);

  useEffect(() => {
    const init = async () => {
      const [portfolioAlbums, backnumberAlbums] = await Promise.all([
        getAlbumsByType("portfolio"),
        getAlbumsByType("backnumber"),
      ]);
      const allAlbums = [...portfolioAlbums, ...backnumberAlbums];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const initialNodes: Node<AlbumNodeData>[] = allAlbums.map((album: any) => ({
        id: album.id,
        type: "album",
        data: { label: album.name_ja || album.name_en, type: album.type },
        position: { x: album.position_x || 0, y: album.position_y || 0 },
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const relations: any[] = await getAlbumRelations();
      const initialEdges: Edge[] = relations.map((r) => ({
        id: `${r.parent_id}-${r.child_id}`,
        source: r.parent_id,
        target: r.child_id,
        markerEnd: { type: MarkerType.ArrowClosed },
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setNodes(initialNodes as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setEdges(initialEdges as any);
    };
    init();
  }, [setNodes, setEdges]);

  const onConnect = useCallback(async (params: Connection) => {
    if (!supabase || !params.source || !params.target) return;
    const { error } = await supabase.from("album_relations").insert({
      parent_id: params.source,
      child_id: params.target,
      sort_order: 0,
    });
    if (error) { console.error("Insert failed:", error); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEdges((eds: any) => addEdge({ ...params, markerEnd: { type: MarkerType.ArrowClosed } }, eds));
  }, [setEdges]);

  const onEdgeClick = useCallback(async (_: React.MouseEvent, edge: Edge) => {
    if (!supabase) return;
    const { error } = await supabase.from("album_relations")
      .delete().eq("parent_id", edge.source).eq("child_id", edge.target);
    if (error) { console.error("Delete failed:", error); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setEdges((eds: any) => eds.filter((e: Edge) => e.id !== edge.id));
  }, [setEdges]);

  const onNodeDragStop = useCallback(async (_: React.MouseEvent, node: Node) => {
    if (!supabase) return;
    await supabase.from("albums").update({ position_x: node.position.x, position_y: node.position.y }).eq("id", node.id);
  }, []);

  const handleAutoLayout = useCallback(async () => {
    if (!supabase) return;
    const { data: relations } = await supabase.from("album_relations").select("*");
    const [portfolioAlbums, backnumberAlbums] = await Promise.all([
      getAlbumsByType("portfolio"),
      getAlbumsByType("backnumber"),
    ]);
    const allAlbums = [...portfolioAlbums, ...backnumberAlbums];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const childIds = new Set((relations || []).map((r: any) => r.child_id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rootNodes = allAlbums.filter((a: any) => !childIds.has(a.id));
    const layout: { [key: string]: { level: number; index: number } } = {};
    const levels: string[][] = [rootNodes.map((n: { id: string }) => n.id)];
    rootNodes.forEach((n: { id: string }, i: number) => { layout[n.id] = { level: 0, index: i }; });
    let cur = 0;
    while (levels[cur]?.length) {
      const next: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      levels[cur].forEach((pid) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setNodes((prev: any) => prev.map((n: Node) => {
      const l = layout[n.id];
      return l ? { ...n, position: { x: (l.index + 1) * 220, y: l.level * 180 } } : n;
    }));
  }, [setNodes]);

  return (
    <div className="h-[600px] bg-gray-50 rounded-lg border border-gray-200">
      <div className="p-2 border-b border-gray-200 flex justify-end">
        <button onClick={handleAutoLayout} className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600 transition">
          Auto Layout
        </button>
      </div>
      <div className="h-[550px]">
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