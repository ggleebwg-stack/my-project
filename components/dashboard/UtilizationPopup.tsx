import React from 'react';
import { X } from 'lucide-react';

export interface PopupDetailItem { empName: string; period: string; mm: number; }
export interface PopupData { title: string; colorClass: string; data: { projectName: string; items: PopupDetailItem[] }[]; }

interface UtilizationPopupProps {
  data: PopupData | null;
  onClose: () => void;
}

export const UtilizationPopup = ({ data, onClose }: UtilizationPopupProps) => {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-[2px] p-4 animate-in fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className={`text-lg font-bold ${data.colorClass}`}>{data.title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-4">
            {data.data.length === 0 ? <p className="text-gray-400 text-center">데이터 없음</p> : data.data.map(group => (
              <div key={group.projectName} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="font-bold text-gray-800 text-sm mb-2">{group.projectName}</div>
                <div className="flex flex-col gap-1">
                  {group.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-white border border-gray-200 rounded px-2 py-1">
                      <span className="font-medium text-gray-700">{item.empName}</span>
                      <div className="flex gap-2"><span className="text-gray-500">({item.mm.toFixed(2)})</span><span className="text-gray-400">{item.period}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};