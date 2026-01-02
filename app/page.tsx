'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  eachDayOfInterval, eachMonthOfInterval, getDaysInMonth, 
  addMonths, subMonths, addWeeks, subWeeks, addYears, subYears,
  isSameDay, isSameMonth, startOfDay, endOfDay, setYear, getWeekOfMonth, isWeekend,
  startOfDecade, endOfDecade, isSameYear
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '../lib/supabase'; 
import { ChevronLeft, ChevronRight, Check, Trash2, Plus, Briefcase, Calendar as CalendarIcon, User, RefreshCcw, LayoutDashboard, Users, FolderKanban, ClipboardList, X, PieChart, AlertCircle } from 'lucide-react';

// --- Interfaces ---
interface Project { 
  id: string; 
  name: string; 
  is_tentative: boolean; 
  start_date: Date | null;
  end_date: Date | null;
}

type EmployeeType = 'billable' | 'internal' | 'other_unit' | 'outsourcing';

interface Employee { 
  id: string; 
  name: string;
  employee_type: EmployeeType; 
}

interface Assignment {
  id: string;
  employee_id: string;
  project_id: string;
  task: string;
  start_date: Date;
  end_date: Date;
  non_bill: boolean;
}
interface DisplayRow {
  id: string;
  uniqueKey: string;
  name: string;
  type: 'project' | 'employee';
}

interface PopupDetailItem {
  empName: string;
  period: string;
  mm: number;
}
interface PopupData {
  title: string;
  colorClass: string;
  data: { projectName: string; items: PopupDetailItem[] }[];
}

// --- Helper: Date Normalizer ---
const setStartTime = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const setEndTime = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

// --- Custom Components ---

const SegmentedControl = ({ 
  options, 
  value, 
  onChange 
}: { 
  options: { value: string; label: string }[]; 
  value: string; 
  onChange: (val: any) => void; 
}) => {
  return (
    <div className="bg-gray-200/80 p-1 rounded-lg flex items-center shadow-inner h-9 cursor-pointer">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              flex-1 px-3 h-full text-xs font-semibold rounded-md transition-all duration-200 ease-out flex items-center justify-center whitespace-nowrap cursor-pointer
              ${isActive 
                ? 'bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.12)]' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-black/5'}
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

const CustomDatePicker = ({
  viewMode,
  currentDate,
  onChange,
  onClose
}: {
  viewMode: 'week' | 'month' | 'year';
  currentDate: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}) => {
  const [browseDate, setBrowseDate] = useState(currentDate);

  const handlePrev = () => {
    if (viewMode === 'year') setBrowseDate(subYears(browseDate, 12));
    else if (viewMode === 'month') setBrowseDate(subYears(browseDate, 1));
    else setBrowseDate(subMonths(browseDate, 1));
  };

  const handleNext = () => {
    if (viewMode === 'year') setBrowseDate(addYears(browseDate, 12));
    else if (viewMode === 'month') setBrowseDate(addYears(browseDate, 1));
    else setBrowseDate(addMonths(browseDate, 1));
  };

  const handleSelect = (date: Date) => {
    onChange(date);
    onClose();
  };

  const renderContent = () => {
    if (viewMode === 'year') {
      const startYear = Math.floor(browseDate.getFullYear() / 12) * 12;
      const years = Array.from({ length: 12 }, (_, i) => startYear + i);
      return (
        <div className="grid grid-cols-3 gap-2">
          {years.map(year => (
            <button key={year} onClick={() => handleSelect(setYear(browseDate, year))} className={`p-2 rounded-lg text-sm font-medium transition-colors ${year === currentDate.getFullYear() ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}>{year}</button>
          ))}
        </div>
      );
    }
    if (viewMode === 'month') {
      const months = Array.from({ length: 12 }, (_, i) => i);
      return (
        <div className="grid grid-cols-3 gap-2">
          {months.map(month => {
            const d = new Date(browseDate.getFullYear(), month, 1);
            const isSelected = isSameMonth(d, currentDate);
            return (
              <button key={month} onClick={() => handleSelect(d)} className={`p-3 rounded-lg text-sm font-medium transition-colors ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}>{format(d, 'MMM', { locale: ko })}</button>
            );
          })}
        </div>
      );
    }
    if (viewMode === 'week') {
      const monthStart = startOfMonth(browseDate);
      const monthEnd = endOfMonth(browseDate);
      const calendarStart = startOfWeek(monthStart, { locale: ko });
      const calendarEnd = endOfWeek(monthEnd, { locale: ko });
      const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
      const currentWeekStart = startOfWeek(currentDate, { locale: ko });

      return (
        <div>
          <div className="grid grid-cols-7 mb-2 text-center">
            {['일', '월', '화', '수', '목', '금', '토'].map(d => (<span key={d} className="text-xs font-bold text-gray-400">{d}</span>))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {calendarDays.map(day => {
              const isSelectedWeek = isSameDay(startOfWeek(day, { locale: ko }), currentWeekStart);
              const isCurrentMonth = isSameMonth(day, browseDate);
              return (
                <button key={day.toISOString()} onClick={() => handleSelect(day)} className={`relative h-9 text-xs flex items-center justify-center rounded-md transition-all ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'} ${isSelectedWeek ? 'bg-blue-50 text-blue-700 font-bold first:rounded-l-md last:rounded-r-md' : 'hover:bg-gray-50'} ${isSameDay(day, currentDate) ? 'bg-blue-600 !text-white shadow-sm z-10 rounded-md' : ''}`}>{format(day, 'd')}</button>
              );
            })}
          </div>
        </div>
      );
    }
  };

  const getHeaderText = () => {
    if (viewMode === 'year') {
      const startYear = Math.floor(browseDate.getFullYear() / 12) * 12;
      return `${startYear} - ${startYear + 11}`;
    }
    if (viewMode === 'month') return format(browseDate, 'yyyy년');
    return format(browseDate, 'yyyy년 M월');
  };

  return (
    <div className="absolute top-10 right-0 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 p-4 w-72 z-[999] animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-4">
        <button onClick={handlePrev} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={18} className="text-gray-600" /></button>
        <span className="font-bold text-gray-800">{getHeaderText()}</span>
        <button onClick={handleNext} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={18} className="text-gray-600" /></button>
      </div>
      {renderContent()}
    </div>
  );
};


export default function App() {
  // --- State ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // UI State
  const [currentTab, setCurrentTab] = useState<'main' | 'employees' | 'projects' | 'assignments'>('main');
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'year'>('year');
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<'project' | 'employee'>('project');
  const [checkedAssignmentIds, setCheckedAssignmentIds] = useState<Set<string>>(new Set());
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);

  // Utilization Detail Popup State
  const [utilPopupData, setUtilPopupData] = useState<PopupData | null>(null);

  // Form State
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [task, setTask] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nonBill, setNonBill] = useState(false);

  // CRUD Inputs
  const [newEmployeeName, setNewEmployeeName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTentative, setNewProjectTentative] = useState(false);
  const [newProjectStart, setNewProjectStart] = useState('');
  const [newProjectEnd, setNewProjectEnd] = useState('');

  // Ref
  const datePickerRef = useRef<HTMLDivElement>(null);

  // --- Initial Setup & Data Fetching ---
  useEffect(() => {
    document.title = "Bob's SD Resource";
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.search.length > 0) {
        window.history.replaceState({}, '', url.pathname);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentTab === 'projects' && targetProjectId) {
      setTimeout(() => {
        const element = document.getElementById(`project-row-${targetProjectId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => setTargetProjectId(null), 2000);
        }
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentTab, targetProjectId]);

  const fetchData = useCallback(async () => {
    const { data: projData } = await supabase.from('projects').select('*');
    const { data: empData } = await supabase.from('employees').select('*');
    const { data: assignData } = await supabase.from('assignments').select('*');

    setProjects((projData || []).map((p:any) => ({
      ...p,
      start_date: p.start_date ? new Date(p.start_date) : null,
      end_date: p.end_date ? new Date(p.end_date) : null,
    })).sort((a, b) => a.name.localeCompare(b.name, 'ko')));

    setEmployees((empData || []).sort((a, b) => a.name.localeCompare(b.name, 'ko')));
    setAssignments(
      (assignData || []).map((a: any) => ({
        ...a,
        start_date: new Date(a.start_date),
        end_date: new Date(a.end_date),
      }))
    );
  }, []);

  useEffect(() => {
    fetchData();
    const subs = [
      supabase.channel('projects').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData).subscribe(),
      supabase.channel('employees').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchData).subscribe(),
      supabase.channel('assignments').on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, fetchData).subscribe(),
    ];
    return () => subs.forEach(s => supabase.removeChannel(s));
  }, [fetchData]);

  // --- Logic Hooks ---
  const { periodStart, periodEnd, periodCols } = useMemo(() => {
    let start, end, cols;
    if (viewMode === 'week') {
      start = startOfWeek(viewDate, { locale: ko });
      end = endOfWeek(viewDate, { locale: ko });
      cols = eachDayOfInterval({ start, end });
    } else if (viewMode === 'month') {
      start = startOfMonth(viewDate);
      end = endOfMonth(viewDate);
      cols = eachDayOfInterval({ start, end });
    } else {
      start = startOfYear(viewDate);
      end = endOfYear(viewDate);
      cols = eachMonthOfInterval({ start, end });
    }
    return { periodStart: start, periodEnd: end, periodCols: cols };
  }, [viewDate, viewMode]);

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
    if (viewType === 'project') {
      return projects.map(p => ({ id: p.id, uniqueKey: p.id, name: p.name, type: 'project' }));
    } else {
      // Priority Map
      const typePriority: Record<string, number> = {
        'billable': 1,
        'internal': 2,
        'other_unit': 3,
        'outsourcing': 4
      };

      const sortedEmployees = [...employees].sort((a, b) => {
        const pA = typePriority[a.employee_type] || 99;
        const pB = typePriority[b.employee_type] || 99;
        
        if (pA !== pB) return pA - pB;
        return a.name.localeCompare(b.name, 'ko');
      });

      return sortedEmployees.map(e => ({ id: e.id, uniqueKey: e.id, name: e.name, type: 'employee' }));
    }
  }, [projects, employees, viewType]);

  const calculateExactMM = (assignment: Assignment, start: Date, end: Date) => {
    const aStartTs = setStartTime(assignment.start_date);
    const aEndTs = setEndTime(assignment.end_date);
    const viewStartTs = setStartTime(start);
    const viewEndTs = setEndTime(end);

    const overlapStartTs = Math.max(aStartTs, viewStartTs);
    const overlapEndTs = Math.min(aEndTs, viewEndTs);

    if (overlapStartTs > overlapEndTs) return 0;

    let totalMM = 0;
    const overlapDays = eachDayOfInterval({ start: new Date(overlapStartTs), end: new Date(overlapEndTs) });
    
    // Calendar Day 기준 계산
    overlapDays.forEach(day => {
      totalMM += 1 / getDaysInMonth(day);
    });

    return totalMM;
  };

  const dailyAllocationMap = useMemo(() => {
    const map: Record<string, number> = {}; 
    const viewStartTs = setStartTime(periodStart);
    const viewEndTs = setEndTime(periodEnd);

    filteredAssignments.forEach(a => {
       const aStartTs = setStartTime(a.start_date);
       const aEndTs = setEndTime(a.end_date);
       const overlapStartTs = Math.max(aStartTs, viewStartTs);
       const overlapEndTs = Math.min(aEndTs, viewEndTs);
       
       if (overlapStartTs <= overlapEndTs) {
          const days = eachDayOfInterval({ start: new Date(overlapStartTs), end: new Date(overlapEndTs) });
          days.forEach(day => {
             const key = `${a.employee_id}:${format(day, 'yyyy-MM-dd')}`;
             map[key] = (map[key] || 0) + (1 / getDaysInMonth(day));
          });
       }
    });
    return map;
  }, [filteredAssignments, periodStart, periodEnd]);

  const isOverworked = (employeeId: string, day: Date) => {
    const key = `${employeeId}:${format(day, 'yyyy-MM-dd')}`;
    return (dailyAllocationMap[key] || 0) > 1.001;
  };

  // --- Handlers ---
  const handlePrevPeriod = () => {
    if (viewMode === 'week') setViewDate(subWeeks(viewDate, 1));
    else if (viewMode === 'month') setViewDate(subMonths(viewDate, 1));
    else setViewDate(subYears(viewDate, 1));
  };
  const handleNextPeriod = () => {
    if (viewMode === 'week') setViewDate(addWeeks(viewDate, 1));
    else if (viewMode === 'month') setViewDate(addMonths(viewDate, 1));
    else setViewDate(addYears(viewDate, 1));
  };
  const handleToday = () => {
    setViewDate(new Date());
  };
  
  const toggleAssignmentCheck = (id: string) => {
    const newSet = new Set(checkedAssignmentIds);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setCheckedAssignmentIds(newSet);
  };
  const handleBulkDeleteAssignments = async () => {
    if (checkedAssignmentIds.size === 0 || !confirm(`${checkedAssignmentIds.size}개의 할당을 삭제하시겠습니까?`)) return;
    const ids = Array.from(checkedAssignmentIds);
    await supabase.from('assignments').delete().in('id', ids);
    setAssignments(prev => prev.filter(a => !checkedAssignmentIds.has(a.id)));
    setCheckedAssignmentIds(new Set());
  };

  // CRUD
  const handleAddEmployee = async () => { 
    if (!newEmployeeName) return; 
    await supabase.from('employees').insert([{ name: newEmployeeName, employee_type: 'billable' }]); 
    setNewEmployeeName(''); 
  };
  const handleRemoveEmployee = async (id: string) => { if(!confirm('삭제하시겠습니까?')) return; await supabase.from('employees').delete().eq('id', id); await supabase.from('assignments').delete().eq('employee_id', id); };
  
  const handleUpdateEmployee = async (employee: Employee, changes: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === employee.id ? { ...e, ...changes } : e));
    await supabase.from('employees').update(changes).eq('id', employee.id);
  };

  // Badge Toggle Handler
  const handleToggleEmployeeType = async (employee: Employee) => {
    const types: EmployeeType[] = ['billable', 'internal', 'other_unit', 'outsourcing'];
    const currentIndex = types.indexOf(employee.employee_type);
    const nextType = types[(currentIndex + 1) % types.length];
    
    setEmployees(prev => prev.map(e => e.id === employee.id ? { ...e, employee_type: nextType } : e));
    await supabase.from('employees').update({ employee_type: nextType }).eq('id', employee.id);
  };

  // Badge Style Helper
  const getEmployeeTypeBadge = (type: EmployeeType) => {
    switch (type) {
      case 'billable': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'internal': return 'bg-gray-200 text-gray-600 hover:bg-gray-300';
      case 'other_unit': return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'outsourcing': return 'bg-green-100 text-green-700 hover:bg-green-200';
      default: return 'bg-gray-100 text-gray-500';
    }
  };
  const getEmployeeTypeLabel = (type: EmployeeType) => {
    switch (type) {
      case 'billable': return 'Billable';
      case 'internal': return 'Internal';
      case 'other_unit': return '타 Unit';
      case 'outsourcing': return '외주';
      default: return type;
    }
  };

  // Vertical Color Bar for Employee Row
  const getEmployeeColorIndicator = (type: EmployeeType) => {
    switch (type) {
      case 'billable': return 'bg-blue-500';
      case 'internal': return 'bg-gray-400';
      case 'other_unit': return 'bg-purple-500';
      case 'outsourcing': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const handleAddProject = async () => { 
    if (!newProjectName) return; 
    const payload: any = { name: newProjectName, is_tentative: newProjectTentative };
    if (newProjectStart) payload.start_date = new Date(newProjectStart);
    if (newProjectEnd) payload.end_date = new Date(newProjectEnd);
    await supabase.from('projects').insert([payload]); 
    setNewProjectName(''); setNewProjectTentative(false); setNewProjectStart(''); setNewProjectEnd('');
  };
  const handleRemoveProject = async (id: string) => { if(!confirm('삭제하시겠습니까?')) return; await supabase.from('projects').delete().eq('id', id); await supabase.from('assignments').delete().eq('project_id', id); };
  
  const handleUpdateProject = async (project: Project, changes: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, ...changes } : p));
    await supabase.from('projects').update(changes).eq('id', project.id);
  };

  const toggleProjectTentative = async (project: Project) => {
    const newVal = !project.is_tentative;
    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, is_tentative: newVal } : p));
    await supabase.from('projects').update({ is_tentative: newVal }).eq('id', project.id);
  };

  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setSelectedProjectId(pid);
    if (!editingAssignment && pid) {
      const p = projects.find(proj => proj.id === pid);
      if (p) {
        if (p.start_date) setStartDate(format(p.start_date, 'yyyy-MM-dd'));
        if (p.end_date) setEndDate(format(p.end_date, 'yyyy-MM-dd'));
      }
    }
  };

  const resetForm = () => { setEditingAssignment(null); setTask(''); setStartDate(''); setEndDate(''); setNonBill(false); setSelectedEmployeeId(''); setSelectedProjectId(''); };
  const handleEditAssignment = (assignment: Assignment) => { setEditingAssignment(assignment); setSelectedEmployeeId(assignment.employee_id); setSelectedProjectId(assignment.project_id); setTask(assignment.task); setStartDate(format(assignment.start_date, 'yyyy-MM-dd')); setEndDate(format(assignment.end_date, 'yyyy-MM-dd')); setNonBill(assignment.non_bill); setCurrentTab('assignments'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleAssign = async () => { if (!selectedEmployeeId || !selectedProjectId || !startDate || !endDate) return alert('필수 항목을 입력해주세요.'); const newA = { employee_id: selectedEmployeeId, project_id: selectedProjectId, task, start_date: new Date(startDate), end_date: new Date(endDate), non_bill: nonBill }; await supabase.from('assignments').insert([newA]); resetForm(); };
  const handleUpdateAssignment = async () => { if (!editingAssignment) return; const updated = { employee_id: selectedEmployeeId, project_id: selectedProjectId, task, start_date: new Date(startDate), end_date: new Date(endDate), non_bill: nonBill }; await supabase.from('assignments').update(updated).eq('id', editingAssignment.id); resetForm(); };

  const getRowTotalMM = (row: DisplayRow, rowAssignments: Assignment[]) => {
    let billTotal = 0;
    let nonBillTotal = 0;
    rowAssignments.forEach(a => {
        const mm = calculateExactMM(a, periodStart, periodEnd);
        if (a.non_bill) nonBillTotal += mm;
        else billTotal += mm;
    });
    return (
      <div className="flex flex-col items-center justify-center leading-tight">
        <span className={`${billTotal > 0 ? 'text-gray-900 font-bold' : 'text-gray-300'}`}>{billTotal > 0 ? billTotal.toFixed(2) : '0.00'}</span>
        {nonBillTotal > 0 && (<span className="text-[10px] text-orange-500 font-medium">({nonBillTotal.toFixed(2)})</span>)}
      </div>
    );
  };

  const today = new Date();
  const isCurrentTimeColumn = (date: Date) => {
    if (viewMode === 'year') return isSameMonth(date, today);
    return isSameDay(date, today);
  };

  const getPeriodLabel = useMemo(() => {
    if (viewMode === 'year') return format(viewDate, 'yyyy년');
    if (viewMode === 'month') return format(viewDate, 'yyyy. MM');
    const weekNum = getWeekOfMonth(viewDate, { locale: ko });
    return `${format(viewDate, 'yyyy. MM')} (${weekNum}주)`;
  }, [viewDate, viewMode]);

  const getBarColorClass = (assignment: Assignment) => {
    const project = projects.find(p => p.id === assignment.project_id);
    if (project?.is_tentative) return 'bg-gray-400/90'; 
    if (assignment.non_bill) return 'bg-orange-300/90'; 
    return 'bg-blue-500/90'; 
  };

  const getDotColorClass = (assignment: Assignment) => {
    const project = projects.find(p => p.id === assignment.project_id);
    if (project?.is_tentative) return 'bg-gray-400';
    if (assignment.non_bill) return 'bg-orange-400';
    return 'bg-blue-500';
  };

  // --- Bottom Summary Data Calculation ---
  const getProjectStatus = () => {
    const assignedIds = new Set(assignments.map(a => a.project_id));
    const activeProjects = projects.filter(p => assignedIds.has(p.id));
    const idleProjects = projects.filter(p => !assignedIds.has(p.id));
    return { activeProjects, idleProjects };
  };

  // [수정] Updated Utilization Calculation (Logic: Internal + Billable Task = Included in Blue Bar)
  const getEmployeeUtilization = () => {
    const billableEmployees = employees.filter(e => e.employee_type === 'billable').length;
    const totalCapacityMM = billableEmployees * 12;

    const yearStart = startOfYear(viewDate);
    const yearEnd = endOfYear(viewDate);
    
    let billableMM = 0;
    let nonBillableMM = 0;
    let tentativeMM = 0;

    assignments.forEach(a => {
      const employee = employees.find(e => e.id === a.employee_id);
      const p = projects.find(proj => proj.id === a.project_id);

      if (!employee || !p) return;

      const mm = calculateExactMM(a, yearStart, yearEnd);

      // 1. Tentative (Only count for Billable employees)
      if (p.is_tentative) {
        if (employee.employee_type === 'billable') {
          tentativeMM += mm;
        }
      }
      // 2. Non-Billable (Only count for Billable employees)
      else if (a.non_bill) {
        if (employee.employee_type === 'billable') {
          nonBillableMM += mm;
        }
      }
      // 3. Billable (Count for Billable AND Internal employees)
      else {
        if (employee.employee_type === 'billable' || employee.employee_type === 'internal') {
          billableMM += mm;
        }
      }
    });

    const totalAssignedMM = billableMM + nonBillableMM + tentativeMM;
    const totalPct = totalCapacityMM > 0 ? (totalAssignedMM / totalCapacityMM) * 100 : 0;
    
    const billablePct = totalCapacityMM > 0 ? (billableMM / totalCapacityMM) * 100 : 0;
    const nonBillPct = totalCapacityMM > 0 ? (nonBillableMM / totalCapacityMM) * 100 : 0;
    const tentativePct = totalCapacityMM > 0 ? (tentativeMM / totalCapacityMM) * 100 : 0;

    return { 
      totalCapacityMM, 
      billableMM, nonBillableMM, tentativeMM,
      billablePct, nonBillPct, tentativePct,
      totalPct, billableEmployees,
      year: format(viewDate, 'yyyy')
    };
  };

  const projectStatus = getProjectStatus();
  const utilStats = getEmployeeUtilization();

  // Handler for Detail Popup
  const handleShowUtilizationDetails = (category: 'billable' | 'nonBill' | 'tentative') => {
    const yearStart = startOfYear(viewDate);
    const yearEnd = endOfYear(viewDate);
    
    const targetAssignments = assignments.filter(a => {
      const p = projects.find(proj => proj.id === a.project_id);
      const e = employees.find(emp => emp.id === a.employee_id);
      
      if (!p || !e) return false;
      
      // Calculate MM for this assignment within the year
      const mm = calculateExactMM(a, yearStart, yearEnd);
      if (mm <= 0) return false;

      (a as any)._tempMM = mm;

      // Filter Logic must match getEmployeeUtilization
      if (category === 'tentative') {
        return p.is_tentative && e.employee_type === 'billable';
      }
      if (category === 'nonBill') {
        return !p.is_tentative && a.non_bill && e.employee_type === 'billable';
      }
      if (category === 'billable') {
        // Billable Bar includes: Billable Staff + Internal Staff (on confirmed billable project)
        const isEligibleEmployee = e.employee_type === 'billable' || e.employee_type === 'internal';
        return !p.is_tentative && !a.non_bill && isEligibleEmployee;
      }
      return false;
    });

    const groupedMap = new Map<string, PopupDetailItem[]>();
    targetAssignments.forEach(a => {
      const pName = projects.find(p => p.id === a.project_id)?.name || 'Unknown';
      const eName = employees.find(e => e.id === a.employee_id)?.name || 'Unknown';
      
      if (!groupedMap.has(pName)) groupedMap.set(pName, []);
      
      groupedMap.get(pName)!.push({
        empName: eName,
        period: `${format(a.start_date, 'MM.dd')}~${format(a.end_date, 'MM.dd')}`,
        mm: (a as any)._tempMM
      });
    });

    const data = Array.from(groupedMap.entries()).map(([projectName, items]) => ({
      projectName,
      items: items.sort((a, b) => a.empName.localeCompare(b.empName, 'ko'))
    })).sort((a, b) => a.projectName.localeCompare(b.projectName, 'ko'));

    let title = '';
    let colorClass = '';
    if (category === 'billable') { title = 'Assigned (Billable)'; colorClass = 'text-blue-600'; }
    else if (category === 'nonBill') { title = 'Non-Billable'; colorClass = 'text-orange-500'; }
    else { title = 'Tentative (미확정)'; colorClass = 'text-gray-500'; }

    setUtilPopupData({ title, colorClass, data });
  };

  const yearOptions = useMemo(() => Array.from({length: 101}, (_, i) => 2000 + i), []);

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans text-gray-900 selection:bg-blue-100 pb-20 relative">
      
      {/* Detail Popup Modal */}
      {utilPopupData && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-[2px] p-4 animate-in fade-in duration-200"
          onClick={() => setUtilPopupData(null)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className={`text-lg font-bold ${utilPopupData.colorClass}`}>{utilPopupData.title}</h3>
              <button onClick={() => setUtilPopupData(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
              {utilPopupData.data.length === 0 ? (
                <p className="text-center text-gray-400 py-4">No data found.</p>
              ) : (
                <div className="space-y-4">
                  {utilPopupData.data.map((group) => (
                    <div key={group.projectName} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="font-bold text-gray-800 text-sm mb-2">{group.projectName}</div>
                      <div className="flex flex-col gap-1">
                        {group.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs bg-white border border-gray-200 rounded px-2 py-1 shadow-sm">
                            <span className="font-medium text-gray-700">{item.empName}</span>
                            <div className="flex gap-2">
                              <span className="text-gray-500 font-medium">({item.mm.toFixed(2)})</span>
                              <span className="text-gray-400 tabular-nums">{item.period}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-[60] border-b border-gray-200/60">
        <div className="max-w-[1800px] mx-auto px-6 h-14 flex items-center justify-between">
          <h1 
            onClick={() => { setCurrentTab('main'); setViewDate(new Date()); setViewMode('year'); setViewType('project'); }}
            className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm"></span>
            Bob's SD Resource manager
          </h1>
          <nav className="flex space-x-1 bg-gray-100/80 p-1 rounded-lg">
            <button 
              onClick={() => { setCurrentTab('main'); setViewMode('year'); setViewType('project'); setViewDate(new Date()); }}
              className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${currentTab === 'main' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <LayoutDashboard size={14} /> Dashboard
            </button>
            <button onClick={() => setCurrentTab('employees')} className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${currentTab === 'employees' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              <Users size={14} /> Employees
            </button>
            <button onClick={() => setCurrentTab('projects')} className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${currentTab === 'projects' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              <FolderKanban size={14} /> Projects
            </button>
            <button onClick={() => setCurrentTab('assignments')} className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer ${currentTab === 'assignments' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              <ClipboardList size={14} /> Assignments
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        
        {/* --- Management Tabs --- */}
        {(currentTab === 'employees' || currentTab === 'projects') && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 max-w-4xl mx-auto">
             <h2 className="text-lg font-bold tracking-tight mb-4">{currentTab === 'employees' ? '직원 관리' : '프로젝트 관리'}</h2>
             
             {currentTab === 'employees' ? (
                <div className="flex gap-2 mb-6">
                  <input type="text" value={newEmployeeName} onChange={(e) => setNewEmployeeName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddEmployee()} placeholder="새 직원 이름" className="flex-grow bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-lg p-2 text-sm outline-none transition-all"/>
                  <button onClick={handleAddEmployee} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">추가</button>
                </div>
             ) : (
                <div className="flex flex-col gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase w-12">New</span>
                    <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddProject()} placeholder="새 프로젝트 이름" className="flex-grow bg-white border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-lg p-2 text-sm outline-none transition-all"/>
                    <div className={`flex items-center px-3 h-9 rounded-lg border cursor-pointer select-none transition-colors ${newProjectTentative ? 'bg-gray-200 border-gray-300 text-gray-800' : 'bg-white border-gray-200 text-gray-400'}`} onClick={() => setNewProjectTentative(!newProjectTentative)}>
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center mr-1.5 ${newProjectTentative ? 'bg-gray-600 border-gray-600' : 'bg-white border-gray-300'}`}>{newProjectTentative && <Check size={10} className="text-white" />}</div>
                      <span className="text-xs font-medium">미확정</span>
                    </div>
                    <button onClick={handleAddProject} className="px-4 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer">추가</button>
                  </div>
                  <div className="flex items-center gap-2 pl-14">
                    <span className="text-xs text-gray-400">기간(선택):</span>
                    <input type="date" className="bg-white border border-gray-200 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-blue-500 cursor-pointer" value={newProjectStart} onChange={e => setNewProjectStart(e.target.value)} />
                    <span className="text-gray-400 text-xs">~</span>
                    <input type="date" className="bg-white border border-gray-200 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-blue-500 cursor-pointer" value={newProjectEnd} onChange={e => setNewProjectEnd(e.target.value)} />
                  </div>
                </div>
             )}

             {/* Content List with Scroll */}
             <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
               {currentTab === 'employees' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {employees.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 px-3 py-2.5 rounded-lg hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-100 group">
                        <div className="flex items-center gap-2 overflow-hidden flex-grow">
                          <span className="font-medium text-gray-700 text-sm truncate">{item.name}</span>
                          <div 
                            onClick={(e) => { e.stopPropagation(); handleToggleEmployeeType(item as Employee); }}
                            className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer select-none transition-colors flex-shrink-0 font-medium tracking-tight ${getEmployeeTypeBadge(item.employee_type)}`}
                          >
                            {getEmployeeTypeLabel(item.employee_type)}
                          </div>
                        </div>
                        <button onClick={() => handleRemoveEmployee(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0 ml-2"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
               ) : (
                  <div className="flex flex-col gap-2">
                     <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 rounded-lg text-xs font-semibold text-gray-500 uppercase sticky top-0 z-10 shadow-sm">
                       <div className="col-span-5">프로젝트명</div>
                       <div className="col-span-4">기간 (시작 ~ 종료)</div>
                       <div className="col-span-2 text-center">상태</div>
                       <div className="col-span-1 text-right">삭제</div>
                     </div>
                     
                     {projects.map((item) => (
                       <div key={item.id} id={`project-row-${item.id}`} className={`grid grid-cols-12 gap-4 items-center px-4 py-2 rounded-lg transition-all border border-transparent group ${targetProjectId === item.id ? 'ring-2 ring-blue-500 bg-blue-50' : (item as Project).is_tentative ? 'bg-gray-50/80' : 'bg-white hover:shadow-sm hover:border-blue-200'}`}>
                         <div className="col-span-5">
                           <input type="text" className={`w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none text-sm py-1 font-medium transition-colors ${(item as Project).is_tentative ? 'text-gray-500' : 'text-gray-900'}`} value={item.name} onChange={(e) => setProjects(prev => prev.map(p => p.id === item.id ? { ...p, name: e.target.value } : p))} onBlur={(e) => handleUpdateProject(item as Project, { name: e.target.value })} />
                         </div>
                         <div className="col-span-4 flex items-center gap-2">
                           <input type="date" className="bg-transparent text-xs text-gray-600 outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 transition-colors w-24 cursor-pointer" value={(item as Project).start_date ? format((item as Project).start_date!, 'yyyy-MM-dd') : ''} onChange={(e) => { const val = e.target.value ? new Date(e.target.value) : null; handleUpdateProject(item as Project, { start_date: val }); }} />
                           <span className="text-gray-300">~</span>
                           <input type="date" className="bg-transparent text-xs text-gray-600 outline-none border-b border-transparent hover:border-gray-300 focus:border-blue-500 transition-colors w-24 cursor-pointer" value={(item as Project).end_date ? format((item as Project).end_date!, 'yyyy-MM-dd') : ''} onChange={(e) => { const val = e.target.value ? new Date(e.target.value) : null; handleUpdateProject(item as Project, { end_date: val }); }} />
                         </div>
                         <div className="col-span-2 flex justify-center">
                           <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-gray-200/50 transition-colors">
                             <input type="checkbox" checked={(item as Project).is_tentative} onChange={() => toggleProjectTentative(item as Project)} className="w-4 h-4 border-gray-300 rounded text-gray-600 focus:ring-gray-500 cursor-pointer" />
                             <span className={`text-xs ${(item as Project).is_tentative ? 'text-gray-600 font-medium' : 'text-gray-400'}`}>미확정</span>
                           </label>
                         </div>
                         <div className="col-span-1 text-right">
                           <button onClick={() => handleRemoveProject(item.id)} className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer p-1"><Trash2 size={16} /></button>
                         </div>
                       </div>
                     ))}
                  </div>
               )}
             </div>
           </div>
        )}

        {/* --- Assignments Form --- */}
        {currentTab === 'assignments' && (
          <div className={`max-w-4xl mx-auto transition-all duration-300 ease-in-out border rounded-2xl p-6 mb-10 ${editingAssignment ? 'bg-blue-50/50 border-blue-200 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${editingAssignment ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>{editingAssignment ? <RefreshCcw size={20} className="animate-spin-slow" /> : <Plus size={20} />}</div>
                <div><h2 className="text-xl font-bold tracking-tight text-gray-900">{editingAssignment ? '기존 작업 수정 중' : '새 작업 할당'}</h2></div>
              </div>
              {editingAssignment && (<button onClick={resetForm} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all text-xs font-medium cursor-pointer"><Plus size={14} /> 신규 모드로 전환</button>)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Employee</label><div className="relative"><select className="w-full bg-gray-50 hover:bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl p-3 pl-9 transition-all outline-none appearance-none font-medium text-sm text-gray-700 cursor-pointer" value={selectedEmployeeId} onChange={e => setSelectedEmployeeId(e.target.value)}><option value="">직원을 선택하세요</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /></div></div>
              <div className="space-y-1"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Project</label><div className="relative"><select className="w-full bg-gray-50 hover:bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl p-3 pl-9 transition-all outline-none appearance-none font-medium text-sm text-gray-700 cursor-pointer" value={selectedProjectId} onChange={handleProjectSelect}><option value="">프로젝트를 선택하세요</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name + (p.is_tentative ? ' (미확정)' : '')}</option>)}</select><Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /></div></div>
              <div className="space-y-1 md:col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Period</label><div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-transparent focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all"><div className="flex items-center flex-1 pl-2"><CalendarIcon size={16} className="text-gray-400 mr-2" /><input type="date" className="w-full bg-transparent p-2 outline-none text-gray-700 font-medium text-sm cursor-pointer" value={startDate} onChange={e => setStartDate(e.target.value)} /></div><span className="text-gray-400 font-light px-2 text-sm">to</span><div className="flex items-center flex-1"><input type="date" className="w-full bg-transparent p-2 outline-none text-gray-700 font-medium text-sm text-right pr-4 cursor-pointer" value={endDate} onChange={e => setEndDate(e.target.value)} /></div></div></div>
              <div className="space-y-1 md:col-span-2"><label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Details</label><div className="flex gap-3"><input type="text" placeholder="수행 업무 상세 (선택 사항)" className="flex-grow bg-gray-50 hover:bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl p-3 outline-none transition-all font-medium text-sm text-gray-700 placeholder-gray-400" value={task} onChange={e => setTask(e.target.value)} /><div className={`flex items-center px-4 rounded-xl border cursor-pointer transition-all select-none ${nonBill ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-500'}`} onClick={() => setNonBill(!nonBill)}><div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${nonBill ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>{nonBill && <Check size={10} className="text-white" />}</div><span className="text-xs font-bold">Non-Bill</span></div></div></div>
            </div>
            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-end gap-2">
              {editingAssignment ? (<><button onClick={async () => { if(confirm('정말 삭제하시겠습니까?')) { await supabase.from('assignments').delete().eq('id', editingAssignment.id); resetForm(); }}} className="px-4 py-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-medium transition-colors text-xs flex items-center gap-1 cursor-pointer"><Trash2 size={14} /> 삭제</button><button onClick={handleUpdateAssignment} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center gap-1 text-sm cursor-pointer"><Check size={16} /> 변경 저장</button></>) : (<button onClick={handleAssign} className="w-full md:w-auto px-8 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold shadow-lg shadow-gray-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"><Plus size={16} /> 할당 추가</button>)}
            </div>
          </div>
        )}

        {/* --- Dashboard --- */}
        <section className="mt-4 space-y-4 relative z-40">
          <div className="flex flex-col md:flex-row justify-between items-center bg-white/60 backdrop-blur-sm p-1.5 rounded-xl border border-white/50 shadow-sm sticky top-16 z-50">
             <div className="flex items-center gap-2 pl-1 w-full md:w-auto">
              <div className="w-56"><SegmentedControl options={[{value: 'project', label: 'Project View'}, {value: 'employee', label: 'Employee View'}]} value={viewType} onChange={setViewType} /></div>
              <div className={`transition-all duration-300 overflow-hidden ${checkedAssignmentIds.size > 0 ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                <button onClick={handleBulkDeleteAssignments} className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-100 transition-colors whitespace-nowrap cursor-pointer"><Trash2 size={12}/> <span>{checkedAssignmentIds.size}개 할당 삭제</span></button>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-1 w-full md:w-auto justify-end mt-2 md:mt-0">
              <div className="w-48"><SegmentedControl options={[{value: 'week', label: 'Week'}, {value: 'month', label: 'Month'}, {value: 'year', label: 'Year'}]} value={viewMode} onChange={setViewMode} /></div>
              
              <button 
                onClick={handleToday}
                className="h-9 px-4 text-xs font-semibold bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-all cursor-pointer whitespace-nowrap"
              >
                Today
              </button>

              <div className="relative z-[100]" ref={datePickerRef}>
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 h-9">
                  <button onClick={handlePrevPeriod} className="h-full px-2 rounded-md hover:bg-white hover:shadow-sm text-gray-500 transition-all cursor-pointer"><ChevronLeft size={16}/></button>
                  <button 
                    className="h-full min-w-[8rem] px-3 text-xs font-bold text-gray-700 hover:bg-white hover:shadow-sm rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer"
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  >
                    {getPeriodLabel}
                  </button>
                  <button onClick={handleNextPeriod} className="h-full px-2 rounded-md hover:bg-white hover:shadow-sm text-gray-500 transition-all cursor-pointer"><ChevronRight size={16}/></button>
                </div>

                {isDatePickerOpen && (
                  <CustomDatePicker 
                    viewMode={viewMode} 
                    currentDate={viewDate} 
                    onChange={setViewDate}
                    onClose={() => setIsDatePickerOpen(false)}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden relative z-30">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 table-fixed">
                <thead className="sticky top-0 z-50">
                  <tr className="bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)] h-8">
                    <th className="sticky left-0 z-50 bg-white backdrop-blur-md w-[200px] min-w-[200px] max-w-[200px] px-6 border-r border-gray-100/50 h-8">
                      <div className="flex items-center h-full text-[9px] font-bold text-gray-500 uppercase tracking-wider">{viewType === 'project' ? 'Project' : 'Employee'}</div>
                    </th>
                    <th className="sticky left-[200px] z-50 bg-white backdrop-blur-md w-[100px] min-w-[100px] max-w-[100px] px-4 border-r border-gray-100/50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] h-8">
                      <div className="flex items-center justify-center h-full text-[9px] font-bold text-gray-500 uppercase tracking-wider">Total MM</div>
                    </th>
                    <th className="sticky left-[300px] z-50 bg-white backdrop-blur-md w-[350px] min-w-[350px] max-w-[350px] px-6 border-r-2 border-gray-200 h-8">
                      <div className="flex items-center h-full text-[9px] font-bold text-gray-500 uppercase tracking-wider">Assignment Details</div>
                    </th>
                    
                    {periodCols.map((date) => (
                      <th key={format(date, 'yyyy-MM-dd')} 
                          className={`px-1 border-b border-gray-100 min-w-[3rem] h-8
                          ${isCurrentTimeColumn(date) ? 'text-amber-600 bg-amber-50' : 'text-gray-400'}`}>
                        {viewMode === 'year' ? (
                          <div className="flex items-center justify-center h-full">
                            <span className="uppercase tracking-widest text-[9px]">{format(date, 'MMM', { locale: ko })}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-0.5 h-full">
                            <span className="uppercase tracking-widest text-[9px]">{format(date, 'EEE', { locale: ko })}</span>
                            <span className={`text-[9px] ${isSameDay(date, today) ? 'font-bold' : 'font-normal'}`}>{format(date, 'd')}</span>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-50">
                  {displayRows.map((row) => {
                    const rowAssignments = filteredAssignments
                      .filter(a => row.type === 'project' ? a.project_id === row.id : a.employee_id === row.id)
                      .sort((a, b) => a.start_date.getTime() - b.start_date.getTime());
                    
                    const employeeData = viewType === 'employee' ? employees.find(e => e.id === row.id) : null;

                    return (
                      <tr key={row.uniqueKey} className="group hover:bg-gray-50/80 transition-colors duration-150">
                        {/* 1. Name */}
                        <td className="sticky left-0 z-30 bg-white group-hover:bg-gray-50 px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-100 border-b border-gray-100 w-[200px] min-w-[200px] max-w-[200px]">
                           <span 
                             onClick={() => {
                               if (row.type === 'project') {
                                 setCurrentTab('projects');
                                 setTargetProjectId(row.id);
                               }
                             }}
                             className={`flex items-center gap-2 ${row.type === 'project' ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''}`}
                           >
                             {/* Employee Color Bar */}
                             {viewType === 'employee' && employeeData && (
                               <div className={`w-1 h-3 rounded-full flex-shrink-0 ${getEmployeeColorIndicator(employeeData.employee_type)}`} title={getEmployeeTypeLabel(employeeData.employee_type)} />
                             )}
                             <span className="truncate">{row.name}</span>
                           </span>
                        </td>

                        {/* 2. Total MM */}
                        <td className="sticky left-[200px] z-30 bg-white group-hover:bg-gray-50 px-4 py-2 whitespace-nowrap text-xs font-bold text-center text-gray-600 border-r border-gray-100 border-b border-gray-100 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] w-[100px] min-w-[100px] max-w-[100px]">
                          {getRowTotalMM(row, rowAssignments)}
                        </td>

                        {/* 3. Details */}
                        <td className="sticky left-[300px] z-30 bg-white group-hover:bg-gray-50 px-6 py-1 text-xs border-r-2 border-gray-200 border-b border-gray-100 shadow-md w-[350px] min-w-[350px] max-w-[350px] align-top">
                          {rowAssignments.length === 0 && <div className="h-5 flex items-center text-gray-300">-</div>}
                          {rowAssignments.map((a) => {
                             const targetName = row.type === 'project' ? employees.find(e => e.id === a.employee_id)?.name : projects.find(p => p.id === a.project_id)?.name;
                             return (
                               <div key={a.id} className="h-5 mb-0.5 flex items-center gap-2 group/item">
                                 <label className="flex items-center justify-center p-1 rounded-full cursor-pointer hover:bg-gray-200/50 transition-colors">
                                    <input type="checkbox" className="peer appearance-none w-3.5 h-3.5 border-2 border-gray-300 rounded checked:bg-blue-500 checked:border-blue-500 transition-all cursor-pointer" checked={checkedAssignmentIds.has(a.id)} onChange={() => toggleAssignmentCheck(a.id)}/>
                                    <Check size={8} className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={4} />
                                 </label>
                                 <div onClick={() => handleEditAssignment(a)} className="flex items-center gap-2 cursor-pointer p-1 -ml-1 rounded transition-colors hover:bg-blue-50 flex-grow w-full">
                                   <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getDotColorClass(a)}`}></div>
                                   
                                   <div className="flex items-center text-xs w-full">
                                     <span className="font-semibold text-gray-700 truncate w-24 mr-1" title={targetName}>
                                       {targetName}
                                     </span>
                                     <span className="text-gray-500 font-medium w-14 text-center">
                                       ({calculateExactMM(a, periodStart, periodEnd).toFixed(2)})
                                     </span>
                                     <span className="text-[10px] text-gray-400 tracking-tight ml-auto tabular-nums">
                                       {format(a.start_date, 'MM.dd')}~{format(a.end_date, 'MM.dd')}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                             );
                          })}
                        </td>

                        {/* 4. Gantt Grid */}
                        {periodCols.map((colDate) => {
                          const isOver = (viewType === 'employee') && isOverworked(row.id, colDate);
                          const isHighlighted = isCurrentTimeColumn(colDate);
                          
                          const colStart = viewMode === 'year' ? startOfMonth(colDate) : startOfDay(colDate);
                          const colEnd = viewMode === 'year' ? endOfMonth(colDate) : endOfDay(colDate);

                          const currentProject = viewType === 'project' ? projects.find(p => p.id === row.id) : null;
                          let isProjectDuration = false;
                          let hasAssignmentOnThisDay = false; 

                          if (currentProject && currentProject.start_date && currentProject.end_date) {
                              const pStart = startOfDay(currentProject.start_date);
                              const pEnd = endOfDay(currentProject.end_date);
                              isProjectDuration = (pStart <= colEnd) && (pEnd >= colStart);
                          }

                          if (isProjectDuration) {
                             hasAssignmentOnThisDay = rowAssignments.some(a => {
                               const aStart = startOfDay(a.start_date);
                               const aEnd = endOfDay(a.end_date);
                               return (aStart <= colEnd) && (aEnd >= colStart);
                             });
                          }

                          let cellBgClass = '';
                          // [Priority] Overworked (Red) > Today (Amber) > Tentative (Gray)
                          if (isOver) cellBgClass = '!bg-red-100 ring-1 ring-inset ring-red-200';
                          else if (isHighlighted) cellBgClass = 'bg-amber-50';
                          else if (isProjectDuration && currentProject?.is_tentative && !hasAssignmentOnThisDay) cellBgClass = 'bg-gray-100/80';

                          return (
                            <td key={format(colDate, 'yyyy-MM-dd')} className={`px-0.5 py-1 text-center border-b border-gray-50 align-top ${cellBgClass}`}>
                              <div className="flex flex-col w-full">
                                {rowAssignments.length === 0 && <div className="h-5"></div>}
                                {rowAssignments.map((a) => {
                                  const aStart = startOfDay(a.start_date);
                                  const aEnd = endOfDay(a.end_date);
                                  
                                  const isWorkCol = (aStart <= colEnd) && (aEnd >= colStart);
                                  
                                  if (isWorkCol) {
                                     const targetName = row.type === 'project' ? employees.find(e => e.id === a.employee_id)?.name : projects.find(p => p.id === a.project_id)?.name;
                                     return (
                                      <div 
                                        key={a.id} 
                                        className={`h-5 mb-0.5 w-full rounded-[2px] shadow-sm transition-transform hover:scale-110 hover:z-10 cursor-pointer
                                          ${getBarColorClass(a)}
                                        `}
                                        title={`${targetName}`}
                                        onClick={() => handleEditAssignment(a)}
                                      ></div>
                                     );
                                  } else {
                                     return <div key={a.id} className="h-5 mb-0.5 w-full bg-transparent"></div>;
                                  }
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

          {/* Bottom Summary Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-6">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <PieChart size={16} className="text-gray-500" />
              Summary
            </h3>
            
            {viewType === 'project' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                  <div className="text-xs font-bold text-blue-700 mb-2 flex items-center justify-between">
                    <span>Active Projects (Assigned)</span>
                    <span className="bg-white px-2 py-0.5 rounded-full text-blue-600 shadow-sm">{projectStatus.activeProjects.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                    {projectStatus.activeProjects.map(p => (
                      <span key={p.id} className="text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded-md shadow-sm">{p.name}</span>
                    ))}
                    {projectStatus.activeProjects.length === 0 && <span className="text-xs text-gray-400 italic">None</span>}
                  </div>
                </div>
                <div className="bg-gray-50/80 rounded-lg p-3 border border-gray-200">
                  <div className="text-xs font-bold text-gray-600 mb-2 flex items-center justify-between">
                    <span>Idle Projects (Unassigned)</span>
                    <span className="bg-white px-2 py-0.5 rounded-full text-gray-500 shadow-sm">{projectStatus.idleProjects.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                    {projectStatus.idleProjects.map(p => (
                      <span key={p.id} className="text-[10px] bg-white border border-gray-300 text-gray-500 px-2 py-1 rounded-md shadow-sm">{p.name}</span>
                    ))}
                    {projectStatus.idleProjects.length === 0 && <span className="text-xs text-gray-400 italic">None</span>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex flex-col gap-3">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Annual Utilization Rate ({utilStats.year})</div>
                
                <div className="flex flex-col">
                   <span className="text-2xl font-bold text-gray-900">
                     TOTAL {utilStats.totalPct.toFixed(1)}%
                   </span>
                   <div className="text-xs mt-1 flex items-center gap-1.5">
                     <span className="font-bold text-blue-600">{utilStats.billablePct.toFixed(1)}% Assigned</span>
                     <span className="text-gray-400">+</span>
                     <span className="font-bold text-orange-500">{utilStats.nonBillPct.toFixed(1)}% Non-bill</span>
                     <span className="text-gray-400">+</span>
                     <span className="font-bold text-gray-500">{utilStats.tentativePct.toFixed(1)}% 미확정</span>
                   </div>
                </div>

                {/* [MODIFIED] Util Bar: Correct 3D Effect with removed Overflow Hidden on Parent */}
                <div className="relative h-4 mt-2 mb-1 w-full flex">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-200 ease-out cursor-pointer hover:scale-y-125 hover:shadow-lg hover:z-10 origin-bottom first:rounded-l-full last:rounded-r-full" 
                    style={{ width: `${utilStats.billablePct}%` }} 
                    title={`Billable`}
                    onClick={() => handleShowUtilizationDetails('billable')}
                  ></div>
                  <div 
                    className="h-full bg-orange-400 transition-all duration-200 ease-out cursor-pointer hover:scale-y-125 hover:shadow-lg hover:z-10 origin-bottom first:rounded-l-full last:rounded-r-full" 
                    style={{ width: `${utilStats.nonBillPct}%` }} 
                    title={`Non-Billable`}
                    onClick={() => handleShowUtilizationDetails('nonBill')}
                  ></div>
                  <div 
                    className="h-full bg-gray-400 transition-all duration-200 ease-out cursor-pointer hover:scale-y-125 hover:shadow-lg hover:z-10 origin-bottom first:rounded-l-full last:rounded-r-full" 
                    style={{ width: `${utilStats.tentativePct}%` }} 
                    title={`Tentative`}
                    onClick={() => handleShowUtilizationDetails('tentative')}
                  ></div>
                  {/* Background Track (behind the bars) */}
                  <div className="absolute inset-0 bg-gray-200 rounded-full -z-10"></div>
                </div>

                <div className="text-xs text-gray-500 text-right mt-1">
                  Total Capacity: <span className="font-medium text-gray-900">{utilStats.totalCapacityMM} MM (Billable {utilStats.billableEmployees}명 * 12.0MM)</span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}