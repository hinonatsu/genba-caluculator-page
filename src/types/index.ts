export interface CalculationSettings {
  target_month: string;
  period_start: string;
  period_end: string;
  week_start_day: number;
  weekly_legal_hours: number;
  week_cross_month_mode: 'prorated' | 'full_week';
  rounding_unit: number;
  rounding_direction: 'none' | 'down' | 'up' | 'nearest';
  night_start_minutes: number;
  night_end_minutes: number;
  include_paid_leave_in_scheduled: boolean;
  overtime_60h_start_date: string | null;
  exclude_statutory_holiday_from_60h: boolean;
  default_scheduled_work_minutes: number;
}

export interface DayResult {
  date: string;
  weekday: string;
  day_type: number;
  actual_type: number;
  scheduled_work_minutes: number;
  actual_start: string | null;
  actual_end: string | null;
  break_minutes: number;
  actual_work_minutes: number;
  scheduled_inner_minutes: number;
  scheduled_outer_legal_minutes: number;
  overtime_day_minutes: number;
  overtime_week_minutes: number;
  overtime_month_minutes: number;
  statutory_holiday_minutes: number;
  night_minutes: number;
  deduction_minutes: number;
  warnings: string[];
  trace: string[];
}

export interface WeekResult {
  week_start: string;
  week_end: string;
  days_in_month: number;
  legal_frame_minutes: number;
  actual_work_minutes: number;
  day_overtime_in_week: number;
  overtime_week_minutes: number;
  trace: string[];
}

export interface MonthlyFrameResult {
  period_days: number;
  monthly_legal_minutes: number;
  work_excluding_statutory_minutes: number;
  overtime_day_total_minutes: number;
  overtime_week_total_minutes: number;
  overtime_month_minutes: number;
  trace: string[];
}

export interface OvertimeSegment {
  date: string;
  day_type: number;
  source: 'day' | 'week' | 'month';
  minutes: number;
  cumulative_minutes: number;
  is_over_60h: boolean;
}

export interface Summary {
  total_work_minutes: number;
  statutory_holiday_minutes: number;
  legal_work_minutes: number;
  scheduled_inner_minutes: number;
  scheduled_outer_legal_minutes: number;
  overtime_day_minutes: number;
  overtime_week_minutes: number;
  overtime_month_minutes: number;
  overtime_total_minutes: number;
  workday_overtime_under60_minutes: number;
  holiday_overtime_under60_minutes: number;
  workday_overtime_over60_minutes: number;
  holiday_overtime_over60_minutes: number;
  night_minutes: number;
  deduction_minutes: number;
  paid_leave_days: number;
  absence_days: number;
}

export interface CalculateResponse {
  summary: Summary;
  daily_rows: DayResult[];
  weekly_rows: WeekResult[];
  monthly_frame: MonthlyFrameResult;
  overtime_segments: OvertimeSegment[];
  trace: string[];
  warnings: string[];
}

export interface ValidateResponse {
  ok: boolean;
  format: string;
  columns: string[];
  row_count: number;
  warnings: string[];
  errors: string[];
}

// Enum constants mirroring backend
export const DayType = {
  WORK_DAY: 0,
  STATUTORY_HOLIDAY: 1,
  SCHEDULED_HOLIDAY: 2,
} as const;

export const ActualType = {
  WORK: 0,
  ABSENCE: 1,
  PAID_LEAVE: 2,
  HOLIDAY_NO_WORK: 3,
} as const;

export const DAY_TYPE_LABELS: Record<number, string> = {
  0: '所定労働日',
  1: '法定休日',
  2: '所定休日',
};

export const ACTUAL_TYPE_LABELS: Record<number, string> = {
  0: '出勤',
  1: '欠勤',
  2: '有休',
  3: '休日',
};

export function formatMinutes(total: number): string {
  if (total < 0) return '-' + formatMinutes(-total);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}:${m.toString().padStart(2, '0')}`;
}
