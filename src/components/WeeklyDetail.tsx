import { useState, Fragment } from 'react'
import type { WeekResult } from '../types'
import { formatMinutes } from '../types'

interface Props {
  rows: WeekResult[]
}

export default function WeeklyDetail({ rows }: Props) {
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

  if (rows.length === 0) {
    return <div className="text-center text-gray-400 py-8">データがありません</div>
  }

  const totalWeekOT = rows.reduce((s, r) => s + r.overtime_week_minutes, 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">週別集計</h2>
        <div className="text-sm text-gray-500">
          週次時間外合計:
          <span className={`ml-2 font-mono font-bold ${totalWeekOT > 0 ? 'text-orange-600' : 'text-gray-700'}`}>
            {formatMinutes(totalWeekOT)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-600 text-xs">
              <th className="px-3 py-2 text-left whitespace-nowrap">週開始</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">週終了</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">対象月内<br/>日数</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">週法定枠</th>
              <th className="px-3 py-2 text-right whitespace-nowrap">実労働時間</th>
              <th className="px-3 py-2 text-right whitespace-nowrap text-orange-600">日次時間外<br/>(控除分)</th>
              <th className="px-3 py-2 text-right whitespace-nowrap text-orange-500 font-semibold">週次時間外</th>
              <th className="px-3 py-2 text-left">詳細</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hasOT = row.overtime_week_minutes > 0
              const isExpanded = expandedWeek === row.week_start
              const rowBg = hasOT ? 'bg-orange-50' : ''

              return (
                <Fragment key={row.week_start}>
                  <tr
                    className={`${rowBg} border-b border-gray-100 hover:opacity-80 cursor-pointer transition-opacity`}
                    onClick={() => setExpandedWeek(prev => prev === row.week_start ? null : row.week_start)}
                  >
                    <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{row.week_start}</td>
                    <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{row.week_end}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{row.days_in_month}日</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-600">{formatMinutes(row.legal_frame_minutes)}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-gray-800">{formatMinutes(row.actual_work_minutes)}</td>
                    <td className="px-3 py-2 text-right font-mono text-orange-600">{formatMinutes(row.day_overtime_in_week)}</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${hasOT ? 'text-orange-600' : 'text-gray-400'}`}>
                      {hasOT ? formatMinutes(row.overtime_week_minutes) : '-'}
                    </td>
                    <td className="px-3 py-2 text-gray-400 text-xs">
                      {row.trace.length > 0 && (
                        <span>{isExpanded ? '▲ 閉じる' : '▼ トレース'}</span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && row.trace.length > 0 && (
                    <tr key={`${row.week_start}-trace`} className={`${rowBg} border-b border-gray-200`}>
                      <td colSpan={8} className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1">計算トレース:</p>
                        <div className="bg-gray-50 rounded p-2 font-mono text-xs text-gray-700 space-y-0.5">
                          {row.trace.map((t, i) => (
                            <div key={i}>{t}</div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="card bg-orange-50 border border-orange-200">
        <h3 className="text-sm font-semibold text-orange-800 mb-3">週次集計サマリー</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">集計週数</p>
            <p className="font-bold text-gray-800">{rows.length}週</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">週次時間外が発生した週</p>
            <p className="font-bold text-orange-600">
              {rows.filter(r => r.overtime_week_minutes > 0).length}週
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">最大週次時間外</p>
            <p className="font-mono font-bold text-orange-600">
              {formatMinutes(Math.max(...rows.map(r => r.overtime_week_minutes)))}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">週次時間外合計</p>
            <p className={`font-mono font-bold ${totalWeekOT > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
              {formatMinutes(totalWeekOT)}
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        <p>※ 週次時間外 = 実労働時間(法定休日除く) - 日次時間外合計 - 週法定枠</p>
        <p>※ 月跨ぎ週は暦日按分により週法定枠を算出します</p>
      </div>
    </div>
  )
}
