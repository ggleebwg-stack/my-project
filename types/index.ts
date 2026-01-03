export type EmployeeType = 'billable' | 'internal' | 'other_unit' | 'outsourcing';

export interface Employee {
  id: string;
  name: string;
  employee_type: EmployeeType;
  // HR 확장 필드
  birth_date?: string;
  phone?: string;
  address?: string;
  job_title?: string;
  skills?: string[];
  certifications?: string[];
  languages?: string[];
  join_date?: string;
}

export interface Project {
  id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  is_tentative: boolean;
  solutions?: string; // [추가] 제품명
}

export interface Assignment {
  id: string;
  employee_id: string;
  project_id: string;
  task: string;
  start_date: Date;
  end_date: Date;
  non_bill: boolean;
}

export interface DisplayRow {
  id: string;
  uniqueKey: string;
  name: string;
  type: 'project' | 'employee';
}