'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { toast } from 'sonner'; // [추가]
import { Lock, Unlock, LayoutDashboard, Users, FolderKanban, ClipboardList, ChevronLeft, ChevronRight, ArrowUp, Edit } from 'lucide-react';
import { useResourceData } from '@/hooks/useResourceData';

import { SegmentedControl } from '@/components/common/SegmentedControl';
import { CustomDatePicker } from '@/components/common/CustomDatePicker';
import { GanttChart } from '@/components/dashboard/GanttChart';
import { UtilizationBar } from '@/components/dashboard/UtilizationBar';
import { ProjectSummary } from '@/components/dashboard/ProjectSummary';
import { ProjectManager } from '@/components/dashboard/ProjectManager';
import { UtilizationPopup, PopupData, PopupDetailItem } from '@/components/dashboard/UtilizationPopup';
import { AssignmentForm } from '@/components/assignment/AssignmentForm';
import { EmployeeList } from '@/components/employee/EmployeeList';
import { EmployeeStats } from '@/components/employee/EmployeeStats';
import { EmployeeDrawer } from '@/components/employee/EmployeeDrawer';

import { Employee, Assignment, Project, EmployeeType } from '@/types'; // [수정] EmployeeType 추가
import { format, startOfYear, endOfYear, addWeeks, subWeeks, addMonths, subMonths, addYears, subYears } from 'date-fns';
import { calculateExactMM } from '@/utils/dateUtils';

export default function Page() {
  const { 
    projects, employees, assignments, loading, 
    actions: { addEmployee, removeEmployee, updateEmployeeType, addAssignment, updateAssignment, deleteAssignment, addProject, updateProject, deleteProject } 
  } = useResourceData();

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentTab, setCurrentTab] = useState('main');
  const [viewMode, setViewMode] = useState<'week'|'month'|'year'>('year');
  const [viewType, setViewType] = useState<'project'|'employee'>('project');
  const [viewDate, setViewDate] = useState(new Date());
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  
  const [utilPopupData, setUtilPopupData] = useState<PopupData | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [newEmpName, setNewEmpName] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (tab === 'main') {
      setViewType('project');
      setViewMode('year');
    }
    // 탭 이동 시 상태 초기화
    setSelectedEmployee(null);
    setEditingAssignment(null);
    if (tab !== 'projects') setSelectedProject(null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // [추가] 직원 타입을 순환시키는 핸들러 (Adapter)
  const handleToggleEmployeeType = (employee: Employee) => {
    const types: EmployeeType[] = ['billable', 'internal', 'other_unit', 'outsourcing'];
    const nextType = types[(types.indexOf(employee.employee_type) + 1) % types.length];
    
    // 훅의 updateEmployeeType 호출 (id, type)
    updateEmployeeType(employee.id, nextType);
  };

  const handleUpdateEmployee = (id: string, data: Partial<Employee>) => {
    if (data.employee_type) updateEmployeeType(id, data.employee_type as any);
    // [수정] Toast 적용 (alert 제거)
    // Drawer 내부에서 이미 toast를 띄우고 있다면 여기서는 생략해도 되지만, 
    // 확실한 피드백을 위해 띄웁니다.
    // toast.success('직원 정보가 업데이트되었습니다.'); 
    setSelectedEmployee(null);
  };

  const sortedAssignments = useMemo(() => {
    const priority: Record<string, number> = { 'billable': 1, 'internal': 2, 'other_unit': 3, 'outsourcing': 4 };
    return [...assignments].sort((a, b) => {
      const empA = employees.find(e => e.id === a.employee_id);
      const empB = employees.find(e => e.id === b.employee_id);
      const typeA = empA?.employee_type || 'outsourcing';
      const typeB = empB?.employee_type || 'outsourcing';
      const diff = (priority[typeA] || 99) - (priority[typeB] || 99);
      if (diff !== 0) return diff;
      return (empA?.name || '').localeCompare(empB?.name || '', 'ko');
    });
  }, [assignments, employees]);

  // ... (기존 핸들러 유지) ...
  const handleAdminToggle = () => { if (isAdmin) setIsAdmin(false); else { const pw = window.prompt("Admin Password:"); if (pw === (process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '1234')) setIsAdmin(true); } };
  const handleToday = () => setViewDate(new Date());
  const handlePrevPeriod = () => { if (viewMode === 'week') setViewDate(subWeeks(viewDate, 1)); else if (viewMode === 'month') setViewDate(subMonths(viewDate, 1)); else setViewDate(subYears(viewDate, 1)); };
  const handleNextPeriod = () => { if (viewMode === 'week') setViewDate(addWeeks(viewDate, 1)); else if (viewMode === 'month') setViewDate(addMonths(viewDate, 1)); else setViewDate(addYears(viewDate, 1)); };
  const getPeriodLabel = React.useMemo(() => { if (viewMode === 'year') return format(viewDate, 'yyyy년'); return format(viewDate, 'yyyy. MM'); }, [viewDate, viewMode]);
  
  const handleProjectClick = (project: Project) => {
    if (isAdmin) {
      setSelectedProject(project);
      setCurrentTab('projects');
    }
  };
  
  const handleEditAssignmentFromDrawer = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setSelectedEmployee(null);
    setCurrentTab('assignments');
  };

  const handleShowUtilizationDetails = (category: 'billable' | 'nonBill' | 'tentative') => {
      const yearStart = startOfYear(viewDate);
      const yearEnd = endOfYear(viewDate);
      const targetAssignments = assignments.filter(a => {
        const p = projects.find(proj => proj.id === a.project_id);
        const e = employees.find(emp => emp.id === a.employee_id);
        if (!p || !e) return false;
        const mm = calculateExactMM(a, yearStart, yearEnd);
        if (mm <= 0) return false;
        (a as any)._tempMM = mm;
        if (category === 'tentative') return p.is_tentative && e.employee_type === 'billable';
        if (category === 'nonBill') return !p.is_tentative && a.non_bill && e.employee_type === 'billable';
        if (category === 'billable') return !p.is_tentative && !a.non_bill && (e.employee_type === 'billable' || e.employee_type === 'internal');
        return false;
      });
      const groupedMap = new Map<string, PopupDetailItem[]>();
      targetAssignments.forEach(a => {
        const pName = projects.find(p => p.id === a.project_id)?.name || 'Unknown';
        const eName = employees.find(e => e.id === a.employee_id)?.name || 'Unknown';
        if (!groupedMap.has(pName)) groupedMap.set(pName, []);
        groupedMap.get(pName)!.push({ empName: eName, period: `${format(a.start_date, 'MM.dd')}~${format(a.end_date, 'MM.dd')}`, mm: (a as any)._tempMM });
      });
      const data = Array.from(groupedMap.entries()).map(([projectName, items]) => ({ projectName, items: items.sort((a, b) => a.empName.localeCompare(b.empName, 'ko')) })).sort((a, b) => a.projectName.localeCompare(b.projectName, 'ko'));
      let title = '', colorClass = '';
      if (category === 'billable') { title = 'Assigned (Billable)'; colorClass = 'text-blue-600'; }
      else if (category === 'nonBill') { title = 'Non-Billable'; colorClass = 'text-orange-500'; }
      else { title = 'Tentative (미확정)'; colorClass = 'text-gray-500'; }
      setUtilPopupData({ title, colorClass, data });
  };

  useEffect(() => { const handleScroll = () => setShowScrollTop(window.scrollY > 300); window.addEventListener('scroll', handleScroll); return () => window.removeEventListener('scroll', handleScroll); }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  useEffect(() => { const handleClick = (e: MouseEvent) => { if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) setIsDatePickerOpen(false); }; document.addEventListener('mousedown', handleClick); return () => document.removeEventListener('mousedown', handleClick); }, []);

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-400">Loading Resources...</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20 font-sans relative">
      <UtilizationPopup data={utilPopupData} onClose={() => setUtilPopupData(null)} />

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-[60] border-b border-gray-200/60">
        <div className="max-w-[1800px] mx-auto px-6 h-14 flex items-center justify-between">
          <h1 onClick={() => handleTabChange('main')} className="text-lg font-bold text-gray-900 flex items-center gap-2 cursor-pointer">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Bob&apos;s SD Resource manager
          </h1>
          <div className="flex items-center gap-3">
             <button onClick={handleAdminToggle} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full border ${isAdmin ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-500 border-transparent'}`}>
                {isAdmin ? <Unlock size={12} /> : <Lock size={12} />} {isAdmin ? 'ADMIN' : 'GUEST'}
             </button>
             <nav className="flex space-x-1 bg-gray-100/80 p-1 rounded-lg">
                <TabButton active={currentTab === 'main'} onClick={() => handleTabChange('main')} icon={<LayoutDashboard size={14} />} label="Dashboard" />
                <TabButton active={currentTab === 'projects'} onClick={() => handleTabChange('projects')} icon={<FolderKanban size={14} />} label="Projects" />
                <TabButton active={currentTab === 'employees'} onClick={() => handleTabChange('employees')} icon={<Users size={14} />} label="Employees" />
                <TabButton active={currentTab === 'assignments'} onClick={() => handleTabChange('assignments')} icon={<ClipboardList size={14} />} label="Assignments" />
             </nav>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-6 py-6">
        {currentTab === 'main' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-white/60 backdrop-blur-sm p-1.5 rounded-xl border border-white/50 shadow-sm sticky top-16 z-50">
               <div className="w-56">
                 <SegmentedControl options={[{value: 'project', label: 'Project View'}, {value: 'employee', label: 'Employee View'}]} value={viewType} onChange={setViewType} />
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-48">
                   <SegmentedControl options={[{value: 'week', label: 'Week'}, {value: 'month', label: 'Month'}, {value: 'year', label: 'Year'}]} value={viewMode} onChange={setViewMode} />
                 </div>
                 <button onClick={handleToday} className="bg-white border border-gray-200 shadow-[0_2px_5px_rgba(0,0,0,0.05)] rounded-xl px-5 py-2 text-sm font-bold text-orange-600 hover:bg-orange-50 active:scale-95 transition-all">Today</button>
                 <div className="relative z-[100]" ref={datePickerRef}>
                   <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                     <button onClick={handlePrevPeriod} className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm transition-all"><ChevronLeft size={18} /></button>
                     <button onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} className="px-4 text-sm font-bold text-gray-800 min-w-[80px] text-center cursor-pointer select-none">{getPeriodLabel}</button>
                     <button onClick={handleNextPeriod} className="p-1.5 rounded-lg text-gray-500 hover:bg-white hover:shadow-sm transition-all"><ChevronRight size={18} /></button>
                   </div>
                   {isDatePickerOpen && <CustomDatePicker viewMode={viewMode} currentDate={viewDate} onChange={setViewDate} onClose={() => setIsDatePickerOpen(false)} />}
                 </div>
               </div>
            </div>

            <GanttChart 
              projects={projects} employees={employees} assignments={assignments} 
              viewMode={viewMode} viewDate={viewDate} viewType={viewType} isAdmin={isAdmin}
              onEditAssignment={(a) => { setEditingAssignment(a); setCurrentTab('assignments'); }}
              // [수정] onSelectRow 로직 변경
              onSelectRow={(id, type) => { 
                if (type === 'employee') {
                  if (isAdmin) {
                    // 관리자: Assignments 탭으로 이동하여 해당 직원으로 '새 할당' 생성 모드 진입
                    setCurrentTab('assignments');
                    setSelectedEmployee(null); // Drawer 닫기
                    setEditingAssignment({
                      id: '', // Empty ID = New Mode
                      employee_id: id,
                      project_id: '', // 프로젝트는 비워둠 (선택 유도)
                      start_date: new Date(),
                      end_date: new Date(),
                      non_bill: false
                    } as Assignment);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    // 게스트: 기존처럼 Drawer 열기
                    setSelectedEmployee(employees.find(e => e.id === id) || null);
                  }
                }
              }}
              onProjectClick={handleProjectClick}
            />

            {viewType === 'project' && <ProjectSummary projects={projects} assignments={assignments} />}
            {viewType === 'employee' && <UtilizationBar employees={employees} assignments={assignments} projects={projects} viewDate={viewDate} onDetailClick={handleShowUtilizationDetails} />}
          </div>
        )}

        {/* ... (Projects, Employees, Assignments 탭 동일) ... */}
        {currentTab === 'projects' && (
          <ProjectManager projects={projects} isAdmin={isAdmin} onAddProject={addProject!} onUpdateProject={updateProject!} onDeleteProject={deleteProject!} initialEditingProject={selectedProject} />
        )}

        {currentTab === 'employees' && (
          <div className="max-w-6xl mx-auto">
            <EmployeeStats employees={employees} />
            {isAdmin && (
               <div className="flex gap-2 mb-4">
                 <input className="border rounded p-2 text-sm" placeholder="New Employee" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} />
                 <button onClick={() => { addEmployee(newEmpName); setNewEmpName(''); }} className="bg-blue-600 text-white px-4 rounded text-sm font-bold">Add</button>
               </div>
            )}
            <EmployeeList employees={employees} isAdmin={isAdmin} onSelect={setSelectedEmployee} onDelete={removeEmployee} onToggleType={handleToggleEmployeeType} />
          </div>
        )}

        {currentTab === 'assignments' && (
          <div className="max-w-5xl mx-auto space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Assignment Editor</h2>
              {isAdmin ? (
                 <AssignmentForm employees={employees} projects={projects} initialData={editingAssignment} onSubmit={addAssignment}
                   onUpdate={async (id, data) => { await updateAssignment(id, data); setEditingAssignment(null); }}
                   onDelete={async (id) => { await deleteAssignment(id); setEditingAssignment(null); }}
                   onCancel={() => setEditingAssignment(null)}
                 />
              ) : (
                 <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-white rounded-2xl border border-gray-100">
                   <Lock size={32} className="mb-2 opacity-20" />
                   <p className="font-medium text-sm">Admin Only</p>
                 </div>
              )}
            </div>
            <div>
               <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-blue-600" /> All Assignments</h2>
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-semibold sticky top-0 z-10">
                        <tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Period</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 w-20 text-center">Action</th></tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                       {sortedAssignments.map(assign => {
                         const empName = employees.find(e => e.id === assign.employee_id)?.name || 'Unknown';
                         const projName = projects.find(p => p.id === assign.project_id)?.name || 'Unknown';
                         return (
                           <tr key={assign.id} className="hover:bg-blue-50/50 transition-colors">
                             <td className="px-4 py-2.5 font-medium text-gray-900">{empName}</td>
                             <td className="px-4 py-2.5 text-gray-700">{projName}</td>
                             <td className="px-4 py-2.5 text-gray-500 tabular-nums">{format(assign.start_date, 'yyyy.MM.dd')} ~ {format(assign.end_date, 'yyyy.MM.dd')}</td>
                             <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${assign.non_bill ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{assign.non_bill ? 'NON-BILL' : 'BILLABLE'}</span></td>
                             <td className="px-4 py-2.5 text-center">{isAdmin && <button onClick={() => { setEditingAssignment(assign); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="p-1.5 text-blue-600 hover:bg-white hover:shadow-sm rounded transition-all"><Edit size={16} /></button>}</td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>

      {showScrollTop && (
        <button onClick={scrollToTop} className="fixed bottom-8 right-8 p-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg text-gray-600 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all z-[100] animate-in slide-in-from-bottom-5 fade-in">
          <ArrowUp size={24} strokeWidth={2.5} />
        </button>
      )}

      <EmployeeDrawer 
        employee={selectedEmployee} 
        isOpen={!!selectedEmployee} 
        onClose={() => setSelectedEmployee(null)} 
        isAdmin={isAdmin} 
        assignments={assignments} 
        projects={projects} 
        onEditAssignment={handleEditAssignmentFromDrawer} 
        onUpdateEmployee={handleUpdateEmployee}
      />
    </div>
  );
}

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-md transition-all ${active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
    {icon} {label}
  </button>
);