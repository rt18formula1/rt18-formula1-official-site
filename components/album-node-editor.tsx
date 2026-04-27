"use client";

import React, { useState, useCallback, useEffect } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getAlbumRelations, createAlbumRelation, deleteAlbumRelation } from "@/lib/supabase-queries";
import type { DbAlbum } from "@/lib/supabase-queries";

// Custom node component
const AlbumNode = ({ data }: { data: { album: DbAlbum } }) => {
  const { album } = data;
  const nodeColor = album.type === "backnumber" ? "bg-blue-500" : "bg-green-500";
  const albumName = album.name_ja || album.name_en;

  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 border-gray-300 ${nodeColor} text-white cursor-move hover:shadow-lg transition-shadow`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="text-sm font-medium text-center">{albumName}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// Node types
const nodeTypes = {
  album: AlbumNode,
};

interface AlbumNodeEditorProps {
  albums: DbAlbum[];
}

export function AlbumNodeEditor({ albums }: AlbumNodeEditorProps) {
  const [nodes, , onNodesChange] = useNodesState(
    albums.map((album, index) => ({
      id: album.id,
      type: "album",
      position: { x: (index % 4) * 200, y: Math.floor(index / 4) * 150 },
      data: { album },
    }))
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as any[]);
  const [loading, setLoading] = useState(true);

  // Initialize edges from album relations
  useEffect(() => {
    const initializeEdges = async () => {
      try {
        // Get album relations
        const relations = await getAlbumRelations();
        
        // Create edges from relations
        const initialEdges = relations.map((relation) => ({
          id: `${relation.parent_id}-${relation.child_id}`,
          source: relation.parent_id,
          target: relation.child_id,
          type: "smoothstep",
        }));

        setEdges(initialEdges);
      } catch (error) {
        console.error("Error initializing node editor:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeEdges();
  }, [setEdges]);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (params.source && params.target) {
        try {
          await createAlbumRelation(params.source, params.target);
          setEdges((eds) => addEdge(params, eds));
        } catch (error) {
          console.error("Error creating album relation:", error);
        }
      }
    },
    [setEdges]
  );

  const onEdgeClick = useCallback(
    async (event: React.MouseEvent, edge: { id: string; source: string; target: string }) => {
      event.stopPropagation();
      if (edge.source && edge.target) {
        try {
          await deleteAlbumRelation(edge.source, edge.target);
          setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        } catch (error) {
          console.error("Error deleting album relation:", error);
        }
      }
    },
    [setEdges]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <div className="text-gray-500">Loading album relations...</div>
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-gray-50 rounded-lg border border-gray-200">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
