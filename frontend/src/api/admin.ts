import { apiRequest } from "./client";
import type {
  AdminDashboardStats,
  AdminLookups,
  AdminUserRow,
  CoachDetailResponse,
  DeleteUserResponse,
  OperationCode,
  ProductionOrderCreateResponse,
  ProductionOrderRow,
  LineBlockLogRow,
  RoleOption,
  ScheduleReportRow,
  ScheduleRow,
  Skill,
} from "../types";

export function getUsers(): Promise<{ data: AdminUserRow[] }> {
  return apiRequest("/admin/users_list.php");
}

export function getRoles(): Promise<{ data: RoleOption[] }> {
  return apiRequest("/admin/roles_list.php");
}

export interface CreateUserInput {
  employee_no: string;
  full_name: string;
  username: string;
  email?: string;
  password: string;
  role_id: number;
  skill_ids?: number[];
  assigned_vendor?: string;
}

export function createUser(input: CreateUserInput): Promise<{ id: number }> {
  return apiRequest("/admin/users_create.php", {
    method: "POST",
    body: input,
  });
}

export interface BulkCreateUserRow {
  employee_no: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  assigned_vendor: string;
}

export interface BulkCreateUsersResponse {
  created_count: number;
  skipped_count: number;
  created: Array<{ row: number; username: string; employee_no: string }>;
  skipped: Array<{ row: number; reason: string }>;
}

export function bulkCreateUsers(rows: BulkCreateUserRow[]): Promise<BulkCreateUsersResponse> {
  return apiRequest("/admin/users_bulk_create.php", {
    method: "POST",
    body: { rows },
  });
}

export function getSkills(): Promise<{ data: Skill[] }> {
  return apiRequest("/admin/skills_list.php");
}

export interface CreateSkillInput {
  name: string;
  operation: OperationCode;
  coach_category_id: number;
}

export function createSkill(input: CreateSkillInput): Promise<{ id: number }> {
  return apiRequest("/admin/skills_create.php", {
    method: "POST",
    body: input,
  });
}

export function updateUserSkills(userId: number, skillIds: number[]): Promise<{ user_id: number }> {
  return apiRequest("/admin/user_skills_update.php", {
    method: "POST",
    body: { user_id: userId, skill_ids: skillIds },
  });
}

export function deleteUser(userId: number): Promise<DeleteUserResponse> {
  return apiRequest("/admin/users_delete.php", {
    method: "POST",
    body: { user_id: userId },
  });
}

export function getCoachDetail(coachId: number): Promise<CoachDetailResponse> {
  return apiRequest(`/admin/coach_detail.php?coach_id=${coachId}`);
}

export function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  return apiRequest("/admin/dashboard_stats.php");
}

export function getAdminLookups(): Promise<AdminLookups> {
  return apiRequest("/admin/lookups.php");
}

export function getProductionOrders(): Promise<{ data: ProductionOrderRow[] }> {
  return apiRequest("/admin/production_orders_list.php");
}

export interface CreateProductionOrderInput {
  plant_id: number;
  production_year_id: number;
  coach_type_id: number;
  bo_number: string;
  bo_item: number;
  bo_date: string; // YYYY-MM-DD
  from_serial: string;
  to_serial: string;
  coach_code?: string;
  installation_no?: string;
  installation_desc?: string;
  ref_year?: string;
}

export function createProductionOrder(
  input: CreateProductionOrderInput,
): Promise<ProductionOrderCreateResponse> {
  return apiRequest("/admin/production_orders_create.php", {
    method: "POST",
    body: input,
  });
}

export function getSchedules(q?: string): Promise<{ data: ScheduleRow[] }> {
  return apiRequest(`/admin/schedules_list.php${q ? `?q=${encodeURIComponent(q)}` : ""}`);
}

export interface SaveScheduleInput {
  coach_type_id: number;
  shell_to_furnishing_days: number;
  furnishing_to_paint_in_days: number;
  paint_in_to_paint_out_days: number;
  paint_out_to_assembly_in_days: number;
  assembly_in_to_assembly_out_days: number;
  assembly_out_to_local_outturn_days: number;
  local_outturn_to_dispatch_days: number;
  target_total_days: number;
}

export function saveSchedule(input: SaveScheduleInput): Promise<SaveScheduleInput> {
  return apiRequest("/admin/schedules_save.php", {
    method: "POST",
    body: input,
  });
}

export function renameCoachCategory(categoryId: number, name: string): Promise<{ category_id: number; name: string }> {
  return apiRequest("/admin/coach_categories_rename.php", {
    method: "POST",
    body: { category_id: categoryId, name },
  });
}

export function getScheduleReport(q?: string): Promise<{ data: ScheduleReportRow[] }> {
  return apiRequest(`/admin/schedule_report.php${q ? `?q=${encodeURIComponent(q)}` : ""}`);
}

export function getLineBlockLog(poolFamily: "PAINT" | "ASSEMBLY"): Promise<{ data: LineBlockLogRow[] }> {
  return apiRequest(`/admin/line_block_log.php?pool=${poolFamily}`);
}
