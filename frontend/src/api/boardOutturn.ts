import { apiRequest } from "./client";
import type { BoardOutturnCreateResponse, BoardOutturnListRow, BoardOutturnWorklistCoach } from "../types";

export function getBoardOutturnList(): Promise<{ data: BoardOutturnListRow[] }> {
  return apiRequest("/board-outturn/list.php");
}

export function getBoardOutturnWorklist(): Promise<{ data: BoardOutturnWorklistCoach[] }> {
  return apiRequest("/board-outturn/worklist.php");
}

export interface BoardOutturnCreateInput {
  coach_id: number;
  board_outturn_date: string; // YYYY-MM-DD
  board_outturn_time: string; // HH:MM
  remarks?: string;
}

export function createBoardOutturn(input: BoardOutturnCreateInput): Promise<BoardOutturnCreateResponse> {
  return apiRequest("/board-outturn/create.php", {
    method: "POST",
    body: input,
  });
}
