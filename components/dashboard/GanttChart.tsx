import React, { useMemo, useRef, useEffect } from 'react';
import { Project, Employee, Assignment, DisplayRow, EmployeeType } from '@/types';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval, format, isSameMonth, isSameDay, startOfDay, endOfDay, getDaysInMonth, isSameYear } from 'date-fns';
import { ko } from 'date-fns/locale';
import { setStartTime, setEndTime, calculateExactMM } from '@/utils/dateUtils';

interface Props {
  projects: Project[];
  employees: Employee[];
  assignments: Assignment[];
  viewMode: 'week' | 'month' | 'year';
  viewDate: Date;
  viewType: 'project' | 'employee';
  isAdmin: boolean;
  onEditAssignment: (a: Assignment) => void;
  onSelectRow: (id: string, type: 'project' | 'employee') => void;
  onProjectClick?: (project: Project) => void;
}

export const GanttChart = ({ projects, employees, assignments, viewMode, viewDate, viewType, isAdmin, onEditAssignment, onSelectRow, onProjectClick }: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { periodStart, periodEnd, periodCols } = useMemo(() => {
    let start, end, cols;
    if (viewMode === 'week') { start = startOfWeek(viewDate, { locale: ko }); end = endOfWeek(viewDate, { locale: ko }); cols = eachDayOfInterval({ start, end }); } 
    else if (viewMode === 'month') { start = startOfMonth(viewDate); end = endOfMonth(viewDate); cols = eachDayOfInterval({ start, end }); } 
    else { start = startOfYear(viewDate); end = endOfYear(viewDate); cols = eachMonthOfInterval({ start, end }); }
    return { periodStart: start, periodEnd: end, periodCols: cols };
  }, [viewDate, viewMode]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [viewMode, viewDate, viewType]);

  const filteredAssignments = useMemo(() => {
    const viewStartTs = setStartTime(periodStart);
    const viewEndTs = setEndTime(periodEnd);
    return assignments.filter((a) => {
      const assignStartTs = setStartTime(a.start_date);
      const assignEndTs = setEndTime(a.end_date);
      return assignStartTs <= viewEndTs && assignEndTs >= viewStartTs;
    });
  }, [assignments, periodStart, periodEnd]);

  const displayRows: DisplayRow[] = useMemo(() => {
    if (viewType === 'project') return projects.map(p => ({ id: p.id, uniqueKey: p.id, name: p.name, type: 'project' }));
    else {
      const typePriority: Record<string, number> = { 'billable': 1, 'internal': 2, 'other_unit': 3, 'outsourcing': 4 };
      return [...employees].sort((a, b) => (typePriority[a.employee_type] || 99) - (typePriority[b.employee_type] || 99) || a.name.localeCompare(b.name, 'ko'))
        .map(e => ({ id: e.id, uniqueKey: e.id, name: e.name, type: 'employee' }));
    }
  }, [projects, employees, viewType]);

  const dailyAllocationMap = useMemo(() => {
    const map: Record<string, number> = {}; 
    const viewStartTs = setStartTime(periodStart);
    const viewEndTs = setEndTime(periodEnd);
    filteredAssignments.forEach(a => {
       const overlapStartTs = Math.max(setStartTime(a.start_date), viewStartTs);
       const overlapEndTs = Math.min(setEndTime(a.end_date), viewEndTs);
       if (overlapStartTs <= overlapEndTs) {
          eachDayOfInterval({ start: new Date(overlapStartTs), end: new Date(overlapEndTs) }).forEach(day => {
             const key = `${a.employee_id}:${format(day, 'yyyy-MM-dd')}`;
             map[key] = (map[key] || 0) + (1 / getDaysInMonth(day));
          });
       }
    });
    return map;
  }, [filteredAssignments, periodStart, periodEnd]);

  const isOverworked = (employeeId: string, day: Date) => (dailyAllocationMap[`${employeeId}:${format(day, 'yyyy-MM-dd')}`] || 0) > 1.001;
  const getBarColor = (a: Assignment) => projects.find(proj => proj.id === a.project_id)?.is_tentative ? 'bg-gray-400/90' : a.non_bill ? 'bg-orange-300/90' : 'bg-blue-500/90';
  const getEmployeeColorIndicator = (type: EmployeeType) => ({ 'billable': 'bg-blue-500', 'internal': 'bg-gray-400', 'other_unit': 'bg-purple-500', 'outsourcing': 'bg-green-500' }[type] || 'bg-gray-300');
  const isTodayColumn = (date: Date) => viewMode === 'year' ? isSameMonth(date, new Date()) && isSameYear(date, new Date()) : isSameDay(date, new Date());
  
  const handleRowClick = (row: DisplayRow) => {
    if (row.type === 'employee') onSelectRow(row.id, 'employee');
    else if (row.type === 'project') { const p = projects.find(p => p.id === row.id); if (p && onProjectClick) onProjectClick(p); else onSelectRow(row.id, 'project'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden relative z-30">
      <div className="overflow-x-auto" ref={scrollContainerRef}>
        <table className="min-w-full border-separate border-spacing-0 table-fixed">
          <thead className="sticky top-0 z-50">
            <tr className="bg-white/95 backdrop-blur-md h-9 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
              {/* [수정] z-index 상향 (50 -> 60) 및 min-w 적용으로 너비 고정 */}
              <th className="sticky left-0 z-[60] bg-white backdrop-blur-md w-[160px] min-w-[160px] max-w-[160px] px-4 border-r border-gray-100/50 text-[9px] font-bold text-gray-500 uppercase text-left">
                {viewType === 'project' ? 'Project' : 'Employee'}
              </th>
              
              <th className="sticky left-[160px] z-[60] bg-white backdrop-blur-md w-[60px] min-w-[60px] max-w-[60px] px-2 border-r border-gray-100/50 text-[9px] font-bold text-gray-500 uppercase text-center">
                Total MM
              </th>
              
              <th className="sticky left-[220px] z-[60] bg-white backdrop-blur-md w-[280px] min-w-[280px] max-w-[280px] px-4 border-r-2 border-gray-200 text-[9px] font-bold text-gray-500 uppercase text-left">
                Details
              </th>
              
              {periodCols.map((date) => {
                const isToday = isTodayColumn(date);
                return (
                  <th key={format(date, 'yyyy-MM-dd')} className={`px-1 border-b border-gray-100 min-w-[3rem] h-9 ${isToday ? 'text-orange-600 bg-orange-100/50' : 'text-gray-500'}`}>
                     <div className="flex flex-col items-center justify-center h-full leading-none">
                       {viewMode === 'year' ? <span className={`text-[11px] ${isToday ? 'font-bold' : ''}`}>{format(date, 'M월', { locale: ko })}</span> : <><span className="text-[9px] opacity-70 mb-0.5">{format(date, 'EEE', { locale: ko })}</span><span className={`text-[10px] ${isToday ? 'font-bold' : ''}`}>{format(date, 'd')}</span></>}
                     </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {displayRows.map((row) => {
              const rowAssignments = filteredAssignments.filter(a => row.type === 'project' ? a.project_id === row.id : a.employee_id === row.id).sort((a, b) => a.start_date.getTime() - b.start_date.getTime());
              const projectData = viewType === 'project' ? projects.find(p => p.id === row.id) : null;
              const employeeData = viewType === 'employee' ? employees.find(e => e.id === row.id) : null;
              
              const isTentativeProject = projectData?.is_tentative;
              const isInternal = employeeData?.employee_type === 'internal';
              const hasAssignment = rowAssignments.length > 0;
              const nameTextClass = (isInternal && !hasAssignment) ? 'text-gray-400 font-normal' : 'text-gray-900 font-medium';

              return (
                <tr key={row.uniqueKey} className="group hover:bg-gray-50/80 transition-colors">
                  {/* [수정] 
                      1. z-index 상향 (30 -> 40): 데이터 셀보다 위에 오도록 
                      2. bg-white: 투명도 제거
                      3. min-w, max-w: 너비 고정
                  */}
                  <td className="sticky left-0 z-40 bg-white group-hover:bg-gray-50 px-4 py-2 border-r border-gray-100 border-b border-gray-100 w-[160px] min-w-[160px] max-w-[160px]">
                    <span onClick={() => handleRowClick(row)} className="flex items-center gap-2 cursor-pointer hover:text-blue-600">
                      {viewType === 'employee' && employeeData && <div className={`w-1 h-3 rounded-full flex-shrink-0 ${getEmployeeColorIndicator(employeeData.employee_type)}`} />}
                      <span className={`text-sm truncate px-2 py-0.5 rounded ${nameTextClass} ${isTentativeProject ? 'bg-gray-100 text-gray-500' : 'hover:underline'}`}>
                        {row.name}
                      </span>
                    </span>
                  </td>

                  <td className="sticky left-[160px] z-40 bg-white group-hover:bg-gray-50 w-[60px] min-w-[60px] max-w-[60px] px-2 py-2 text-xs font-bold text-center text-gray-600 border-r border-gray-100 border-b border-gray-100">
                    {(() => { let b=0, n=0; rowAssignments.forEach(a => { const mm = calculateExactMM(a, periodStart, periodEnd); a.non_bill ? n+=mm : b+=mm; }); return <div className="flex flex-col items-center"><span>{b>0?b.toFixed(2):'0.00'}</span>{n>0&&<span className="text-[10px] text-orange-500">({n.toFixed(2)})</span>}</div> })()}
                  </td>

                  <td className="sticky left-[220px] z-40 bg-white group-hover:bg-gray-50 px-4 py-1 text-xs border-r-2 border-gray-200 border-b border-gray-100 align-top w-[280px] min-w-[280px] max-w-[280px]">
                    {rowAssignments.map(a => {
                       const tName = row.type === 'project' ? employees.find(e => e.id === a.employee_id)?.name : projects.find(p => p.id === a.project_id)?.name;
                       return (
                         <div key={a.id} onClick={() => isAdmin && onEditAssignment(a)} className={`h-5 mb-0.5 flex items-center gap-1 rounded px-1 group/item ${isAdmin ? 'cursor-pointer hover:bg-blue-50' : ''}`}>
                           <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.non_bill ? 'bg-orange-400' : 'bg-blue-500'}`} />
                           <span className="truncate w-[90px] font-semibold text-gray-700" title={tName}>{tName}</span>
                           <span className="text-gray-500 text-[10px] w-[40px] text-center whitespace-nowrap">({calculateExactMM(a, periodStart, periodEnd).toFixed(1)})</span>
                           <span className="text-[9px] text-gray-400 tracking-tight ml-auto tabular-nums">{format(a.start_date, 'yyyy.MM.dd')}~{format(a.end_date, 'yyyy.MM.dd')}</span>
                         </div>
                       );
                    })}
                  </td>
                  
                  {/* Date Columns (Normal z-index) */}
                  {periodCols.map((colDate) => {
                    const colStart = viewMode === 'year' ? startOfMonth(colDate) : startOfDay(colDate); const colEnd = viewMode === 'year' ? endOfMonth(colDate) : endOfDay(colDate);
                    const isOver = (viewType === 'employee') && isOverworked(row.id, colDate); const isToday = isTodayColumn(colDate);
                    return (
                      <td key={format(colDate, 'yyyy-MM-dd')} className={`px-0.5 py-1 text-center border-b border-gray-50 align-top ${isOver ? '!bg-red-100' : ''} ${isToday ? 'bg-orange-50' : ''}`}>
                        <div className="flex flex-col w-full">
                          {rowAssignments.map((a) => {
                            const aStart = startOfDay(a.start_date); const aEnd = endOfDay(a.end_date);
                            if ((aStart <= colEnd) && (aEnd >= colStart)) return <div key={a.id} onClick={() => isAdmin && onEditAssignment(a)} className={`h-5 mb-0.5 w-full rounded-[2px] shadow-sm hover:scale-110 ${isAdmin ? 'cursor-pointer' : ''} ${getBarColor(a)}`} title={`${format(a.start_date, 'MM.dd')}~`}></div>;
                            else return <div key={a.id} className="h-5 mb-0.5 w-full"></div>;
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};