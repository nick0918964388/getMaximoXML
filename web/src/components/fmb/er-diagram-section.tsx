'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  MarkerType,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled.js';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import type { FormSpec } from '@/lib/fmb/spec-generator';
import { extractErDiagram } from '@/lib/fmb/er-diagram-extractor';
import type { ErDiagramData, ErEntity, ErRelationship } from '@/lib/fmb/er-diagram-types';
import { ErEntityNode, type ErEntityNodeData } from './er-entity-node';

const elk = new ELK();

const nodeTypes: NodeTypes = {
  erEntity: ErEntityNode,
};

const ELK_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.spacing.nodeNode': '50',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.layered.spacing.edgeNodeBetweenLayers': '30',
};

/** Estimate node dimensions based on field count */
function estimateNodeSize(entity: ErEntity): { width: number; height: number } {
  const baseHeight = 60; // header + block name
  const fieldHeight = entity.fields.length * 20;
  return {
    width: 240,
    height: Math.max(80, baseHeight + fieldHeight),
  };
}

/** Convert ErDiagramData to ReactFlow nodes (without positions — ELK will set them) */
function toReactFlowNodes(data: ErDiagramData, showExternal: boolean): Node[] {
  return data.entities
    .filter(e => showExternal || e.entityType !== 'external')
    .map(entity => ({
      id: entity.id,
      type: 'erEntity',
      position: { x: 0, y: 0 },
      data: {
        blockName: entity.blockName,
        tableName: entity.tableName,
        entityType: entity.entityType,
        fields: entity.fields,
      } satisfies ErEntityNodeData,
    }));
}

/** Convert ErDiagramData relationships to ReactFlow edges */
function toReactFlowEdges(data: ErDiagramData, showExternal: boolean): Edge[] {
  const visibleIds = new Set(
    data.entities
      .filter(e => showExternal || e.entityType !== 'external')
      .map(e => e.id)
  );

  return data.relationships
    .filter(r => visibleIds.has(r.sourceEntityId) && visibleIds.has(r.targetEntityId))
    .map(rel => ({
      id: rel.id,
      source: rel.sourceEntityId,
      target: rel.targetEntityId,
      type: 'default',
      animated: rel.lineStyle === 'dashed',
      style: {
        strokeDasharray: rel.lineStyle === 'dashed' ? '5 5' : undefined,
        stroke: rel.lineStyle === 'dashed' ? '#9ca3af' : '#374151',
      },
      label: rel.lineStyle === 'solid' ? '1:N' : rel.label,
      labelStyle: { fontSize: 10 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 15,
        height: 15,
      },
    }));
}

/** Run ELK layout and return nodes with computed positions */
async function layoutNodes(
  nodes: Node[],
  edges: Edge[],
  entities: ErEntity[]
): Promise<Node[]> {
  const entityMap = new Map(entities.map(e => [e.id, e]));

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: ELK_OPTIONS,
    children: nodes.map(node => {
      const entity = entityMap.get(node.id);
      const size = entity ? estimateNodeSize(entity) : { width: 240, height: 80 };
      return {
        id: node.id,
        width: size.width,
        height: size.height,
      };
    }),
    edges: edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layoutResult = await elk.layout(elkGraph);

  return nodes.map(node => {
    const elkNode = layoutResult.children?.find(c => c.id === node.id);
    return {
      ...node,
      position: {
        x: elkNode?.x ?? 0,
        y: elkNode?.y ?? 0,
      },
    };
  });
}

interface ErDiagramSectionProps {
  spec: FormSpec;
}

export function ErDiagramSection({ spec }: ErDiagramSectionProps) {
  const [showExternalRefs, setShowExternalRefs] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLayouting, setIsLayouting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const erData = useMemo(() => extractErDiagram(spec), [spec]);

  const hasEntities = erData.entities.some(e => e.entityType !== 'external');
  const hasExternalRefs = erData.entities.some(e => e.entityType === 'external');

  const runLayout = useCallback(async () => {
    setIsLayouting(true);
    try {
      const rawNodes = toReactFlowNodes(erData, showExternalRefs);
      const rawEdges = toReactFlowEdges(erData, showExternalRefs);
      const visibleEntities = erData.entities.filter(
        e => showExternalRefs || e.entityType !== 'external'
      );
      const layoutedNodes = await layoutNodes(rawNodes, rawEdges, visibleEntities);
      setNodes(layoutedNodes);
      setEdges(rawEdges);
    } finally {
      setIsLayouting(false);
    }
  }, [erData, showExternalRefs, setNodes, setEdges]);

  useEffect(() => {
    if (hasEntities) {
      runLayout();
    }
  }, [hasEntities, runLayout]);

  // Empty state
  if (!hasEntities) {
    return (
      <div className="space-y-2">
        <h2 className="text-lg font-semibold border-b pb-1">ER Diagram 實體關聯圖</h2>
        <div className="flex items-center gap-2 p-8 text-muted-foreground justify-center border rounded-md bg-muted/20">
          <AlertCircle className="h-5 w-5" />
          <span>無可繪製的實體資料</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold border-b pb-1">ER Diagram 實體關聯圖</h2>
        {hasExternalRefs && (
          <div className="flex items-center gap-2">
            <Switch
              id="show-external"
              checked={showExternalRefs}
              onCheckedChange={setShowExternalRefs}
            />
            <Label htmlFor="show-external" className="text-sm">
              顯示 LOV 外部參照
            </Label>
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="er-diagram-container border rounded-md bg-white"
        style={{ height: 500 }}
      >
        {isLayouting ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            計算佈局中...
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
          >
            <Background />
            <Controls showInteractive={false} />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
