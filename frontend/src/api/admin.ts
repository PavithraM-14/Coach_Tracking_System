import { apiRequest } from "./client";
import type {
  AdminDashboardStats,
  AdminLookups,
  AdminUserRow,
  DeleteUserResponse,
  OperationCode,
  ProductionOrderCreateResponse,
  ProductionOrderRow,
  RoleOption,
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
}

export function createUser(input: CreateUserInput): Promise<{ id: number }> {
  return apiRequest("/admin/users_create.php", {
    method: "POST",
    body: input,
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
