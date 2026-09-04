'use client';

import React, { useMemo } from 'react';
import { GrafcetData, Variable } from '@/lib/types';
import { extractVariables } from '@/lib/variables';

interface GrafcetCanvasProps {
  data?: GrafcetData;
}

const COL_W = 170;
const ROW_H = 150;
const MARGIN_X = 110;
const MARGIN_Y = 60;
const BOX_W = 120;

interface StepPos {
  col: number;
  row: number;
}

interface SimpleBar {
  transitionId: string;
  receptivity: string;
  fromRow: number;
  col: number;
}

interface BranchBar {
  kind: 'divergence' | 'convergence';
  isAnd: boolean;
  row: number;
  colStart: number;
  colEnd: number;
  trunkCol: number;
  branches: { col: number; row: number }[];
  receptivity?: string;
}

interface LoopEdge {
  fromStepId: string;
  toStepId: string;
}

function buildLayout(data?: GrafcetData) {
  const positions = new Map<string, StepPos>();
  const simpleBars: SimpleBar[] = [];
  const branchBars: BranchBar[] = [];
  const loopEdges: LoopEdge[] = [];
  let maxCol = 0;
  let maxRow = 0;

  if (!data || !Array.isArray(data.steps) || !Array.isArray(data.transitions)) {
    return { positions, simpleBars, branchBars, loopEdges, maxCol, maxRow };
  }

  const steps = data.steps.filter(Boolean);
  const transitions = data.transitions.filter(Boolean);
  const stepIds = new Set(steps.map((s) => s.id));
  const visiting = new Set<string>();

  const outgoingSimple = (stepId: string) =>
    transitions.filter(
      (t) => Array.isArray(t.fromSteps) && t.fromSteps.length === 1 && t.fromSteps[0] === stepId
    );

  function place(stepId: string, col: number, row: number): { tip: string; tipRow: number; width: number } {
    if (!stepIds.has(stepId)) {
      return { tip: stepId, tipRow: row, width: 1 };
    }
    if (positions.has(stepId)) {
      return { tip: stepId, tipRow: positions.get(stepId)!.row, width: 0 };
    }

    positions.set(stepId, { col, row });
    maxRow = Math.max(maxRow, row);
    maxCol = Math.max(maxCol, col);
    visiting.add(stepId);

    const outs = outgoingSimple(stepId);
    let result: { tip: string; tipRow: number; width: number };

    if (outs.length === 0) {
      result = { tip: stepId, tipRow: row, width: 1 };
    } else if (outs.length === 1 && outs[0].toSteps.length <= 1) {
      const t = outs[0];
      const targetId = t.toSteps[0];
      simpleBars.push({ transitionId: t.id, receptivity: t.receptivity, fromRow: row, col });

      if (!targetId) {
        result = { tip: stepId, tipRow: row, width: 1 };
      } else if (positions.has(targetId) || visiting.has(targetId)) {
        loopEdges.push({ fromStepId: stepId, toStepId: targetId });
        result = { tip: stepId, tipRow: row, width: 1 };
      } else {
        const child = place(targetId, col, row + 1);
        result = { tip: child.tip, tipRow: child.tipRow, width: Math.max(1, child.width) };
      }
    } else {
      const isAnd = outs.length === 1 && outs[0].toSteps.length > 1;
      const branchDefs = isAnd
        ? outs[0].toSteps.map((tid) => ({ targetId: tid, receptivity: outs[0].receptivity, transitionId: outs[0].id }))
        : outs.map((t) => ({ targetId: t.toSteps[0], receptivity: t.receptivity, transitionId: t.id }));

      let c = col;
      const branchResults: { tip: string; tipRow: number; colStart: number; colEnd: number }[] = [];

      branchDefs.forEach((bd) => {
        const startCol = c;
        if (!bd.targetId || positions.has(bd.targetId) || visiting.has(bd.targetId)) {
          if (bd.targetId) loopEdges.push({ fromStepId: stepId, toStepId: bd.targetId });
          branchResults.push({
            tip: bd.targetId || stepId,
            tipRow: bd.targetId ? positions.get(bd.targetId)?.row ?? row : row,
            colStart: startCol,
            colEnd: startCol,
          });
          c += 1;
        } else {
          const r = place(bd.targetId, startCol, row + 1);
          branchResults.push({ tip: r.tip, tipRow: r.tipRow, colStart: startCol, colEnd: startCol + Math.max(1, r.width) - 1 });
          c += Math.max(1, r.width);
        }
      });

      const totalWidth = c - col;
      const centerCol = col + (totalWidth - 1) / 2;
      positions.set(stepId, { col: centerCol, row });
      maxCol = Math.max(maxCol, c - 1);

      branchBars.push({
        kind: 'divergence',
        isAnd,
        row: row + 0.5,
        colStart: branchResults[0].colStart,
        colEnd: branchResults[branchResults.length - 1].colEnd,
        trunkCol: centerCol,
        branches: branchResults.map((br) => ({ col: (br.colStart + br.colEnd) / 2, row: row + 1 })),
        receptivity: isAnd ? outs[0].receptivity : undefined,
      });

      if (!isAnd) {
        branchResults.forEach((br, i) => {
          simpleBars.push({
            transitionId: branchDefs[i].transitionId,
            receptivity: branchDefs[i].receptivity,
            fromRow: row + 0.5,
            col: (br.colStart + br.colEnd) / 2,
          });
        });
      }

      const tips = branchResults.map((b) => b.tip);
      const maxTipRow = Math.max(...branchResults.map((b) => b.tipRow), row + 1);

      const convT = transitions.find((t) => {
        if (!Array.isArray(t.fromSteps) || t.fromSteps.length !== tips.length) return false;
        const a = [...t.fromSteps].sort();
        const b = [...tips].sort();
        return a.every((v, i) => v === b[i]);
      });

      if (convT) {
        branchBars.push({
          kind: 'convergence',
          isAnd: convT.fromSteps.length > 1,
          row: maxTipRow + 0.5,
          colStart: branchResults[0].colStart,
          colEnd: branchResults[branchResults.length - 1].colEnd,
          trunkCol: centerCol,
          branches: branchResults.map((br) => ({ col: (br.colStart + br.colEnd) / 2, row: br.tipRow })),
          receptivity: convT.fromSteps.length > 1 ? convT.receptivity : undefined,
        });

        const nextId = convT.toSteps[0];
        if (nextId && !positions.has(nextId) && !visiting.has(nextId)) {
          const child = place(nextId, centerCol, maxTipRow + 1);
          result = { tip: child.tip, tipRow: child.tipRow, width: totalWidth };
        } else {
          result = { tip: stepId, tipRow: maxTipRow, width: totalWidth };
        }
      } else {
        result = { tip: stepId, tipRow: maxTipRow, width: totalWidth };
      }
    }

    visiting.delete(stepId);
    return result;
  }

  const targeted = new Set<string>();
  transitions.forEach((t) => (t.toSteps || []).forEach((id) => targeted.add(id)));
  const roots = steps.filter((s) => !targeted.has(s.id));
  const startRoots = roots.length > 0 ? roots : steps.slice(0, 1);

  let col = 0;
  startRoots.forEach((r) => {
    if (!positions.has(r.id)) {
      const res = place(r.id, col, 0);
      col += Math.max(1, res.width);
    }
  });

  return { positions, simpleBars, branchBars, loopEdges, maxCol: Math.max(maxCol, col - 1), maxRow };
}

export function GrafcetCanvas({ data }: GrafcetCanvasProps) {
  const layout = useMemo(() => buildLayout(data), [data]);

  if (!data) {
    return (
      <div className="w-full h-[600px] border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
        Aucune donnée GRAFCET à afficher.
      </div>
    );
  }

  const stepsById = new Map(data.steps.filter(Boolean).map((s) => [s.id, s]));
  const toPxX = (col: number) => MARGIN_X + col * COL_W;
  const toPxY = (row: number) => MARGIN_Y + row * ROW_H;

  const width = MARGIN_X * 2 + (layout.maxCol + 1) * COL_W;
  const height = MARGIN_Y * 2 + (layout.maxRow + 1) * ROW_H + 40;

  const variables: Variable[] =
    Array.isArray(data.variables) && data.variables.length > 0 ? data.variables : extractVariables(data);

  return (
    <div className="space-y-4">
      <div className="w-full border border-gray-300 rounded-lg bg-gray-50 overflow-auto" style={{ maxHeight: 650 }}>
        <div className="relative" style={{ width, height, minWidth: '100%' }}>
          {/* Titres des séquences (chartTitle) au-dessus de chaque étape initiale */}
          {Array.from(layout.positions.entries()).map(([stepId, pos]) => {
            const step = stepsById.get(stepId);
            if (!step || step.type !== 'initial' || !step.chartTitle) return null;
            const x = toPxX(pos.col);
            const y = toPxY(pos.row);
            return (
              <div
                key={`title-${stepId}`}
                className="absolute z-10 text-center text-xs font-semibold text-gray-600 whitespace-nowrap"
                style={{ left: x - COL_W / 2, top: y - 26, width: COL_W }}
              >
                {step.chartTitle}
              </div>
            );
          })}

          {/* Étapes */}
          {Array.from(layout.positions.entries()).map(([stepId, pos]) => {
            const step = stepsById.get(stepId);
            if (!step) return null;
            const x = toPxX(pos.col);
            const y = toPxY(pos.row);
            const actions = Array.isArray(step.actions) ? step.actions : [];
            return (
              <div key={stepId} className="absolute z-10" style={{ left: x - BOX_W / 2, top: y, width: BOX_W }}>
                <div
                  className={`bg-white text-center shadow-sm ${
                    step.type === 'initial' ? 'border-4 border-double border-gray-900' : 'border-2 border-gray-900'
                  }`}
                >
                  <div className="font-bold py-1">{step.label || step.id}</div>
                </div>
                {actions.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {actions.map((act) => (
                      <div
                        key={act.id || act.description}
                        className="text-xs bg-orange-50 border border-orange-300 rounded px-2 py-0.5 font-mono text-center"
                      >
                        {act.qualifier && <span className="font-semibold text-blue-700 mr-1">[{act.qualifier}]</span>}
                        <span className="font-bold text-orange-700">{act.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Barres de transition simples */}
          {layout.simpleBars.map((bar, i) => {
            const isInt = Number.isInteger(bar.fromRow);
            const x = toPxX(bar.col);
            const yTop = toPxY(bar.fromRow);
            const yBottom = toPxY(bar.fromRow + (isInt ? 1 : 0.5));
            const barY = (yTop + yBottom) / 2;
            return (
              <React.Fragment key={`sb-${i}`}>
                <div className="absolute bg-gray-900" style={{ left: x - 1, top: yTop, width: 2, height: yBottom - yTop }} />
                <div className="absolute bg-gray-900" style={{ left: x - 16, top: barY - 1, width: 32, height: 3 }} />
                {bar.receptivity && (
                  <div
                    className="absolute text-xs font-mono font-semibold text-red-700 bg-white px-1 whitespace-nowrap z-10"
                    style={{ left: x + 20, top: barY - 9 }}
                  >
                    {bar.receptivity}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Barres de divergence / convergence (ET = double trait, OU = simple trait) */}
          {layout.branchBars.map((bb, i) => {
            const xStart = toPxX(bb.colStart);
            const xEnd = toPxX(bb.colEnd);
            const barY = toPxY(bb.row);
            const trunkX = toPxX(bb.trunkCol);
            const isDiv = bb.kind === 'divergence';
            const trunkTopY = isDiv ? toPxY(Math.floor(bb.row)) : barY;
            const trunkBottomY = isDiv ? barY : toPxY(Math.ceil(bb.row));

            return (
              <React.Fragment key={`bb-${i}`}>
                <div
                  className="absolute bg-gray-900"
                  style={{ left: trunkX - 1, top: trunkTopY, width: 2, height: Math.max(0, trunkBottomY - trunkTopY) }}
                />
                {bb.branches.map((br, j) => {
                  const bx = toPxX(br.col);
                  const by = toPxY(br.row);
                  const top = isDiv ? barY : Math.min(by, barY);
                  const h = Math.abs(by - barY);
                  return <div key={j} className="absolute bg-gray-900" style={{ left: bx - 1, top, width: 2, height: h }} />;
                })}
                <div className="absolute bg-gray-900" style={{ left: xStart, top: barY - 1, width: xEnd - xStart, height: 2 }} />
                {bb.isAnd && (
                  <div className="absolute bg-gray-900" style={{ left: xStart, top: barY - 6, width: xEnd - xStart, height: 2 }} />
                )}
                {bb.receptivity && (
                  <div
                    className="absolute text-xs font-mono font-semibold text-red-700 bg-white px-1 whitespace-nowrap z-10"
                    style={{ left: trunkX + 14, top: (trunkTopY + trunkBottomY) / 2 - 9 }}
                  >
                    {bb.receptivity}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Rebouclages (ex: retour à l'étape initiale) */}
          {layout.loopEdges.map((le, i) => {
            const from = layout.positions.get(le.fromStepId);
            const to = layout.positions.get(le.toStepId);
            if (!from || !to) return null;
            const sideX = MARGIN_X - 30 - i * 18;
            const yFrom = toPxY(from.row) + 20;
            const yTo = toPxY(to.row) + 20;
            const xFrom = toPxX(from.col) - BOX_W / 2;
            const xTo = toPxX(to.col) - BOX_W / 2;
            return (
              <React.Fragment key={`loop-${i}`}>
                <div className="absolute bg-gray-900" style={{ left: sideX, top: yFrom, width: Math.max(0, xFrom - sideX), height: 2 }} />
                <div className="absolute bg-gray-900" style={{ left: sideX, top: Math.min(yFrom, yTo), width: 2, height: Math.abs(yFrom - yTo) }} />
                <div className="absolute bg-gray-900" style={{ left: sideX, top: yTo, width: Math.max(0, xTo - sideX), height: 2 }} />
                <div
                  className="absolute"
                  style={{
                    left: xTo - 8,
                    top: yTo - 5,
                    width: 0,
                    height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderRight: '8px solid #111',
                  }}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-bold mb-2 text-gray-700">Table de correspondance E/S (convention AUTOMGEN)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="p-2">Variable</th>
                <th className="p-2">Type</th>
                <th className="p-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {variables.map((v, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="p-2 font-mono font-bold text-orange-700">{v.name}</td>
                  <td className="p-2">
                    {v.type === 'input'
                      ? 'Entrée (i)'
                      : v.type === 'output'
                      ? 'Sortie (o)'
                      : v.type === 'timer'
                      ? 'Temporisation'
                      : 'Interne'}
                  </td>
                  <td className="p-2 text-gray-600">{v.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
