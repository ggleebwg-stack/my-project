import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { assignmentSchema, AssignmentFormValues } from '@/lib/schemas'; // 위에서 만든 스키마 import
import { Employee, Project, Assignment } from '@/types';
import { Save, X, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  employees: Employee[];
  projects: Project[];
  initialData: Assignment | null;
  onSubmit: (data: Omit<Assignment, 'id'>) => void;
  onUpdate: (id: string, data: Partial<Assignment>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCancel: () => void;
}

export const AssignmentForm = ({ employees, projects, initialData, onSubmit, onUpdate, onDelete, onCancel }: Props) => {
  const isEditMode = !!initialData && !!initialData.id;

  // React Hook Form 초기화
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      employee_id: '',
      project_id: '',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      non_bill: false,
    },
  });

  // 초기 데이터 로드 (Assignment 탭 진입 시)
  useEffect(() => {
    if (initialData) {
      reset({
        employee_id: initialData.employee_id,
        project_id: initialData.project_id,
        start_date: format(new Date(initialData.start_date), 'yyyy-MM-dd'),
        end_date: format(new Date(initialData.end_date), 'yyyy-MM-dd'),
        non_bill: initialData.non_bill,
      });
    }
  }, [initialData, reset]);

  // 폼 제출 핸들러
  const onFormSubmit = async (data: AssignmentFormValues) => {
    const payload = {
      ...data,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
    };

    if (isEditMode && initialData) {
      await onUpdate(initialData.id, payload);
    } else {
      onSubmit(payload as any);
    }
    // 성공 후 폼 초기화는 부모 컴포넌트의 상태 변경에 따름
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          {isEditMode ? 'Edit Assignment' : 'New Assignment'}
        </h3>
        {isEditMode && (
          <button
            type="button"
            onClick={async () => {
              if (confirm('Are you sure you want to delete this assignment?')) {
                await onDelete(initialData.id);
              }
            }}
            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Employee Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Employee</label>
            <select
              {...register('employee_id')}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all ${errors.employee_id ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'}`}
            >
              <option value="">Select Employee...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.employee_type})</option>
              ))}
            </select>
            {errors.employee_id && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12}/> {errors.employee_id.message}</p>}
          </div>

          {/* Project Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Project</label>
            <select
              {...register('project_id')}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all ${errors.project_id ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'}`}
            >
              <option value="">Select Project...</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.project_id && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12}/> {errors.project_id.message}</p>}
          </div>

          {/* Date Range */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Period</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                {...register('start_date')}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                {...register('end_date')}
                className={`flex-1 border rounded-lg px-3 py-2.5 text-sm outline-none transition-all ${errors.end_date ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50'}`}
              />
            </div>
            {/* 종료일 < 시작일 에러 메시지 표시 */}
            {errors.end_date && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle size={12}/> {errors.end_date.message}</p>}
          </div>

          {/* Type Checkbox */}
          <div className="flex items-center h-full pt-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input type="checkbox" {...register('non_bill')} className="peer sr-only" />
                <div className="w-10 h-6 bg-gray-200 rounded-full peer peer-checked:bg-orange-500 peer-focus:ring-2 peer-focus:ring-orange-200 transition-all"></div>
                <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-all peer-checked:translate-x-4"></div>
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Non-Billable Assignment</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <X size={16} /> Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transform active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save size={16} /> {isEditMode ? 'Update Assignment' : 'Create Assignment'}
          </button>
        </div>
      </form>
    </div>
  );
};