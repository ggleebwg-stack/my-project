import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { projectSchema, ProjectFormValues } from '@/lib/schemas';
// [수정] AlertCircle 추가
import { X, Calendar as CalendarIcon, Briefcase, Save, Trash2, PackageSearch, AlertCircle } from 'lucide-react';
import { Project } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ProjectDrawerProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onUpdateProject: (id: string, data: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
}

export const ProjectDrawer = ({ project, isOpen, onClose, isAdmin, onUpdateProject, onDeleteProject }: ProjectDrawerProps) => {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
  });

  const isTentative = watch('is_tentative');

  useEffect(() => {
    if (project) {
      reset({
        name: project.name,
        start_date: (project as any).start_date ? format(new Date((project as any).start_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        end_date: (project as any).end_date ? format(new Date((project as any).end_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        is_tentative: project.is_tentative,
        solutions: project.solutions || '' // [추가] 제품명 로드
      });
    }
  }, [project, reset]);

  const onFormSubmit = async (data: ProjectFormValues) => {
    if (!project) return;
    try {
      await onUpdateProject(project.id, {
        name: data.name,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        is_tentative: data.is_tentative,
        solutions: data.solutions // [추가] 제품명 저장
      } as any);
      toast.success('프로젝트 정보가 저장되었습니다.');
      onClose();
    } catch (error) {
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!project) return;
    if (confirm('정말 이 프로젝트를 삭제하시겠습니까? 관련된 모든 할당 정보도 삭제됩니다.')) {
      await onDeleteProject(project.id);
      toast.success('프로젝트가 삭제되었습니다.');
      onClose();
    }
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/5 backdrop-blur-[1px] transition-opacity z-[70] ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
      
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-[80] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 truncate max-w-[280px]">{project?.name}</h2>
            <span className={`inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${isTentative ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-700'}`}>
              {isTentative ? '미확정 (Tentative)' : '확정 (Confirmed)'}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-24">
          <form id="project-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            
            {/* Project Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><Briefcase size={16} /> Basic Info</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Project Name</label>
                  <input 
                    className={`w-full border-b border-gray-200 focus:border-blue-500 outline-none py-2 text-sm transition-colors ${!isAdmin && 'bg-transparent'}`}
                    disabled={!isAdmin}
                    {...register('name')}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                {/* [추가] 제품명 입력 필드 */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><PackageSearch size={12}/> 제품명 (Solutions)</label>
                  <input 
                    className={`w-full border-b border-gray-200 focus:border-blue-500 outline-none py-2 text-sm transition-colors ${!isAdmin && 'bg-transparent'}`}
                    placeholder="예: ERP, Cloud, AI (콤마로 구분)"
                    disabled={!isAdmin}
                    {...register('solutions')}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">프로젝트 타임라인에서 말풍선으로 표시됩니다.</p>
                </div>

                {/* 확정 여부 토글 */}
                {isAdmin && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                    <span className="text-sm text-gray-600 font-medium">확정 여부</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={!isTentative} onChange={(e) => setValue('is_tentative', !e.target.checked)} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Info (기존 동일) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2"><CalendarIcon size={16} /> Schedule</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Start Date</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 border-gray-200" disabled={!isAdmin} {...register('start_date')} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">End Date</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 border-gray-200" disabled={!isAdmin} {...register('end_date')} />
                </div>
              </div>
              {errors.end_date && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12}/> {errors.end_date.message}</p>}
            </div>

          </form>
        </div>
        
        {isAdmin && (
          <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-gray-200 flex justify-between items-center shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
            <button type="button" onClick={handleDelete} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Delete Project"><Trash2 size={20} /></button>
            <button type="submit" form="project-form" disabled={isSubmitting} className="flex-1 ml-3 flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-70"><Save size={16} /> Save Changes</button>
          </div>
        )}
      </div>
    </>
  );
};