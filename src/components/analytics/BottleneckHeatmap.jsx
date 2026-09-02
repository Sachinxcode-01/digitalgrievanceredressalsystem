import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, AlertTriangle, CheckCircle, Info, ChevronRight, Filter } from 'lucide-react';

const DEPARTMENTS = [
  'IT Support & Systems',
  'Hostel & Facilities',
  'Academic Affairs',
  'Finance & Accounts',
  'Campus Infrastructure'
];

const PROBLEM_TYPES = [
  'Equipment Failure',
  'Process / SLA Delay',
  'Hygiene / Sanitation',
  'Billing / Financial',
  'Staff Responsiveness'
];

// Mock cluster density matrix data (risk scores 0-100)
const INITIAL_MATRIX = {
  'IT Support & Systems-Equipment Failure': { count: 18, risk: 'high', score: 88, mttr: '14.2h' },
  'IT Support & Systems-Process / SLA Delay': { count: 6, risk: 'low', score: 32, mttr: '6.4h' },
  'IT Support & Systems-Hygiene / Sanitation': { count: 0, risk: 'none', score: 0, mttr: '0h' },
  'IT Support & Systems-Billing / Financial': { count: 2, risk: 'low', score: 20, mttr: '4.1h' },
  'IT Support & Systems-Staff Responsiveness': { count: 5, risk: 'medium', score: 45, mttr: '11.0h' },

  'Hostel & Facilities-Equipment Failure': { count: 24, risk: 'critical', score: 95, mttr: '28.5h' },
  'Hostel & Facilities-Process / SLA Delay': { count: 12, risk: 'medium', score: 62, mttr: '18.1h' },
  'Hostel & Facilities-Hygiene / Sanitation': { count: 19, risk: 'critical', score: 91, mttr: '22.4h' },
  'Hostel & Facilities-Billing / Financial': { count: 1, risk: 'low', score: 15, mttr: '3.0h' },
  'Hostel & Facilities-Staff Responsiveness': { count: 8, risk: 'medium', score: 55, mttr: '13.2h' },

  'Academic Affairs-Equipment Failure': { count: 3, risk: 'low', score: 25, mttr: '5.2h' },
  'Academic Affairs-Process / SLA Delay': { count: 16, risk: 'high', score: 84, mttr: '36.0h' },
  'Academic Affairs-Hygiene / Sanitation': { count: 0, risk: 'none', score: 0, mttr: '0h' },
  'Academic Affairs-Billing / Financial': { count: 4, risk: 'low', score: 30, mttr: '8.5h' },
  'Academic Affairs-Staff Responsiveness': { count: 11, risk: 'medium', score: 68, mttr: '19.4h' },

  'Finance & Accounts-Equipment Failure': { count: 1, risk: 'low', score: 10, mttr: '2.0h' },
  'Finance & Accounts-Process / SLA Delay': { count: 14, risk: 'high', score: 79, mttr: '42.0h' },
  'Finance & Accounts-Hygiene / Sanitation': { count: 0, risk: 'none', score: 0, mttr: '0h' },
  'Finance & Accounts-Billing / Financial': { count: 22, risk: 'critical', score: 92, mttr: '31.5h' },
  'Finance & Accounts-Staff Responsiveness': { count: 7, risk: 'medium', score: 48, mttr: '12.0h' },

  'Campus Infrastructure-Equipment Failure': { count: 15, risk: 'high', score: 82, mttr: '26.3h' },
  'Campus Infrastructure-Process / SLA Delay': { count: 9, risk: 'medium', score: 58, mttr: '15.0h' },
  'Campus Infrastructure-Hygiene / Sanitation': { count: 14, risk: 'high', score: 78, mttr: '16.8h' },
  'Campus Infrastructure-Billing / Financial': { count: 0, risk: 'none', score: 0, mttr: '0h' },
  'Campus Infrastructure-Staff Responsiveness': { count: 4, risk: 'low', score: 35, mttr: '9.5h' },
};

export const BottleneckHeatmap = ({ onSelectCluster }) => {
  const [selectedCell, setSelectedCell] = useState(null);

  const getHeatmapColor = (score) => {
    if (score === 0) return 'bg-surface/30 border-border/40 text-muted-foreground/40';
    if (score < 30) return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25';
    if (score < 60) return 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25';
    if (score < 85) return 'bg-orange-500/20 border-orange-500/40 text-orange-400 hover:bg-orange-500/30';
    return 'bg-rose-500/25 border-rose-500/50 text-rose-300 hover:bg-rose-500/35 animate-pulse';
  };

  return (
    <div className="space-y-6">
      {/* Legend & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          <h4 className="font-heading font-bold text-foreground flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            Institutional Root-Cause Bottleneck Heatmap
          </h4>
          <p className="text-muted-foreground text-[11px]">
            AI-clustered ticket density and SLA drag across departments & fault categories.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-muted-foreground font-semibold">Intensity:</span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Low (&lt;30)</span>
          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">Moderate (30-60)</span>
          <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 text-[10px] font-bold">High (60-85)</span>
          <span className="px-2 py-0.5 rounded-md bg-rose-500/30 text-rose-300 text-[10px] font-bold">Critical (&gt;85)</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <table className="w-full text-left border-collapse min-w-[640px]">
          <thead>
            <tr>
              <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-surface/80 rounded-tl-xl border-b border-border">
                Department Node
              </th>
              {PROBLEM_TYPES.map((pt) => (
                <th key={pt} className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center bg-surface/80 border-b border-border">
                  {pt}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {DEPARTMENTS.map((dept) => (
              <tr key={dept} className="hover:bg-surface/30 transition-colors">
                <td className="p-3 text-xs font-bold text-foreground whitespace-nowrap bg-surface/20 border-r border-border/40">
                  {dept}
                </td>
                {PROBLEM_TYPES.map((pt) => {
                  const key = `${dept}-${pt}`;
                  const data = INITIAL_MATRIX[key] || { count: 0, score: 0, mttr: '0h' };
                  const isSelected = selectedCell?.key === key;

                  return (
                    <td key={pt} className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const cell = { key, dept, pt, ...data };
                          setSelectedCell(cell);
                          if (onSelectCluster) onSelectCluster(cell);
                        }}
                        className={`w-full py-2.5 px-2 rounded-xl border text-xs font-bold font-mono transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                          getHeatmapColor(data.score)
                        } ${isSelected ? 'ring-2 ring-primary-bright shadow-lg scale-105' : ''}`}
                      >
                        <span className="text-xs font-black">{data.count}</span>
                        <span className="text-[9px] opacity-75 font-sans font-normal">{data.mttr} MTTR</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Cell Drilldown Detail Card */}
      <AnimatePresence>
        {selectedCell && selectedCell.count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-4 rounded-2xl bg-surface/80 border border-primary-bright/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary-bright/10 text-primary-bright border border-primary-bright/20">
                  {selectedCell.dept}
                </span>
                <span className="text-xs text-muted-foreground">• {selectedCell.pt}</span>
              </div>
              <h4 className="text-sm font-bold text-foreground">
                Cluster Risk Index: {selectedCell.score}/100 • {selectedCell.count} Active Backlog Incidents
              </h4>
              <p className="text-xs text-muted-foreground">
                Average Resolution Time: <b className="text-foreground">{selectedCell.mttr}</b>. Dispatches and root-cause fixes recommended.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              className="px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground self-start sm:self-auto cursor-pointer"
            >
              Dismiss Details
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BottleneckHeatmap;
