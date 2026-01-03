import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { Project } from '@/types';
import { toast } from 'sonner';
import { ProjectTimeline } from '@/components/project/ProjectTimeline';
import { ProjectDrawer } from '@/components/project/ProjectDrawer';

interface ProjectManagerProps {
  projects: Project[];
  isAdmin: boolean;
  onAddProject: (name: string) => void;
  onUpdateProject: (id: string, data: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  initialEditingProject?: Project | null;
}

export const ProjectManager = ({ projects, isAdmin, onAddProject, onUpdateProject, onDeleteProject, initialEditingProject }: ProjectManagerProps) => {
  // [상태 선언 복구]
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  
  // 연도 뷰 상태
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  
  // 솔루션(제품명) 말풍선 토글 상태
  const [showSolutions, setShowSolutions] = useState(false);

  // 초기 편집 프로젝트 설정 (Dashboard 등에서 넘어왔을 때)
  useEffect(() => {
    if (initialEditingProject) {
      setSelectedProject(initialEditingProject);
    }
  }, [initialEditingProject]);

  const handleAdd = () => {
    if (!newProjectName.trim()) {
      toast.error('프로젝트 이름을 입력해주세요.');
      return;
    }
    onAddProject(newProjectName);
    setNewProjectName('');
    toast.success('새 프로젝트가 추가되었습니다.');
  };

  const handleToday = () => {
    const thisYear = new Date().getFullYear();
    setViewYear(thisYear);
  };

  return (
    <div className="max-w-[1800px] mx-auto space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm sticky top-20 z-30">
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mr-4">
            <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
            Project Schedule
          </h2>

          <div className="flex items-center gap-2">
            {/* 연도 이동 */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg">
              <button onClick={() => setViewYear(prev => prev - 1)} className="p-1 text-gray-500 hover:bg-white hover:shadow-sm rounded transition-all"><ChevronLeft size={16} /></button>
              <span className="px-3 text-sm font-bold text-gray-700 select-none min-w-[60px] text-center">{viewYear}년</span>
              <button onClick={() => setViewYear(prev => prev + 1)} className="p-1 text-gray-500 hover:bg-white hover:shadow-sm rounded transition-all"><ChevronRight size={16} /></button>
            </div>
            
            {/* Today 버튼 */}
            <button 
              onClick={handleToday} 
              className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors"
            >
              Today
            </button>

            {/* 제품명 버튼 (파스텔 톤) */}
            <button 
              onClick={() => setShowSolutions(!showSolutions)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                showSolutions 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <PackageSearch size={14} />
              제품명
            </button>
          </div>
        </div>

        {/* Add Project */}
        {isAdmin && (
          <div className="flex gap-2 w-full sm:w-auto">
            <input 
              className="border rounded-lg px-3 py-1.5 text-sm w-full sm:w-60 outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white" 
              placeholder="New Project Name..." 
              value={newProjectName} 
              onChange={e => setNewProjectName(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap">
              <Plus size={16} /> Add
            </button>
          </div>
        )}
      </div>
      
      {/* Timeline View */}
      <ProjectTimeline 
        projects={projects} 
        year={viewYear} 
        showSolutions={showSolutions} 
        onProjectClick={(project) => isAdmin && setSelectedProject(project)}
      />

      {/* Edit Drawer */}
      <ProjectDrawer
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        isAdmin={isAdmin}
        onUpdateProject={onUpdateProject}
        onDeleteProject={onDeleteProject}
      />
    </div>
  );
};