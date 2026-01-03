import { eachDayOfInterval, getDaysInMonth } from 'date-fns';
import { Assignment } from '@/types';

// 날짜 정규화 (시간 제거)
export const setStartTime = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const setEndTime = (date: Date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

// 정확한 Man-Month 계산 (주말/공휴일 로직 없이 단순 일할 계산)
export const calculateExactMM = (assignment: Assignment, start: Date, end: Date) => {
  const aStartTs = setStartTime(assignment.start_date);
  const aEndTs = setEndTime(assignment.end_date);
  const viewStartTs = setStartTime(start);
  const viewEndTs = setEndTime(end);

  const overlapStartTs = Math.max(aStartTs, viewStartTs);
  const overlapEndTs = Math.min(aEndTs, viewEndTs);

  if (overlapStartTs > overlapEndTs) return 0;

  let totalMM = 0;
  const overlapDays = eachDayOfInterval({ 
    start: new Date(overlapStartTs), 
    end: new Date(overlapEndTs) 
  });
  
  overlapDays.forEach(day => {
    totalMM += 1 / getDaysInMonth(day);
  });

  return totalMM;
};