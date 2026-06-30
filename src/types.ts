/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'chihuy' | 'canbo';

export interface User {
  id: string;
  username: string;
  fullname: string;
  rank: string;       // Cấp bậc: Đại úy, Thượng úy...
  position: string;   // Chức vụ: Tổ trưởng, Cán bộ tuần tra...
  unit: string;       // Đơn vị: Đội CSGT Số 1, Đội CSGT Số 2...
  avatar: string;     // Ảnh đại diện URL hoặc base64
  role: UserRole;
  created_at?: string;
}

export interface Team {
  id: string;
  team_name: string;
  start_time: string; // ISO string or datetime-local value
  end_time: string;   // ISO string or datetime-local value
  created_by: string; // User ID
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
}

export interface Scan {
  id: string;
  plate_number: string;
  timestamp: string; // ISO string
  latitude: number;
  longitude: number;
  address: string;
  accuracy: number;  // GPS accuracy in meters
  speed: number;     // Speed in km/h
  heading: number;   // Direction in degrees
  confidence: number; // OCR Confidence percentage (0-100)
  user_id: string;
  created_at: string;
  // Join fields for UI
  officer_name?: string;
  officer_rank?: string;
  officer_unit?: string;
  team_name?: string;
}

export interface SystemLog {
  id: string;
  action: string;
  user_id: string;
  created_at: string;
  // Join fields
  username?: string;
  fullname?: string;
}

export interface DashboardStats {
  totalScansToday: number;
  scansByOfficer: { officer_name: string; count: number }[];
  scansByTeam: { team_name: string; count: number }[];
  scansByHour: { hour: string; count: number }[];
  scansByDay: { date: string; count: number }[];
  scansByMonth: { month: string; count: number }[];
}

export interface TeamReportRow {
  timestamp: string;
  officer_name: string;
  plate_number: string;
  address: string;
  confidence: number;
}

export interface TeamReport {
  team: Team;
  members: User[];
  scans: Scan[];
}
