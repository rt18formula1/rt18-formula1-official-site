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
  MarkerType,
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
            x: album.position_x || 0, 
            y: album.position_y || 0 
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

  const onConnect = useCallback(async (params: Connection) => {
  console.log('onConnect fired:', params); // デバッグ用

  if (!supabase) {
    console.error("Supabase client not initialized");
    return;
  }

  const { error } = await supabase
    .from('album_relations')
    .insert({
      parent_id: params.source,
      child_id: params.target,
      sort_order: 0,
    });

  if (error) {
    console.error('Insert failed:', error);
    return;
  }

  setEdges((eds) =>
    addEdge(
      { ...params, markerEnd: { type: MarkerType.ArrowClosed } },
      eds
    )
  );
}, [setEdges]);

  const handleEdgesChange = useCallback(
    async (changes: any) => {
      for (const change of changes) {
        if (change.type === 'remove' && change.id) {
          try {
            // Supabaseから削除
            if (!supabase) {
              console.error("Supabase client not initialized");
              return;
            }
            
            // edge.idからsourceとtargetを抽出
            const edgeId = change.id;
            const [source, target] = edgeId.split('-');
            
            const { error } = await supabase.from('album_relations')
              .delete()
              .eq('parent_id', source)
              .eq('child_id', target);
            
            if (error) {
              console.error("Error deleting album relation:", error);
              return;
            }
          } catch (error) {
            console.error("Error deleting album relation:", error);
          }
        }
      }
      
      // UIに反映
      onEdgesChange(changes);
    },
    [onEdgesChange]
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

  const handleAutoLayout = useCallback(async () => {
    try {
      if (!supabase) {
        console.error("Supabase client not initialized");
        return;
      }

      // Get all relations
      const { data: relations, error: relationsError } = await supabase
        .from('album_relations')
        .select('*');
      
      if (relationsError) {
        console.error("Error fetching relations:", relationsError);
        return;
      }

      // Get all albums
      const [portfolioAlbums, backnumberAlbums] = await Promise.all([
        getAlbumsByType("portfolio"),
        getAlbumsByType("backnumber"),
      ]);
      
      const allAlbums = [...portfolioAlbums, ...backnumberAlbums];

      // Find root nodes (albums that are never children)
      const childIds = new Set(relations?.map(r => r.child_id) || []);
      const rootNodes = allAlbums.filter(album => !childIds.has(album.id));

      // BFS to calculate hierarchy
      const layout: { [key: string]: { level: number; index: number } } = {};
      const levels: string[][] = [];
      
      // Initialize level 0 with root nodes
      levels[0] = rootNodes.map(node => node.id);
      rootNodes.forEach((node, index) => {
        layout[node.id] = { level: 0, index };
      });

      // Process each level
      let currentLevel = 0;
      while (levels[currentLevel] && levels[currentLevel].length > 0) {
        const nextLevel: string[] = [];
        
        levels[currentLevel].forEach(parentId => {
          const children = relations?.filter(r => r.parent_id === parentId) || [];
          children.forEach(child => {
            if (!layout[child.child_id]) {
              layout[child.child_id] = { level: currentLevel + 1, index: nextLevel.length };
              nextLevel.push(child.child_id);
            }
          });
        });
        
        if (nextLevel.length > 0) {
          levels[currentLevel + 1] = nextLevel;
        }
        currentLevel++;
      }

      // Calculate positions and update database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: Promise<any>[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedNodes: any[] = [];

      Object.entries(layout).forEach(([albumId, { level, index }]) => {
        const x = (index + 1) * 200; // Horizontal spacing
        const y = level * 200; // Vertical spacing
        
        if (supabase) {
          updates.push(
            Promise.resolve(
              supabase.from('albums').update({
                position_x: x,
                position_y: y,
              }).eq('id', albumId)
            )
          );
        }

        // Update node state
        const nodeIndex = nodes.findIndex(n => n.id === albumId);
        if (nodeIndex !== -1) {
          updatedNodes.push({
            ...nodes[nodeIndex],
            position: { x, y }
          });
        }
      });

      // Execute all updates
      await Promise.all(updates);
      
      // Update UI
      setNodes(prevNodes => 
        prevNodes.map(node => {
          const layoutInfo = layout[node.id];
          if (layoutInfo) {
            return {
              ...node,
              position: { 
                x: (layoutInfo.index + 1) * 200,
                y: layoutInfo.level * 200
              }
            };
          }
          return node;
        })
      );

    } catch (error) {
      console.error("Error in auto layout:", error);
    }
  }, [nodes, setNodes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
        <div className="text-gray-500">Loading album relations...</div>
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-gray-50 rounded-lg border border-gray-200">
      <div className="p-2 border-b border-gray-200 flex justify-end">
        <button
          onClick={handleAutoLayout}
          className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded hover:bg-green-600 transition"
        >
          Auto Layout
        </button>
      </div>
      <div className="h-[550px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
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
