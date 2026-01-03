import React from 'react';
import { Project, Assignment } from '@/types';

interface Props {
  projects: Project[];
  assignments: Assignment[];
}

export const ProjectSummary = ({ projects, assignments }: Props) => {
  const assignedIds = new Set(assignments.map(a => a.project_id));
  const activeProjects = projects.filter(p => assignedIds.has(p.id));
  const idleProjects = projects.filter(p => !assignedIds.has(p.id));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {/* Active Projects */}
      <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
        <div className="text-xs font-bold text-blue-700 mb-2 flex items-center justify-between">
          <span>Active Projects (Assigned)</span>
          <span className="bg-white px-2 py-0.5 rounded-full text-blue-600 shadow-sm">{activeProjects.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
          {activeProjects.map(p => (
            <span key={p.id} className="text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded-md shadow-sm">
              {p.name}
            </span>
          ))}
          {activeProjects.length === 0 && <span className="text-xs text-gray-400 italic">None</span>}
        </div>
      </div>

      {/* Idle Projects */}
      <div className="bg-gray-50/80 rounded-lg p-3 border border-gray-200">
        <div className="text-xs font-bold text-gray-600 mb-2 flex items-center justify-between">
          <span>Idle Projects (Unassigned)</span>
          <span className="bg-white px-2 py-0.5 rounded-full text-gray-500 shadow-sm">{idleProjects.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
          {idleProjects.map(p => (
            <span key={p.id} className="text-[10px] bg-white border border-gray-300 text-gray-500 px-2 py-1 rounded-md shadow-sm">
              {p.name}
            </span>
          ))}
          {idleProjects.length === 0 && <span className="text-xs text-gray-400 italic">None</span>}
        </div>
      </div>
    </div>
  );
};