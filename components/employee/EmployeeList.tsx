import React, { useMemo } from 'react';
import { Employee } from '@/types';
import { Trash2 } from 'lucide-react';

interface Props {
  employees: Employee[];
  isAdmin: boolean;
  onSelect: (e: Employee) => void;
  onDelete: (id: string) => void;
  // [수정] onToggleType prop은 더 이상 이 컴포넌트에서 사용하지 않으므로 제거 가능하지만,
  // 부모 호환성을 위해 남겨두거나 선택적으로 만듦
  onToggleType?: (e: Employee) => void;
}

export const EmployeeList = ({ employees, isAdmin, onSelect, onDelete }: Props) => {
  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'billable': return 'bg-blue-100 text-blue-700';
      case 'internal': return 'bg-gray-200 text-gray-600';
      case 'other_unit': return 'bg-purple-100 text-purple-700';
      case 'outsourcing': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const sortedEmployees = useMemo(() => {
    const priority: Record<string, number> = { 
      'billable': 1, 
      'internal': 2, 
      'other_unit': 3, 
      'outsourcing': 4 
    };

    return [...employees].sort((a, b) => {
      const diff = (priority[a.employee_type] || 99) - (priority[b.employee_type] || 99);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [employees]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-lg font-bold tracking-tight mb-4">직원 목록</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {sortedEmployees.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onSelect(item)} 
            className="flex justify-between items-center bg-gray-50 px-3 py-2.5 rounded-lg hover:bg-white hover:shadow-md hover:scale-[1.02] transition-all border border-transparent hover:border-blue-100 group cursor-pointer"
          >
            <div className="flex items-center gap-2 overflow-hidden flex-grow">
              <span className="font-medium text-gray-700 text-sm truncate">{item.name}</span>
              {/* [수정] onClick 이벤트 제거 및 커서 스타일 변경 (수정 불가) */}
              <div className={`text-[9px] px-1.5 py-0.5 rounded select-none flex-shrink-0 font-medium tracking-tight cursor-default ${getBadgeStyle(item.employee_type)}`}>
                {item.employee_type}
              </div>
            </div>
            {isAdmin && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0 ml-2"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};