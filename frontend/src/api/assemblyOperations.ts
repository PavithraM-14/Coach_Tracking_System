import { apiRequest } from "./client";
import type {
  AssemblyOperation,
  AssemblyOperationCoachMatrixResponse,
  AssemblyOperationCompletionRow,
  AssemblyOperationExclusionCell,
  AssemblyOperationWorklistRow,
} from "../types";

export function getAssemblyOperations(): Promise<{ data: AssemblyOperation[] }> {
  return apiRequest("/assembly-operations/list.php");
}

export function getAssemblyOperationCoachMatrix(): Promise<AssemblyOperationCoachMatrixResponse> {
  return apiRequest("/assembly-operations/coach_matrix_list.php");
}

export function saveAssemblyOperationCoachMatrix(
  exclusions: AssemblyOperationExclusionCell[],
): Promise<{ saved: number }> {
  return apiRequest("/assembly-operations/coach_matrix_save.php", {
    method: "POST",
    body: { exclusions },
  });
}

export function getAssemblyOperationsWorklist(): Promise<{ data: AssemblyOperationWorklistRow[] }> {
  return apiRequest("/assembly-operations/worklist.php");
}

export function completeAssemblyOperations(input: {
  assembly_in_id: number;
  operation_ids: number[];
}): Promise<{ completed: number; assembly_out_queued: boolean }> {
  return apiRequest("/assembly-operations/complete.php", {
    method: "POST",
    body: input,
  });
}

export function getMyAssemblyOperationCompletions(): Promise<{ data: AssemblyOperationCompletionRow[] }> {
  return apiRequest("/assembly-operations/my_completions.php");
}
