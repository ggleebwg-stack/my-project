import React from 'react';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: any) => void;
}

export const SegmentedControl = ({ options, value, onChange }: Props) => {
  return (
    <div className="bg-gray-200/80 p-1 rounded-lg flex items-center shadow-inner h-9">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`
              flex-1 px-3 h-full text-xs font-semibold rounded-md transition-all duration-200 ease-out 
              flex items-center justify-center whitespace-nowrap cursor-pointer
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