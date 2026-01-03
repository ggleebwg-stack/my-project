import React from 'react';
import { Employee, Assignment, Project } from '@/types';
import { startOfYear, endOfYear, format } from 'date-fns';
import { calculateExactMM } from '@/utils/dateUtils';

interface Props {
  employees: Employee[];
  assignments: Assignment[];
  projects: Project[];
  viewDate: Date;
  onDetailClick?: (category: 'billable' | 'nonBill' | 'tentative') => void;
}

export const UtilizationBar = ({ employees, assignments, projects, viewDate, onDetailClick }: Props) => {
  const getEmployeeUtilization = () => {
    const billableEmployees = employees.filter(e => e.employee_type === 'billable').length;
    const totalCapacityMM = billableEmployees * 12;
    const yearStart = startOfYear(viewDate);
    const yearEnd = endOfYear(viewDate);
    
    let billableMM = 0, nonBillableMM = 0, tentativeMM = 0;

    assignments.forEach(a => {
      const e = employees.find(emp => emp.id === a.employee_id);
      const p = projects.find(proj => proj.id === a.project_id);
      if (!e || !p) return;

      const mm = calculateExactMM(a, yearStart, yearEnd);
      
      if (p.is_tentative) { 
        if (e.employee_type === 'billable') tentativeMM += mm; 
      } else if (a.non_bill) { 
        if (e.employee_type === 'billable') nonBillableMM += mm; 
      } else { 
        if (e.employee_type === 'billable' || e.employee_type === 'internal') billableMM += mm; 
      }
    });

    const totalPct = totalCapacityMM > 0 ? ((billableMM + nonBillableMM + tentativeMM) / totalCapacityMM) * 100 : 0;
    
    return { 
      totalCapacityMM, 
      billableEmployees,
      billablePct: totalCapacityMM > 0 ? (billableMM / totalCapacityMM) * 100 : 0, 
      nonBillPct: totalCapacityMM > 0 ? (nonBillableMM / totalCapacityMM) * 100 : 0, 
      tentativePct: totalCapacityMM > 0 ? (tentativeMM / totalCapacityMM) * 100 : 0, 
      totalPct, 
      year: format(viewDate, 'yyyy') 
    };
  };

  const stats = getEmployeeUtilization();

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mt-4">
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-baseline gap-2">
           <span className="text-sm font-bold text-gray-500">TOTAL</span>
           <span className="text-4xl font-extrabold text-gray-900 tracking-tight">{stats.totalPct.toFixed(1)}%</span>
        </div>
        <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
           <span className="text-blue-600 font-bold">{stats.billablePct.toFixed(1)}% Billable</span>
           <span className="text-gray-300">|</span>
           <span className="text-orange-500 font-bold">+{stats.nonBillPct.toFixed(1)}% Non-bill</span>
           <span className="text-gray-300">|</span>
           <span className="text-gray-500 font-bold">+{stats.tentativePct.toFixed(1)}% 미확정</span>
        </div>
      </div>

      {/* [수정] items-center -> items-end (텍스트 하단 정렬) */}
      <div className="flex items-end gap-4">
        
        {/* Progress Bar Area */}
        {/* [수정] overflow-hidden 제거 (확대 효과 짤림 방지) */}
        <div className="flex-1 relative h-3 bg-gray-100 rounded-full flex">
           <div 
             onClick={() => onDetailClick && onDetailClick('billable')}
             // [수정] hover scale 확대, z-index 추가, first:rounded-l-full
             className="h-full bg-blue-600 first:rounded-l-full last:rounded-r-full relative cursor-pointer hover:scale-y-[1.8] hover:shadow-md hover:z-10 origin-bottom transition-transform duration-200 ease-out" 
             style={{ width: `${stats.billablePct}%` }}
             title="Billable"
           />
           <div 
             onClick={() => onDetailClick && onDetailClick('nonBill')}
             className="h-full bg-orange-400 first:rounded-l-full last:rounded-r-full relative cursor-pointer hover:scale-y-[1.8] hover:shadow-md hover:z-10 origin-bottom transition-transform duration-200 ease-out" 
             style={{ width: `${stats.nonBillPct}%` }}
             title="Non-Billable"
           />
           <div 
             onClick={() => onDetailClick && onDetailClick('tentative')}
             className="h-full bg-gray-400 first:rounded-l-full last:rounded-r-full relative cursor-pointer hover:scale-y-[1.8] hover:shadow-md hover:z-10 origin-bottom transition-transform duration-200 ease-out" 
             style={{ width: `${stats.tentativePct}%` }}
             title="Tentative"
           />
        </div>

        {/* Capacity Info */}
        {/* 하단 정렬 상태에서 텍스트 줄바꿈 유지 */}
        <div className="text-xs text-gray-400 whitespace-nowrap text-right leading-tight pb-[1px]">
           Total Capacity: <span className="font-bold text-gray-600">{stats.totalCapacityMM.toFixed(0)} MM</span>
           <span className="block text-[10px] text-gray-400 mt-0.5">(Billable {stats.billableEmployees}명 * 12.0MM)</span>
        </div>
      </div>
    </div>
  );
};