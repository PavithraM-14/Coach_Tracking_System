export type RoleCode =
  | "ADMIN"
  | "SHELL_PRODUCTION"
  | "FURNISHING"
  | "PAINT"
  | "ASSEMBLY_PRODUCTION"
  | "MECHANICAL_INSPECTION"
  | "ELECTRICAL_INSPECTION"
  | "VENDOR_SNI"
  | "OUTTURN_DISPATCH"
  | "PAINT_ADMIN"
  | "ASSEMBLY_ADMIN"
  | "ASSEMBLY_OPERATION";

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
  email: string | null;
  role: RoleCode;
  is_active: boolean;
  created_at: string;
  skills: Array<{ id: number; name: string }>;
  assigned_vendor: string | null;
}

export type OperationCode =
  | "FURNISHING_IN"
  | "LOCAL_OUTTURN"
  | "LOCK_SEAL"
  | "BOARD_OUTTURN"
  | "PHYSICAL_DISPATCH";

export interface Skill {
  id: number;
  name: string;
  operation: OperationCode;
  role_code: RoleCode;
  coach_category_id: number;
  coach_category_name: string;
}

export interface AssignmentSummary {
  assigned_count: number;
  capacity: number | null; // null = unlimited (e.g. FURNISHING)
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
  // Prior stage's actual date + that transition's target days from
  // fixed_schedules (see backend/lib/Schedule.php) — null if no schedule row
  // exists yet for this coach type.
  predicted_date: string | null;
}

export interface ShellOutturnCreateResponse {
  shell_outturn_id: number;
  coach_number: string;
  outturn_datetime: string;
}

export interface ShellOutturnBatchResult {
  shell_outturn_id: number;
  coach_number: string;
}

export interface ShellOutturnBatchCreateResponse {
  outturn_datetime: string;
  results: ShellOutturnBatchResult[];
}

export interface ShellOutturnListRow {
  shell_outturn_id: number;
  coach_number: string;
  coach_type: string;
  outturn_datetime: string;
  recorded_by: string;
  status: string;
}

export interface FurnishingInRow {
  furnishing_in_id: number;
  coach_id: number;
  coach_number: string;
  coach_type: string;
  furnishing_in_datetime: string;
  shell_outturn_datetime: string;
  recorded_by: string;
  paint_in_datetime: string | null;
  status: "FURNISHING_IN" | "PAINT_IN";
}

// A coach assigned to the current Furnishing employee, awaiting Furnishing
// In submission — same shape as WorklistCoach plus the Shell Outturn date,
// which pre-fills (but doesn't lock) the Furnishing In date field.
export interface FurnishingInWorklistCoach extends WorklistCoach {
  shell_outturn_datetime: string;
}

export interface FurnishingInCreateResponse {
  furnishing_in_id: number;
  coach_number: string;
  furnishing_in_datetime: string;
}

// Final four stages (all OUTTURN_DISPATCH role) — no line/slot grid, simple
// status+date checklist actions chained after Assembly Out, same shape as
// Furnishing In's worklist/create/list pattern.
export interface LocalOutturnWorklistCoach extends WorklistCoach {
  assembly_out_datetime: string;
}

export interface LocalOutturnCreateResponse {
  local_outturn_id: number;
  coach_number: string;
  local_outturn_datetime: string;
  outturn_serial_no: string;
}

export interface LocalOutturnListRow {
  local_outturn_id: number;
  coach_number: string;
  coach_type: string;
  local_outturn_datetime: string;
  recorded_by: string;
  status: string;
  outturn_serial_no: string | null;
}

export interface LockSealWorklistCoach extends WorklistCoach {
  local_outturn_datetime: string;
  outturn_serial_no: string | null;
}

export interface LockSealCreateResponse {
  lock_seal_id: number;
  coach_number: string;
  lock_seal_datetime: string;
}

export interface LockSealListRow {
  lock_seal_id: number;
  coach_number: string;
  coach_type: string;
  lock_seal_datetime: string;
  recorded_by: string;
  status: string;
  outturn_serial_no: string | null;
}

export interface BoardOutturnWorklistCoach extends WorklistCoach {
  lock_seal_datetime: string;
  outturn_serial_no: string | null;
}

export interface BoardOutturnCreateResponse {
  board_outturn_id: number;
  coach_number: string;
  board_outturn_datetime: string;
}

export interface BoardOutturnListRow {
  board_outturn_id: number;
  coach_number: string;
  coach_type: string;
  board_outturn_datetime: string;
  recorded_by: string;
  status: string;
  outturn_serial_no: string | null;
}

export interface PhysicalDispatchWorklistCoach extends WorklistCoach {
  board_outturn_datetime: string;
  outturn_serial_no: string | null;
}

export interface PhysicalDispatchCreateResponse {
  physical_dispatch_id: number;
  coach_number: string;
  dispatch_datetime: string;
}

export interface PhysicalDispatchListRow {
  physical_dispatch_id: number;
  coach_number: string;
  coach_type: string;
  dispatch_datetime: string;
  recorded_by: string;
  status: string;
  outturn_serial_no: string | null;
}

export interface PaintLineSlot {
  slot_id: number;
  slot_number: number;
  is_occupied: boolean;
  is_active: boolean;
  coach_id: number | null;
  coach_number: string | null;
  recorded_by: string | null;
}

export interface PaintLine {
  paint_line_id: number;
  code: string;
  name: string;
  total_slots: number;
  occupied_slots: number;
  is_active: boolean;
  slots: PaintLineSlot[];
}

export interface PaintInCreateResponse {
  paint_in_id: number;
  coach_number: string;
  paint_line: string;
  slot_number: number;
  paint_in_datetime: string;
  vendor: string;
}

export interface PaintInListRow {
  paint_in_id: number;
  coach_number: string;
  coach_type: string;
  paint_line: string;
  slot_number: number;
  paint_in_datetime: string;
  recorded_by: string;
  status: string;
}

// Paint Out / Assembly In / Assembly Out each get their own independent
export interface PaintOutCreateResponse {
  paint_out_id: number;
  coach_number: string;
  paint_out_datetime: string;
}

export interface PaintOutListRow {
  paint_out_id: number;
  coach_number: string;
  coach_type: string;
  paint_out_line: string | null;
  slot_number: number | null;
  paint_out_datetime: string;
  recorded_by: string;
  status: string;
}

// One continuous stay in one line/slot — a coach with a single entry here
// was never moved; more than one means it was reassigned mid-stay (see
// paint-in/move.php / assembly-in/move.php).
export interface LineHistoryEntry {
  slot_number: number;
  occupied_from: string;
  released_at: string | null;
  placed_by: string;
}

export interface PaintLineHistoryEntry extends LineHistoryEntry {
  paint_line: string;
}

// Combined Paint In + Paint Out record (paint-records/list.php) — replaces
// the separate Paint In Records / Paint Out Records pages.
export interface PaintRecordRow {
  paint_in_id: number;
  coach_id: number;
  coach_number: string;
  coach_type: string;
  paint_in_datetime: string;
  paint_in_by: string;
  vendor: string | null;
  paint_out_datetime: string | null;
  paint_out_by: string | null;
  current_line: string | null;
  current_slot_number: number | null;
  line_history: PaintLineHistoryEntry[];
}

export interface AssemblyInLineSlot {
  slot_id: number;
  slot_number: number;
  is_occupied: boolean;
  is_active: boolean;
  coach_id: number | null;
  coach_number: string | null;
  recorded_by: string | null;
}

export interface AssemblyInLine {
  assembly_in_line_id: number;
  code: string;
  name: string;
  total_slots: number;
  occupied_slots: number;
  is_active: boolean;
  slots: AssemblyInLineSlot[];
}

export interface AssemblyInCreateResponse {
  assembly_in_id: number;
  coach_number: string;
  assembly_in_line: string;
  slot_number: number;
  assembly_in_datetime: string;
}

export interface AssemblyInListRow {
  assembly_in_id: number;
  coach_number: string;
  coach_type: string;
  assembly_in_line: string;
  slot_number: number;
  assembly_in_datetime: string;
  recorded_by: string;
  status: string;
}

export interface AssemblyOutCreateResponse {
  assembly_out_id: number;
  coach_number: string;
  assembly_out_datetime: string;
}

export interface AssemblyOutListRow {
  assembly_out_id: number;
  coach_number: string;
  coach_type: string;
  assembly_out_line: string | null;
  slot_number: number | null;
  assembly_out_datetime: string;
  recorded_by: string;
  status: string;
}

export interface AssemblyLineHistoryEntry extends LineHistoryEntry {
  assembly_line: string;
}

// Combined Assembly In + Assembly Out record (assembly-records/list.php) —
// replaces the separate Assembly In Records / Assembly Out Records pages.
export interface AssemblyRecordRow {
  assembly_in_id: number;
  coach_id: number;
  coach_number: string;
  coach_type: string;
  assembly_in_datetime: string;
  assembly_in_by: string;
  assembly_out_datetime: string | null;
  assembly_out_by: string | null;
  current_line: string | null;
  current_slot_number: number | null;
  line_history: AssemblyLineHistoryEntry[];
}

export interface ApiErrorBody {
  error: string;
}

export type ActivityType =
  | "SHELL_OUTTURN"
  | "FURNISHING_IN"
  | "PAINT_IN"
  | "PAINT_OUT"
  | "ASSEMBLY_IN"
  | "ASSEMBLY_OUT"
  | "LOCAL_OUTTURN"
  | "LOCK_SEAL"
  | "BOARD_OUTTURN"
  | "PHYSICAL_DISPATCH";

export interface RecentActivityRow {
  type: ActivityType;
  coach_id: number;
  coach_number: string;
  coach_type: string;
  occurred_at: string;
  performed_by: string;
  remarks: string | null;
}

// GET /api/admin/coach_detail.php — full snapshot for the Admin drill-down
// view: coach info, where it currently sits in the pipeline, the workflow
// stepper's done/pending state per stage, and the full history with remarks.
export interface CoachDetailInfo {
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

export interface CoachDetailLocation {
  status: "PENDING" | "QUEUED" | "ASSIGNED" | "COMPLETED";
  label: string;
  held_by: string | null;
}

export interface CoachDetailStage {
  key: string;
  label: string;
  done: boolean;
}

export interface CoachDetailHistoryEntry {
  stage: string;
  occurred_at: string;
  recorded_by: string;
  remarks: string | null;
  location?: string;
}

export interface CoachDetailResponse {
  coach: CoachDetailInfo;
  location: CoachDetailLocation;
  stages: CoachDetailStage[];
  history: CoachDetailHistoryEntry[];
}

export interface AdminDashboardStats {
  pending_shell_outturn: number;
  awaiting_furnishing_in: number;
  awaiting_paint_in: number;
  awaiting_paint_out: number;
  awaiting_assembly_in: number;
  awaiting_assembly_out: number;
  queued_for_assignment: number;
  total_coaches: number;
  total_shell_outturn: number;
  total_furnishing_in: number;
  total_paint_in: number;
  total_paint_out: number;
  total_assembly_in: number;
  total_assembly_out: number;
  awaiting_local_outturn: number;
  awaiting_lock_seal: number;
  awaiting_board_outturn: number;
  awaiting_physical_dispatch: number;
  total_local_outturn: number;
  total_lock_seal: number;
  total_board_outturn: number;
  total_physical_dispatch: number;
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
  coach_categories: Array<{ id: number; code: string; name: string }>;
}

// One coach type's target day-counts, for the Admin Schedule page.
export interface ScheduleRow {
  coach_type_id: number;
  code: string;
  name: string;
  is_lhb: boolean;
  category_id: number;
  category_name: string;
  shell_to_furnishing_days: number | null;
  furnishing_to_paint_in_days: number | null;
  paint_in_to_paint_out_days: number | null;
  paint_out_to_assembly_in_days: number | null;
  assembly_in_to_assembly_out_days: number | null;
  assembly_out_to_local_outturn_days: number | null;
  local_outturn_to_dispatch_days: number | null;
  target_total_days: number | null;
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

// Supervisor-Coach Assignments (In-Out) Matrix — Paint Shop only. Rows are
// coach types, columns are Paint employees; each cell is an independent
// can_in/can_out toggle. This is what Assignment::assignOrQueue() reads for
// module 'PAINT' (Furnishing still uses the plain Skill/user_skills model).
export interface PaintMatrixCoachType {
  id: number;
  code: string;
  name: string;
}

export interface PaintMatrixUser {
  id: number;
  employee_no: string;
  full_name: string;
  username: string;
}

export interface PaintMatrixCell {
  user_id: number;
  coach_type_id: number;
  can_in: boolean;
  can_out: boolean;
}

export interface PaintMatrixResponse {
  coach_types: PaintMatrixCoachType[];
  users: PaintMatrixUser[];
  assignments: PaintMatrixCell[];
}

// Assembly Operations — the 32 sub-operations a coach passes through
// between Assembly In and Assembly Out (see database/seed.sql, sourced
// from tbl_stage.sql). ASSEMBLY_ADMIN manages two matrices against this
// master list: which operations apply to which coach, and which operations
// each ASSEMBLY_OPERATION worker is responsible for.
export interface AssemblyOperation {
  id: number;
  code: string;
  display_name: string;
  department: string;
  sort_order: number;
}

export interface AssemblyOperationMatrixCoach {
  id: number;
  coach_number: string;
  coach_type: string;
}

export interface AssemblyOperationExclusionCell {
  coach_id: number;
  operation_id: number;
}

export interface AssemblyOperationCoachMatrixResponse {
  coaches: AssemblyOperationMatrixCoach[];
  operations: AssemblyOperation[];
  exclusions: AssemblyOperationExclusionCell[];
}

// One coach with the subset of pending operations relevant to the calling
// ASSEMBLY_OPERATION worker (backend already filters to just their own
// assigned + applicable + incomplete operations).
export interface AssemblyOperationWorklistRow {
  assembly_in_id: number;
  coach_id: number;
  coach_number: string;
  coach_type: string;
  pending_operations: AssemblyOperation[];
}

export interface AssemblyOperationCompletionRow {
  id: number;
  coach_id: number;
  coach_number: string;
  operation_id: number;
  display_name: string;
  completed_at: string;
}

// A coach painted under this VENDOR_SNI login's assigned vendor (vendor/coaches.php).
export interface VendorCoachRow {
  paint_in_id: number;
  coach_number: string;
  coach_type: string;
  paint_in_datetime: string;
  paint_in_by: string;
  paint_out_datetime: string | null;
  status: string;
}
