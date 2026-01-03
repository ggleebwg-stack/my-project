import React, { useState } from 'react';
import { 
  format, addMonths, subMonths, addYears, subYears, 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameMonth, isSameDay, setYear, 
  addWeeks, subWeeks 
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  viewMode: 'week' | 'month' | 'year';
  currentDate: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

export const CustomDatePicker = ({ viewMode, currentDate, onChange, onClose }: Props) => {
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

  const getHeaderText = () => {
    if (viewMode === 'year') {
      const startYear = Math.floor(browseDate.getFullYear() / 12) * 12;
      return `${startYear} - ${startYear + 11}`;
    }
    if (viewMode === 'month') return format(browseDate, 'yyyy년');
    return format(browseDate, 'yyyy년 M월');
  };

  const renderContent = () => {
    // 1. Year View (12년 단위)
    if (viewMode === 'year') {
      const startYear = Math.floor(browseDate.getFullYear() / 12) * 12;
      const years = Array.from({ length: 12 }, (_, i) => startYear + i);
      return (
        <div className="grid grid-cols-3 gap-2">
          {years.map(year => (
            <button 
              key={year} 
              onClick={() => handleSelect(setYear(browseDate, year))} 
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${year === currentDate.getFullYear() ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              {year}
            </button>
          ))}
        </div>
      );
    }

    // 2. Month View (1월~12월)
    if (viewMode === 'month') {
      const months = Array.from({ length: 12 }, (_, i) => i);
      return (
        <div className="grid grid-cols-3 gap-2">
          {months.map(month => {
            const d = new Date(browseDate.getFullYear(), month, 1);
            const isSelected = isSameMonth(d, currentDate);
            return (
              <button 
                key={month} 
                onClick={() => handleSelect(d)} 
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${isSelected ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}`}
              >
                {format(d, 'MMM', { locale: ko })}
              </button>
            );
          })}
        </div>
      );
    }

    // 3. Week View (달력 형태)
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
              <button 
                key={day.toISOString()} 
                onClick={() => handleSelect(day)} 
                className={`
                  relative h-9 text-xs flex items-center justify-center rounded-md transition-all 
                  ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'} 
                  ${isSelectedWeek ? 'bg-blue-50 text-blue-700 font-bold first:rounded-l-md last:rounded-r-md' : 'hover:bg-gray-50'} 
                  ${isSameDay(day, currentDate) ? 'bg-blue-600 !text-white shadow-sm z-10 rounded-md' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
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