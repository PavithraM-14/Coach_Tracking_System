export type RoleCode =
  | "ADMIN"
  | "PRODUCTION_PLANNING"
  | "SHELL_PRODUCTION"
  | "FURNISHING"
  | "PAINT"
  | "ASSEMBLY_PRODUCTION"
  | "MECHANICAL_INSPECTION"
  | "ELECTRICAL_INSPECTION"
  | "SHUNTING_STAFF"
  | "VENDOR_SNI"
  | "FINAL_INSPECTION"
  | "OUTTURN_DISPATCH"
  | "MANAGEMENT_VIEWER";

export interface CurrentUser {
  id: number;
  employee_no: string;
  full_name: string;
  username: string;
  role: RoleCode;
}

export interface LoginResponse {
  token: string;
  user: CurrentUser;
}

export interface AdminUserRow {
  id: number;
  employee_no: string;
  full_name: string;
  username: string;
  role: RoleCode;
  is_active: boolean;
  created_at: string;
  skills: Array<{ id: number; name: string }>;
}

export interface Skill {
  id: number;
  name: string;
  role_code: RoleCode;
  coach_category_id: number;
  coach_category_name: string;
}

export interface AssignmentSummary {
  assigned_count: number;
  capacity: number;
  queued_count: number;
}

export interface RoleOption {
  id: number;
  code: RoleCode;
  name: string;
}

// A coach eligible for / already through the tracked stages.
export interface WorklistCoach {
  coach_id: number;
  coach_number: string;
  serial_no: string;
  coach_type: string;
  coach_category: string;
  plant: string;
  production_year: string;
  bo_number: string;
  bo_item: number;
  installation_no: string | null;
}

export interface ShellOutturnCreateResponse {
  shell_outturn_id: number;
  furnishing_in_id: number;
  coach_number: string;
  outturn_datetime: string;
}

export interface FurnishingInRow {
  furnishing_in_id: number;
  coach_id: number;
  coach_number: string;
  coach_type: string;
  furnishing_in_datetime: string;
  shell_outturn_datetime: string;
  recorded_by: string;
  furnishing_out_datetime: string | null;
  status: "FURNISHING_IN" | "FURNISHING_OUT";
}

export interface FurnishingOutCreateResponse {
  furnishing_out_id: number;
  coach_number: string;
  furnishing_out_datetime: string;
}

export interface PaintLineSlot {
  slot_id: number;
  slot_number: number;
  is_occupied: boolean;
  coach_number: string | null;
}

export interface PaintLine {
  paint_line_id: number;
  code: string;
  name: string;
  total_slots: number;
  occupied_slots: number;
  slots: PaintLineSlot[];
}

export interface PaintInCreateResponse {
  paint_in_id: number;
  coach_number: string;
  paint_line: string;
  slot_number: number;
  paint_in_datetime: string;
}

export interface ApiErrorBody {
  error: string;
}

export interface RecentActivityRow {
  type: "SHELL_OUTTURN" | "FURNISHING_OUT" | "PAINT_IN";
  coach_number: string;
  coach_type: string;
  occurred_at: string;
  performed_by: string;
}

export interface AdminDashboardStats {
  pending_shell_outturn: number;
  awaiting_furnishing_out: number;
  awaiting_paint_in: number;
  queued_for_assignment: number;
}

export interface DeleteUserResponse {
  deleted: boolean;
  deactivated: boolean;
  message: string;
}

export interface MyProfile {
  id: number;
  employee_no: string;
  full_name: string;
  username: string;
  role: RoleCode;
  role_name: string;
  created_at: string;
  skills: string[];
}

export interface AdminLookups {
  plants: Array<{ id: number; code: string; name: string }>;
  production_years: Array<{ id: number; year_code: string }>;
  coach_types: Array<{ id: number; code: string; name: string; category_name: string }>;
}

export interface ProductionOrderRow {
  id: number;
  bo_number: string;
  bo_item: number;
  bo_date: string;
  bo_qty: number;
  from_serial: string;
  to_serial: string;
  installation_no: string | null;
  status: string;
  plant: string;
  production_year: string;
  coach_type: string;
  coach_count: number;
  created_at: string;
}

export interface ProductionOrderCreateResponse {
  production_order_id: number;
  bo_number: string;
  bo_item: number;
  coach_count: number;
}
