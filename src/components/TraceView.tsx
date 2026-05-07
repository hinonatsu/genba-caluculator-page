import { useState } from 'react'
import type { DayResult, WeekResult, CalculateResponse } from '../types'
import { exportResult } from '../api/client'

interface Props {
  globalTrace: string[]
  dailyRows: DayResult[]
  weeklyRows: WeekResult[]
  calcResult: CalculateResponse
}

export default function TraceView({ globalTrace, dailyRows, weeklyRows, calcResult }: Props) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState<'csv' | 'excel' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

  const toggleDay = (date: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  const toggleWeek = (weekStart: string) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev)
      if (next.has(weekStart)) next.delete(weekStart)
      else next.add(weekStart)
      return next
    })
  }

  const expandAllDays = () => setExpandedDays(new Set(dailyRows.map(r => r.date)))
  const collapseAllDays = () => setExpandedDays(new Set())

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(format)
    setExportError(null)
    try {
      const blob = await exportResult(calcResult, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = format === 'csv' ? 'labor_calculation.csv' : 'labor_calculation.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'エクスポートに失敗しました')
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with export buttons */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">計算トレース</h2>
        <div className="flex items-center space-x-2">
          {exportError && (
            <span className="text-xs text-red-600">{exportError}</span>
          )}
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting !== null}
            className="btn-secondary text-sm py-1.5 px-3"
          >
            {isExporting === 'csv' ? '処理中...' : 'CSVエクスポート'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting !== null}
            className="btn-primary text-sm py-1.5 px-3"
          >
            {isExporting === 'excel' ? '処理中...' : 'Excelエクスポート'}
          </button>
        </div>
      </div>

      {/* Global trace */}
      {globalTrace.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">月次トレース</h3>
          <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-700 space-y-0.5 max-h-48 overflow-y-auto">
            {globalTrace.map((line, i) => (
              <div key={i} className={line.startsWith('===') ? 'text-blue-700 font-bold' : ''}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Daily traces */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">日別トレース</h3>
          <div className="flex space-x-2">
            <button
              onClick={expandAllDays}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              すべて展開
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAllDays}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              すべて閉じる
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {dailyRows.map((row) => {
            const isExpanded = expandedDays.has(row.date)
            const hasTrace = row.trace.length > 0
            const hasWarnings = row.warnings.length > 0

            if (!hasTrace && !hasWarnings) return null

            return (
              <div key={row.date} className="border border-gray-200 rounded">
                <button
                  onClick={() => toggleDay(row.date)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center space-x-3">
                    <span className="font-medium text-gray-800">{row.date}</span>
                    <span className="text-gray-500">{row.weekday}</span>
                    {hasWarnings && (
                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                        警告{row.warnings.length}件
                      </span>
                    )}
                    {row.trace.length > 0 && (
                      <span className="text-xs text-gray-400">{row.trace.length}行</span>
                    )}
                  </span>
                  <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-gray-100">
                    {hasWarnings && (
                      <div className="mt-2 mb-2">
                        <p className="text-xs font-semibold text-yellow-700 mb-1">警告:</p>
                        <ul className="space-y-0.5">
                          {row.warnings.map((w, i) => (
                            <li key={i} className="text-xs text-yellow-700">• {w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {hasTrace && (
                      <div className="bg-gray-50 rounded p-2 mt-2 font-mono text-xs text-gray-700 space-y-0.5">
                        {row.trace.map((t, i) => (
                          <div key={i}>{t}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Weekly traces */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">週別トレース</h3>
        <div className="space-y-1">
          {weeklyRows.map((week) => {
            const isExpanded = expandedWeeks.has(week.week_start)
            if (week.trace.length === 0) return null

            return (
              <div key={week.week_start} className="border border-gray-200 rounded">
                <button
                  onClick={() => toggleWeek(week.week_start)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className="flex items-center space-x-3">
                    <span className="font-medium text-gray-800">
                      {week.week_start} 〜 {week.week_end}
                    </span>
                    {week.overtime_week_minutes > 0 && (
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded font-medium">
                        週次時間外あり
                      </span>
                    )}
                  </span>
                  <span className="text-gray-400">{isExpanded ? '▲' : '▼'}</span>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-gray-100">
                    <div className="bg-gray-50 rounded p-2 mt-2 font-mono text-xs text-gray-700 space-y-0.5">
                      {week.trace.map((t, i) => (
                        <div key={i}>{t}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Full raw trace dump */}
      <details className="card">
        <summary className="text-sm font-semibold text-gray-600 cursor-pointer">
          全トレース（生データ）
        </summary>
        <div className="mt-3 bg-gray-900 rounded-lg p-4 overflow-x-auto max-h-96 overflow-y-auto">
          <pre className="font-mono text-xs text-green-400 whitespace-pre-wrap">
            {[
              '=== GLOBAL TRACE ===',
              ...globalTrace,
              '',
              '=== DAILY TRACES ===',
              ...dailyRows.flatMap(r => [
                `--- ${r.date} (${r.weekday}) ---`,
                ...r.warnings.map(w => `[WARNING] ${w}`),
                ...r.trace,
              ]),
              '',
              '=== WEEKLY TRACES ===',
              ...weeklyRows.flatMap(w => [
                `--- Week ${w.week_start} to ${w.week_end} ---`,
                ...w.trace,
              ]),
            ].join('\n')}
          </pre>
        </div>
      </details>
    </div>
  )
}
