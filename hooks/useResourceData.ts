import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Project, Employee, Assignment, EmployeeType } from '@/types';

export const useResourceData = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. Data Fetching & Subscription ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Promise.all로 병렬 요청하여 속도 개선
    const [projRes, empRes, assignRes] = await Promise.all([
      supabase.from('projects').select('*'),
      supabase.from('employees').select('*'),
      supabase.from('assignments').select('*')
    ]);

    const projData = projRes.data;
    const empData = empRes.data;
    const assignData = assignRes.data;

    if (projData) {
      setProjects(projData.map((p: any) => ({
        ...p,
        start_date: p.start_date ? new Date(p.start_date) : new Date(),
        end_date: p.end_date ? new Date(p.end_date) : new Date(),
      })).sort((a: Project, b: Project) => a.name.localeCompare(b.name, 'ko')));
    }

    if (empData) {
      setEmployees(empData.sort((a: Employee, b: Employee) => a.name.localeCompare(b.name, 'ko')));
    }
    
    if (assignData) {
      setAssignments(assignData.map((a: any) => ({
          ...a,
          start_date: new Date(a.start_date),
          end_date: new Date(a.end_date),
        }))
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const subs = [
      supabase.channel('projects').on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData).subscribe(),
      supabase.channel('employees').on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchData).subscribe(),
      supabase.channel('assignments').on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, fetchData).subscribe(),
    ];
    return () => { subs.forEach(s => supabase.removeChannel(s)); };
  }, [fetchData]);

  // --- 2. CRUD Actions ---
  
  // -------------------------
  // Employee CRUD
  // -------------------------
  const addEmployee = async (name: string) => {
    // Optimistic UI could be added here if needed
    const { error } = await supabase.from('employees').insert([{ name, employee_type: 'billable' }]);
    if (error) throw error;
  };

  const removeEmployee = async (id: string) => {
    // Optimistic Update
    setEmployees(prev => prev.filter(e => e.id !== id));
    
    // Assignment 삭제 후 Employee 삭제 (FK 제약 조건 고려)
    await supabase.from('assignments').delete().eq('employee_id', id);
    const { error } = await supabase.from('employees').delete().eq('id', id);
    
    if (error) {
      fetchData(); // 롤백
      throw error;
    }
  };

  // 일반 정보 업데이트 (Drawer에서 사용)
  const updateEmployee = async (id: string, changes: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...changes } : e));
    const { error } = await supabase.from('employees').update(changes).eq('id', id);
    if (error) throw error;
  };

  // 타입 변경 (EmployeeList 및 Drawer에서 사용)
  const updateEmployeeType = async (id: string, type: EmployeeType) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, employee_type: type } : e));
    const { error } = await supabase.from('employees').update({ employee_type: type }).eq('id', id);
    if (error) throw error;
  };

  // -------------------------
  // Project CRUD
  // -------------------------
  const addProject = async (name: string) => {
    const newProject = {
      name,
      is_tentative: true,
      start_date: new Date().toISOString(), // Supabase는 ISO string 선호
      end_date: new Date().toISOString()
    };
    
    const { error } = await supabase.from('projects').insert([newProject]);
    if (error) throw error;
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    
    await supabase.from('assignments').delete().eq('project_id', id);
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  };

  const updateProject = async (id: string, changes: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
    const { error } = await supabase.from('projects').update(changes).eq('id', id);
    if (error) throw error;
  };

  // -------------------------
  // Assignment CRUD
  // -------------------------
  const addAssignment = async (payload: Omit<Assignment, 'id'>) => {
    // 날짜 객체를 ISO 문자열로 변환하여 전송
    const dbPayload = {
      ...payload,
      start_date: payload.start_date instanceof Date ? payload.start_date.toISOString() : payload.start_date,
      end_date: payload.end_date instanceof Date ? payload.end_date.toISOString() : payload.end_date,
    };

    const { error } = await supabase.from('assignments').insert([dbPayload]);
    if (error) throw error;
  };

  const updateAssignment = async (id: string, payload: Partial<Assignment>) => {
    // UI 즉시 반영 (날짜 객체 유지)
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...payload } : a));

    // DB 전송용 Payload 변환
    const dbPayload: any = { ...payload };
    if (payload.start_date instanceof Date) dbPayload.start_date = payload.start_date.toISOString();
    if (payload.end_date instanceof Date) dbPayload.end_date = payload.end_date.toISOString();

    const { error } = await supabase.from('assignments').update(dbPayload).eq('id', id);
    if (error) throw error;
  };

  const deleteAssignment = async (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) throw error;
  };

  return {
    projects,
    employees,
    assignments,
    loading,
    actions: {
      addEmployee,
      removeEmployee, // Page.tsx에서 removeEmployee로 사용 중
      updateEmployee, // [추가]
      updateEmployeeType,
      addProject,
      deleteProject,  // Page.tsx UI에 맞춰 remove -> delete로 통일
      updateProject,
      addAssignment,
      updateAssignment,
      deleteAssignment,
    }
  };
};