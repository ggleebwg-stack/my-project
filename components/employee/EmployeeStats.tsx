import React from 'react';
import { Employee } from '@/types';
import { Cake, Award, Globe, Users } from 'lucide-react';
import { isSameMonth } from 'date-fns';

interface Props {
  employees: Employee[];
}

export const EmployeeStats = ({ employees }: Props) => {
  const today = new Date();
  
  // 통계 계산 로직
  const birthdayPeople = employees.filter(e => e.birth_date && isSameMonth(new Date(e.birth_date), today));
  const certHolders = employees.filter(e => e.certifications && e.certifications.length > 0).length;
  const langHolders = employees.filter(e => e.languages && e.languages.length > 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard 
        icon={<Cake size={20} />} 
        color="bg-pink-50 text-pink-500 border-pink-100" 
        title="이번 달 생일" 
        count={`${birthdayPeople.length}명`} 
        subText={birthdayPeople.length > 0 ? birthdayPeople.map(p => p.name).join(', ') : '없음'} 
      />
      <StatCard 
        icon={<Award size={20} />} 
        color="bg-blue-50 text-blue-500 border-blue-100" 
        title="자격증 보유" 
        count={`${certHolders}명`} 
        subText="전문 역량 확보" 
      />
      <StatCard 
        icon={<Globe size={20} />} 
        color="bg-purple-50 text-purple-500 border-purple-100" 
        title="외국어 가능" 
        count={`${langHolders}명`} 
        subText="글로벌 대응 인력" 
      />
      <StatCard 
        icon={<Users size={20} />} 
        color="bg-gray-100 text-gray-500 border-gray-200" 
        title="전체 인원" 
        count={`${employees.length}명`} 
        subText="총 리소스" 
      />
    </div>
  );
};

// 내부용 카드 컴포넌트
const StatCard = ({ icon, color, title, count, subText }: any) => (
  <div className={`bg-white p-4 rounded-xl border shadow-sm flex items-start gap-3 ${color.split(' ')[2]}`}>
    <div className={`p-2 rounded-lg ${color.split(' ').slice(0, 2).join(' ')}`}>{icon}</div>
    <div className="overflow-hidden">
      <p className="text-xs font-bold text-gray-500 uppercase">{title}</p>
      <div className="text-xl font-bold text-gray-800 mt-1">{count}</div>
      <p className="text-xs text-gray-400 mt-1 truncate">{subText}</p>
    </div>
  </div>
);