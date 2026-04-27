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
import { getAlbumRelations, getAlbumsByType } from "@/lib/supabase-queries";
import { supabase } from "@/lib/supabaseClient";

// Custom node component
const AlbumNode = ({ data }: { data: { label: string; type: string } }) => {
  const { label, type } = data;
  const nodeColor = type === "backnumber" ? "bg-blue-500" : "bg-green-500";

  return (
    <div
      className={`px-4 py-2 rounded-lg border-2 border-gray-300 ${nodeColor} text-white cursor-move hover:shadow-lg transition-shadow`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="text-sm font-medium text-center">{label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// Node types
const nodeTypes = {
  album: AlbumNode,
};


export function AlbumNodeEditor() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nodes, setNodes, onNodesChange] = useNodesState([] as any[]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as any[]);
  const [loading, setLoading] = useState(true);

  // Initialize nodes and edges from Supabase
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get all albums from both types
        const [portfolioAlbums, backnumberAlbums] = await Promise.all([
          getAlbumsByType("portfolio"),
          getAlbumsByType("backnumber"),
        ]);
        
        const allAlbums = [...portfolioAlbums, ...backnumberAlbums];
        
        // Create nodes from albums
        const initialNodes = allAlbums.map((album) => ({
          id: album.id,
          data: { 
            label: album.name_ja || album.name_en,
            type: album.type
          },
          position: { 
            x: album.position_x ?? Math.random() * 400, 
            y: album.position_y ?? Math.random() * 400 
          },
          style: {
            background: album.type === 'backnumber' ? '#dbeafe' : '#d1fae5',
            border: album.type === 'backnumber' ? '1px solid #3b82f6' : '1px solid #10b981',
          }
        }));

        // Get album relations
        const relations = await getAlbumRelations();
        
        // Create edges from relations
        const initialEdges = relations.map((relation) => ({
          id: `${relation.parent_id}-${relation.child_id}`,
          source: relation.parent_id,
          target: relation.child_id,
          markerEnd: { type: 'arrowclosed' },
        }));

        setNodes(initialNodes);
        setEdges(initialEdges);
      } catch (error) {
        console.error("Error initializing node editor:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [setNodes, setEdges]);

  const onConnect = useCallback(
    async (params: Connection) => {
      if (params.source && params.target) {
        try {
          // Supabaseに保存
          if (!supabase) {
            console.error("Supabase client not initialized");
            return;
          }
          
          const { error } = await supabase.from('album_relations').insert({
            parent_id: params.source,
            child_id: params.target,
            sort_order: 0,
          });
          
          if (error) {
            console.error("Error creating album relation:", error);
            return;
          }
          
          // UIに反映
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
          // Supabaseから削除
          if (!supabase) {
            console.error("Supabase client not initialized");
            return;
          }
          
          const { error } = await supabase.from('album_relations')
            .delete()
            .eq('parent_id', edge.source)
            .eq('child_id', edge.target);
          
          if (error) {
            console.error("Error deleting album relation:", error);
            return;
          }
          
          // UIに反映
          setEdges((eds) => eds.filter((e) => e.id !== edge.id));
        } catch (error) {
          console.error("Error deleting album relation:", error);
        }
      }
    },
    [setEdges]
  );

  const onNodeDragStop = useCallback(
    async (event: React.MouseEvent, node: { id: string; position: { x: number; y: number } }) => {
      try {
        // Supabaseに位置を保存
        if (!supabase) {
          console.error("Supabase client not initialized");
          return;
        }
        
        const { error } = await supabase.from('albums').update({
          position_x: node.position.x,
          position_y: node.position.y,
        }).eq('id', node.id);
        
        if (error) {
          console.error("Error updating album position:", error);
        }
      } catch (error) {
        console.error("Error updating album position:", error);
      }
    },
    []
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
  );
}
