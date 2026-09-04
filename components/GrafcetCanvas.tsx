'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from '@xyflow/react';
import { GrafcetData } from '@/lib/types';

interface GrafcetCanvasProps {
  data?: GrafcetData;
}

export function GrafcetCanvas({ data }: GrafcetCanvasProps) {
  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Protection contre les données manquantes ou mal formées
    if (!data || !Array.isArray(data.steps) || !Array.isArray(data.transitions)) {
      return { nodes, edges };
    }

    const ySpacing = 120;

    data.steps.forEach((step, index) => {
      if (!step) return;

      const stepY = index * ySpacing * 2 + 50;
      const actions = Array.isArray(step.actions) ? step.actions : [];

      nodes.push({
        id: step.id,
        position: { x: 250, y: stepY },
        data: {
          label: (
            <div className={`p-3 border-2 ${step.type === 'initial' ? 'border-double border-4 border-blue-600' : 'border-gray-800'} bg-white rounded shadow-md min-w-[120px] text-center`}>
              <div className="font-bold border-b border-gray-300 pb-1">{step.label || step.id}</div>
              {actions.map((act) => (
                <div key={act.id || Math.random()} className="text-xs mt-1 bg-gray-100 p-1 rounded border border-gray-200">
                  {act.qualifier && <span className="font-semibold text-blue-600 mr-1">[{act.qualifier}]</span>}
                  {act.description}
                </div>
              ))}
            </div>
          ),
        },
        type: 'default',
        style: { background: 'transparent', border: 'none', width: 'auto' },
      });

      const transition = data.transitions.find(
        (t) => t && Array.isArray(t.fromSteps) && t.fromSteps.includes(step.id)
      );

      if (transition) {
        const transY = stepY + ySpacing;
        const transNodeId = `trans-${transition.id}`;

        nodes.push({
          id: transNodeId,
          position: { x: 235, y: transY },
          data: {
            label: (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-1 bg-black"></div>
                <span className="text-xs font-semibold text-red-600 bg-white px-1 border border-red-200 rounded">
                  {transition.receptivity}
                </span>
              </div>
            ),
          },
          type: 'default',
          style: { background: 'transparent', border: 'none', width: 'auto' },
        });

        edges.push({
          id: `e-${step.id}-${transNodeId}`,
          source: step.id,
          target: transNodeId,
          type: 'straight',
          style: { stroke: '#000', strokeWidth: 2 },
        });

        const toSteps = Array.isArray(transition.toSteps) ? transition.toSteps : [];
        toSteps.forEach((targetStepId) => {
          edges.push({
            id: `e-${transNodeId}-${targetStepId}`,
            source: transNodeId,
            target: targetStepId,
            type: 'straight',
            markerEnd: { type: MarkerType.ArrowClosed, color: '#000' },
            style: { stroke: '#000', strokeWidth: 2 },
          });
        });
      }
    });

    return { nodes, edges };
  }, [data]);

  if (!data) {
    return (
      <div className="w-full h-[600px] border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
        Aucune donnée GRAFCET à afficher.
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] border border-gray-300 rounded-lg bg-gray-50">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background color="#ccc" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}