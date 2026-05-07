import { useState, Fragment } from 'react'
import type { DayResult } from '../types'
import { DayType, ActualType, DAY_TYPE_LABELS, ACTUAL_TYPE_LABELS, formatMinutes } from '../types'

interface Props {
  rows: DayResult[]
}

function fmtMin(m: number): string {
  if (m === 0) return ''
  return formatMinutes(m)
}

function getRowBg(row: DayResult): string {
  if (row.day_type === DayType.STATUTORY_HOLIDAY) return 'bg-red-50'
  if (row.day_type === DayType.SCHEDULED_HOLIDAY) return 'bg-blue-50'
  if (row.actual_type === ActualType.PAID_LEAVE) return 'bg-green-50'
  if (row.actual_type === ActualType.ABSENCE) return 'bg-gray-100'
  return ''
}

function getWeekdayColor(weekday: string): string {
  if (weekday === '土') return 'text-blue-600 font-semibold'
  if (weekday === '日') return 'text-red-600 font-semibold'
  return 'text-gray-700'
}

export default function DailyDetail({ rows }: Props) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const toggleRow = (date: string) => {
    setExpandedRow(prev => prev === date ? null : date)
  }

  if (rows.length === 0) {
    return <div className="text-center text-gray-400 py-8">データがありません</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">日別明細</h2>
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <span className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-red-200 inline-block" />
            <span>法定休日</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-blue-200 inline-block" />
            <span>所定休日</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-green-200 inline-block" />
            <span>有休</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-3 h-3 rounded bg-gray-300 inline-block" />
            <span>欠勤</span>
          </span>
          <span className="text-gray-400">※ 行をクリックで計算トレース表示</span>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-100 text-gray-600">
              <th className="px-2 py-2 text-left whitespace-nowrap">日付</th>
              <th className="px-2 py-2 text-center">曜</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">日区分</th>
              <th className="px-2 py-2 text-left whitespace-nowrap">実績</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">所定</th>
              <th className="px-2 py-2 text-center whitespace-nowrap">出勤</th>
              <th className="px-2 py-2 text-center whitespace-nowrap">退勤</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">休憩</th>
              <th className="px-2 py-2 text-right whitespace-nowrap font-semibold">実労働</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">所定内</th>
              <th className="px-2 py-2 text-right whitespace-nowrap">所定外<br/>法定内</th>
              <th className="px-2 py-2 text-right whitespace-nowrap text-orange-600">時間外(日)</th>
              <th className="px-2 py-2 text-right whitespace-nowrap text-orange-500">時間外(週)</th>
              <th className="px-2 py-2 text-right whitespace-nowrap text-orange-400">時間外(月)</th>
              <th className="px-2 py-2 text-right whitespace-nowrap text-red-600">法定休日</th>
              <th className="px-2 py-2 text-right whitespace-nowrap text-purple-600">深夜</th>
              <th className="px-2 py-2 text-right whitespace-nowrap text-gray-500">控除</th>
              <th className="px-2 py-2 text-left">警告</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isExpanded = expandedRow === row.date
              const bg = getRowBg(row)
              const hasWarnings = row.warnings.length > 0
              const hasTrace = row.trace.length > 0

              return (
                <Fragment key={row.date}>
                  <tr
                    onClick={() => (hasTrace || hasWarnings) && toggleRow(row.date)}
                    className={[
                      bg,
                      (hasTrace || hasWarnings) ? 'cursor-pointer hover:opacity-80' : '',
                      'border-b border-gray-100 transition-opacity',
                    ].join(' ')}
                  >
                    <td className="px-2 py-1.5 font-medium text-gray-800 whitespace-nowrap">
                      {row.date}
                      {(hasTrace || hasWarnings) && (
                        <span className="ml-1 text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                      )}
                    </td>
                    <td className={`px-2 py-1.5 text-center ${getWeekdayColor(row.weekday)}`}>
                      {row.weekday}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        row.day_type === DayType.STATUTORY_HOLIDAY ? 'bg-red-100 text-red-700' :
                        row.day_type === DayType.SCHEDULED_HOLIDAY ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {DAY_TYPE_LABELS[row.day_type] ?? row.day_type}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        row.actual_type === ActualType.PAID_LEAVE ? 'bg-green-100 text-green-700' :
                        row.actual_type === ActualType.ABSENCE ? 'bg-gray-200 text-gray-600' :
                        row.actual_type === ActualType.WORK ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {ACTUAL_TYPE_LABELS[row.actual_type] ?? row.actual_type}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-gray-600">{fmtMin(row.scheduled_work_minutes)}</td>
                    <td className="px-2 py-1.5 text-center font-mono text-gray-700">{row.actual_start ?? ''}</td>
                    <td className="px-2 py-1.5 text-center font-mono text-gray-700">{row.actual_end ?? ''}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-gray-500">{fmtMin(row.break_minutes)}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold text-gray-800">{fmtMin(row.actual_work_minutes)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-gray-600">{fmtMin(row.scheduled_inner_minutes)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-cyan-700">{fmtMin(row.scheduled_outer_legal_minutes)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-orange-600 font-medium">{fmtMin(row.overtime_day_minutes)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-orange-500">{fmtMin(row.overtime_week_minutes)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-orange-400">{fmtMin(row.overtime_month_minutes)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-red-600 font-medium">{fmtMin(row.statutory_holiday_minutes)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-purple-600">{fmtMin(row.night_minutes)}</td>
                    <td className="px-2 py-1.5 text-right font-mono text-gray-500">{fmtMin(row.deduction_minutes)}</td>
                    <td className="px-2 py-1.5">
                      {hasWarnings && (
                        <span className="text-yellow-600 text-xs">⚠ {row.warnings.length}件</span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${row.date}-trace`} className={`${bg} border-b border-gray-200`}>
                      <td colSpan={18} className="px-4 py-3">
                        {row.warnings.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-yellow-700 mb-1">警告:</p>
                            <ul className="space-y-0.5">
                              {row.warnings.map((w, i) => (
                                <li key={i} className="text-xs text-yellow-700">• {w}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {row.trace.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">計算トレース:</p>
                            <div className="bg-gray-50 rounded p-2 font-mono text-xs text-gray-700 space-y-0.5">
                              {row.trace.map((t, i) => (
                                <div key={i}>{t}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Total row */}
      <div className="card bg-gray-50 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">総実労働時間</p>
            <p className="font-mono font-bold text-gray-800">
              {formatMinutes(rows.reduce((s, r) => s + r.actual_work_minutes, 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">時間外(日)合計</p>
            <p className="font-mono font-bold text-orange-600">
              {formatMinutes(rows.reduce((s, r) => s + r.overtime_day_minutes, 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">深夜合計</p>
            <p className="font-mono font-bold text-purple-600">
              {formatMinutes(rows.reduce((s, r) => s + r.night_minutes, 0))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">法定休日労働合計</p>
            <p className="font-mono font-bold text-red-600">
              {formatMinutes(rows.reduce((s, r) => s + r.statutory_holiday_minutes, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
