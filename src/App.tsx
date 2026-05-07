import { useState, useCallback } from 'react'
import type { CalculationSettings, CalculateResponse, ValidateResponse } from './types'
import { calculate as apiCalculate } from './api/client'
import CSVUpload from './components/CSVUpload'
import SettingsForm from './components/SettingsForm'
import SummaryView from './components/SummaryView'
import DailyDetail from './components/DailyDetail'
import WeeklyDetail from './components/WeeklyDetail'
import MonthlyFrame from './components/MonthlyFrame'
import TraceView from './components/TraceView'

type TabId = 'upload' | 'settings' | 'summary' | 'daily' | 'weekly' | 'monthly' | 'trace'

const TABS: { id: TabId; label: string; requiresResult?: boolean }[] = [
  { id: 'upload', label: 'CSVアップロード' },
  { id: 'settings', label: '計算設定' },
  { id: 'summary', label: '月次サマリー', requiresResult: true },
  { id: 'daily', label: '日別明細', requiresResult: true },
  { id: 'weekly', label: '週別判定', requiresResult: true },
  { id: 'monthly', label: '月総枠判定', requiresResult: true },
  { id: 'trace', label: '計算トレース', requiresResult: true },
]

function getDefaultSettings(): CalculationSettings {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStr = `${year}-${month.toString().padStart(2, '0')}`
  const daysInMonth = new Date(year, month, 0).getDate()
  return {
    target_month: monthStr,
    period_start: `${monthStr}-01`,
    period_end: `${monthStr}-${daysInMonth.toString().padStart(2, '0')}`,
    week_start_day: 0,
    weekly_legal_hours: 40,
    week_cross_month_mode: 'prorated',
    rounding_unit: 1,
    rounding_direction: 'none',
    night_start_minutes: 1320,
    night_end_minutes: 300,
    include_paid_leave_in_scheduled: true,
    overtime_60h_start_date: null,
    exclude_statutory_holiday_from_60h: true,
    default_scheduled_work_minutes: 480,
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('upload')
  const [csvContent, setCsvContent] = useState<string>('')
  const [validateResult, setValidateResult] = useState<ValidateResponse | null>(null)
  const [settings, setSettings] = useState<CalculationSettings>(getDefaultSettings())
  const [calcResult, setCalcResult] = useState<CalculateResponse | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [calcError, setCalcError] = useState<string | null>(null)

  const handleCSVLoaded = useCallback((content: string, validation: ValidateResponse) => {
    setCsvContent(content)
    setValidateResult(validation)
    setCalcResult(null)
    setCalcError(null)
  }, [])

  const handleCalculate = useCallback(async () => {
    if (!csvContent) return
    setIsCalculating(true)
    setCalcError(null)
    try {
      const result = await apiCalculate(csvContent, settings)
      setCalcResult(result)
      setActiveTab('summary')
    } catch (err) {
      setCalcError(err instanceof Error ? err.message : '計算エラーが発生しました')
    } finally {
      setIsCalculating(false)
    }
  }, [csvContent, settings])

  const canCalculate = csvContent.length > 0 && (validateResult?.ok ?? false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold tracking-wide">
            現場計算機
            <span className="ml-3 text-sm font-normal text-blue-200">
              労働時間集計ツール（労働基準法準拠）
            </span>
          </h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Warnings banner */}
        {calcResult && calcResult.warnings.length > 0 && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 mb-1">警告 ({calcResult.warnings.length}件)</p>
            <ul className="list-disc list-inside space-y-0.5">
              {calcResult.warnings.map((w, i) => (
                <li key={i} className="text-sm text-yellow-700">{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Calc error banner */}
        {calcError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-sm font-medium text-red-800">計算エラー</p>
            <p className="text-sm text-red-700 mt-1">{calcError}</p>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg overflow-x-auto">
          {TABS.map((tab) => {
            const disabled = tab.requiresResult && !calcResult
            return (
              <button
                key={tab.id}
                onClick={() => !disabled && setActiveTab(tab.id)}
                disabled={disabled}
                className={[
                  'tab-button flex-shrink-0',
                  activeTab === tab.id ? 'tab-active' : 'tab-inactive',
                  disabled ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}
              >
                {tab.label}
              </button>
            )
          })}

          {/* Calculate button in tab bar */}
          <div className="ml-auto flex items-center px-3">
            <button
              onClick={handleCalculate}
              disabled={!canCalculate || isCalculating}
              className="btn-primary text-sm py-1.5 px-4 whitespace-nowrap"
            >
              {isCalculating ? '計算中...' : '計算実行'}
            </button>
          </div>
        </div>

        {/* Tab content */}
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg shadow-sm min-h-96">
          {activeTab === 'upload' && (
            <div className="p-4">
              <CSVUpload
                onCSVLoaded={handleCSVLoaded}
                validateResult={validateResult}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-4">
              <SettingsForm
                settings={settings}
                onChange={setSettings}
                onCalculate={handleCalculate}
                canCalculate={canCalculate}
                isCalculating={isCalculating}
              />
            </div>
          )}

          {activeTab === 'summary' && calcResult && (
            <div className="p-4">
              <SummaryView summary={calcResult.summary} />
            </div>
          )}

          {activeTab === 'daily' && calcResult && (
            <div className="p-4">
              <DailyDetail rows={calcResult.daily_rows} />
            </div>
          )}

          {activeTab === 'weekly' && calcResult && (
            <div className="p-4">
              <WeeklyDetail rows={calcResult.weekly_rows} />
            </div>
          )}

          {activeTab === 'monthly' && calcResult && (
            <div className="p-4">
              <MonthlyFrame
                monthlyFrame={calcResult.monthly_frame}
                overtimeSegments={calcResult.overtime_segments}
                settings={settings}
              />
            </div>
          )}

          {activeTab === 'trace' && calcResult && (
            <div className="p-4">
              <TraceView
                globalTrace={calcResult.trace}
                dailyRows={calcResult.daily_rows}
                weeklyRows={calcResult.weekly_rows}
                calcResult={calcResult}
              />
            </div>
          )}

          {!calcResult && activeTab !== 'upload' && activeTab !== 'settings' && (
            <div className="p-12 text-center text-gray-400">
              <p className="text-lg">まず CSVをアップロードして「計算実行」してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
