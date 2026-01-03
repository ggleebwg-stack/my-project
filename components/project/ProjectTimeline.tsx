import React, { useMemo } from 'react';
import { Project } from '@/types';
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Props {
  projects: Project[];
  year: number;
  showSolutions: boolean;
  onProjectClick: (project: Project) => void;
}

export const ProjectTimeline = ({ projects, year, showSolutions, onProjectClick }: Props) => {
  // 선택된 연도의 1월 ~ 12월 생성
  const months = useMemo(() => eachMonthOfInterval({
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31)
  }), [year]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
      <div className="overflow-x-auto">
        {/* w-full: 테이블이 컨테이너 너비를 꽉 채우도록 설정 */}
        <table className="w-full border-separate border-spacing-0">
          <thead className="bg-gray-50/50">
            <tr>
              {/* Project Info Header */}
              {/* w-[1%] & whitespace-nowrap: 콘텐츠(이름+날짜)만큼만 너비를 차지하고 나머지는 달력 영역으로 넘김 */}
              <th className="sticky left-0 z-20 bg-gray-50 border-r border-b border-gray-200 px-4 py-2 text-left text-[11px] font-bold text-gray-500 uppercase w-[1%] whitespace-nowrap">
                Project Info
              </th>
              
              {/* Calendar Headers */}
              {/* min-w 제거: 달력 컬럼이 남은 공간을 균등하게 나눠가짐 (가변) */}
              {months.map(month => (
                <th key={month.toString()} className="border-b border-gray-200 px-0.5 py-2 text-center">
                  <div className="text-[10px] font-bold text-gray-700">{format(month, 'M월', { locale: ko })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((project) => {
              const startDate = new Date(project.start_date);
              const endDate = new Date(project.end_date);
              // 실제 DB 데이터 사용 (없으면 null)
              const solutions = project.solutions;

              return (
                <tr 
                  key={project.id} 
                  onClick={() => onProjectClick(project)}
                  className="group hover:bg-gray-50 transition-colors cursor-pointer h-10"
                >
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 border-r border-gray-100 px-4 py-1 align-middle whitespace-nowrap">
                    {/* 양 끝 정렬: 이름(좌) --- 날짜(우) */}
                    <div className="flex items-center justify-between gap-8 w-full">
                      
                      {/* [좌측 그룹] 이름 + 말풍선 */}
                      <div className="relative flex items-center">
                        <span className={`text-xs px-2 py-0.5 rounded transition-colors ${
                          project.is_tentative 
                            ? 'bg-gray-100 text-gray-500 font-medium' // 미확정: 회색 배경
                            : 'text-gray-900 font-bold'               // 확정: 진한 검정
                        }`}>
                          {project.name}
                        </span>

                        {/* 말풍선 (Overlay) */}
                        {showSolutions && solutions && (
                           <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[70] animate-in fade-in zoom-in duration-200 origin-left">
                             <div className="relative flex items-center">
                               {/* 꼬리 (파스텔 인디고) */}
                               <div className="w-0 h-0 border-y-[3px] border-y-transparent border-r-[4px] border-r-indigo-100 mr-[-1px]"></div>
                               {/* 본체 (파스텔 인디고) */}
                               <div className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-medium px-2 py-0.5 rounded-sm shadow-sm whitespace-nowrap">
                                 {solutions}
                               </div>
                             </div>
                           </div>
                        )}
                      </div>

                      {/* [우측 그룹] 날짜 (폰트 확대 11px) */}
                      <span className="text-[11px] text-gray-500 font-mono tracking-tight bg-gray-50/50 px-1.5 py-0.5 rounded">
                        {format(startDate, 'yyyy.MM.dd')} ~ {format(endDate, 'yyyy.MM.dd')}
                      </span>

                    </div>
                  </td>

                  {/* 타임라인 바 */}
                  {months.map(month => {
                    const monthStart = startOfMonth(month);
                    const monthEnd = endOfMonth(month);
                    
                    const isActive = startDate <= monthEnd && endDate >= monthStart;
                    const isStartMonth = startDate >= monthStart && startDate <= monthEnd;
                    const isEndMonth = endDate >= monthStart && endDate <= monthEnd;

                    let barClass = "";
                    if (isActive) {
                      barClass = project.is_tentative 
                        ? "bg-gray-300 border-gray-400" 
                        : "bg-blue-300 border-blue-400";
                      
                      if (isStartMonth && isEndMonth) barClass += " rounded-full mx-0.5";
                      else if (isStartMonth) barClass += " rounded-l-full ml-0.5 border-r-0";
                      else if (isEndMonth) barClass += " rounded-r-full mr-0.5 border-l-0";
                      else barClass += " border-x-0";
                    }

                    return (
                      <td key={month.toString()} className="p-0 relative border-r border-dashed border-gray-100 last:border-r-0 align-middle">
                        {isActive && (
                          <div className={`absolute top-1/2 left-0 right-0 -translate-y-1/2 h-4 border-y ${barClass} opacity-80 group-hover:opacity-100 transition-opacity`}></div>
                        )}
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