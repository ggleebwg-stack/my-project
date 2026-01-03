import { z } from 'zod';

// 날짜 유효성 검사 헬퍼 (종료일 < 시작일 방지)
const dateRangeRefinement = (data: { start_date: string; end_date: string }, ctx: z.RefinementCtx) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  if (end < start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "종료일은 시작일 이후여야 합니다.",
      path: ["end_date"],
    });
  }
};

// 1. 프로젝트 스키마
export const projectSchema = z.object({
  name: z.string().min(1, "프로젝트 이름은 필수입니다."),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), "유효한 날짜가 아닙니다."),
  end_date: z.string().refine((val) => !isNaN(Date.parse(val)), "유효한 날짜가 아닙니다."),
  is_tentative: z.boolean(),
  solutions: z.string().optional(), // [추가] 선택 사항
}).superRefine(dateRangeRefinement);

// 2. 할당(Assignment) 스키마
export const assignmentSchema = z.object({
  employee_id: z.string().min(1, "직원을 선택해주세요."),
  project_id: z.string().min(1, "프로젝트를 선택해주세요."),
  start_date: z.string(),
  end_date: z.string(),
  non_bill: z.boolean(),
}).superRefine(dateRangeRefinement);

// 타입 추론 (TypeScript용)
export type ProjectFormValues = z.infer<typeof projectSchema>;
export type AssignmentFormValues = z.infer<typeof assignmentSchema>;