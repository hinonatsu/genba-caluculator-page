import type { Summary } from '../types'
import { formatMinutes } from '../types'

interface Props {
  summary: Summary
}

interface CardProps {
  label: string
  minutes: number
  colorClass: string
  unit?: string
}

function SummaryCard({ label, minutes, colorClass, unit = 'h:mm' }: CardProps) {
  const value = unit === '日' ? `${minutes}日` : formatMinutes(minutes)
  const sub = unit === '日' ? '' : `${minutes}分`

  return (
    <div className={`rounded-lg border-l-4 bg-white shadow-sm p-4 ${colorClass}`}>
      <p className="text-xs font-medium text-gray-500 mb-1 leading-tight">{label}</p>
      <p className="text-xl font-bold text-gray-800 font-mono">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="col-span-full">
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 pb-2">
        {title}
      </h3>
    </div>
  )
}

export default function SummaryView({ summary }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">月次サマリー</h2>
        <p className="text-sm text-gray-500">月の労働時間集計結果です。</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {/* 実労働時間 */}
        <SectionHeader title="実労働時間" />
        <SummaryCard
          label="総実労働時間"
          minutes={summary.total_work_minutes}
          colorClass="border-blue-500"
        />
        <SummaryCard
          label="法定休日労働時間"
          minutes={summary.statutory_holiday_minutes}
          colorClass="border-red-500"
        />
        <SummaryCard
          label="法定労働時間内"
          minutes={summary.legal_work_minutes}
          colorClass="border-green-500"
        />
        <SummaryCard
          label="所定内労働時間"
          minutes={summary.scheduled_inner_minutes}
          colorClass="border-teal-500"
        />
        <SummaryCard
          label="所定外・法定内時間"
          minutes={summary.scheduled_outer_legal_minutes}
          colorClass="border-cyan-500"
        />

        {/* 時間外 */}
        <SectionHeader title="時間外労働" />
        <SummaryCard
          label="時間外(日次)"
          minutes={summary.overtime_day_minutes}
          colorClass="border-orange-500"
        />
        <SummaryCard
          label="時間外(週次)"
          minutes={summary.overtime_week_minutes}
          colorClass="border-orange-400"
        />
        <SummaryCard
          label="時間外(月総枠)"
          minutes={summary.overtime_month_minutes}
          colorClass="border-orange-300"
        />
        <SummaryCard
          label="時間外 合計"
          minutes={summary.overtime_total_minutes}
          colorClass="border-orange-600"
        />

        {/* 60時間超分解 */}
        <SectionHeader title="60時間超分解（割増賃金計算用）" />
        <SummaryCard
          label="60h以下・所定労働日"
          minutes={summary.workday_overtime_under60_minutes}
          colorClass="border-yellow-400"
        />
        <SummaryCard
          label="60h以下・所定休日"
          minutes={summary.holiday_overtime_under60_minutes}
          colorClass="border-yellow-300"
        />
        <SummaryCard
          label="60h超・所定労働日"
          minutes={summary.workday_overtime_over60_minutes}
          colorClass="border-red-400"
        />
        <SummaryCard
          label="60h超・所定休日"
          minutes={summary.holiday_overtime_over60_minutes}
          colorClass="border-red-300"
        />

        {/* 深夜・控除・休暇 */}
        <SectionHeader title="深夜・控除・休暇" />
        <SummaryCard
          label="深夜労働時間"
          minutes={summary.night_minutes}
          colorClass="border-purple-500"
        />
        <SummaryCard
          label="控除時間"
          minutes={summary.deduction_minutes}
          colorClass="border-gray-400"
        />
        <SummaryCard
          label="有給休暇"
          minutes={summary.paid_leave_days}
          colorClass="border-green-400"
          unit="日"
        />
        <SummaryCard
          label="欠勤"
          minutes={summary.absence_days}
          colorClass="border-gray-500"
          unit="日"
        />
      </div>

      {/* Overtime breakdown summary */}
      {summary.overtime_total_minutes > 0 && (
        <div className="card bg-orange-50 border border-orange-200">
          <h3 className="text-sm font-semibold text-orange-800 mb-3">時間外労働 内訳</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">日次超過時間外</span>
              <span className="font-mono font-medium">{formatMinutes(summary.overtime_day_minutes)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">週次超過時間外</span>
              <span className="font-mono font-medium">{formatMinutes(summary.overtime_week_minutes)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">月総枠超過時間外</span>
              <span className="font-mono font-medium">{formatMinutes(summary.overtime_month_minutes)}</span>
            </div>
            <div className="border-t border-orange-200 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-orange-800">時間外合計</span>
              <span className="font-mono text-orange-800">{formatMinutes(summary.overtime_total_minutes)}</span>
            </div>
          </div>
        </div>
      )}

      {/* 60h breakdown summary */}
      {summary.overtime_total_minutes > 0 && (
        <div className="card bg-red-50 border border-red-200">
          <h3 className="text-sm font-semibold text-red-800 mb-3">月60時間超の割増賃金分解</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-red-200">
                  <th className="text-left pb-1 pr-4">区分</th>
                  <th className="text-right pb-1 pr-4">所定労働日</th>
                  <th className="text-right pb-1">所定休日</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-red-100">
                  <td className="py-1.5 pr-4 text-gray-600">60時間以下の時間外</td>
                  <td className="py-1.5 pr-4 text-right font-mono">{formatMinutes(summary.workday_overtime_under60_minutes)}</td>
                  <td className="py-1.5 text-right font-mono">{formatMinutes(summary.holiday_overtime_under60_minutes)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 pr-4 text-red-700 font-medium">60時間超の時間外</td>
                  <td className="py-1.5 pr-4 text-right font-mono text-red-700 font-medium">{formatMinutes(summary.workday_overtime_over60_minutes)}</td>
                  <td className="py-1.5 text-right font-mono text-red-700 font-medium">{formatMinutes(summary.holiday_overtime_over60_minutes)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-red-600">
            ※ 月60時間超の時間外は割増賃金率が通常の25%から50%に引き上げられます（中小企業は2023年4月から適用）
          </p>
        </div>
      )}
    </div>
  )
}
