import { useCallback } from 'react'
import type { CalculationSettings } from '../types'

interface Props {
  settings: CalculationSettings
  onChange: (settings: CalculationSettings) => void
  onCalculate: () => void
  canCalculate: boolean
  isCalculating: boolean
}

const WEEK_DAYS = ['月曜', '火曜', '水曜', '木曜', '金曜', '土曜', '日曜']

export default function SettingsForm({ settings, onChange, onCalculate, canCalculate, isCalculating }: Props) {
  const update = useCallback(<K extends keyof CalculationSettings>(
    key: K,
    value: CalculationSettings[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }, [settings, onChange])

  const handleMonthChange = useCallback((monthStr: string) => {
    if (!monthStr) return
    const [year, month] = monthStr.split('-').map(Number)
    if (!year || !month) return
    const daysInMonth = new Date(year, month, 0).getDate()
    const periodEnd = `${monthStr}-${daysInMonth.toString().padStart(2, '0')}`
    onChange({
      ...settings,
      target_month: monthStr,
      period_start: `${monthStr}-01`,
      period_end: periodEnd,
    })
  }, [settings, onChange])

  function minutesToTime(minutes: number): string {
    const h = Math.floor((minutes % 1440) / 60)
    const m = minutes % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  function timeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">計算設定</h2>
        <p className="text-sm text-gray-500">労働時間計算のパラメータを設定してください。</p>
      </div>

      {/* Period settings */}
      <section className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
          対象期間
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">対象月</label>
            <input
              type="month"
              value={settings.target_month}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">変形期間 開始日</label>
            <input
              type="date"
              value={settings.period_start}
              onChange={(e) => update('period_start', e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">変形期間 終了日</label>
            <input
              type="date"
              value={settings.period_end}
              onChange={(e) => update('period_end', e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </section>

      {/* Weekly settings */}
      <section className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
          週次設定
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">週の起算曜日</label>
            <select
              value={settings.week_start_day}
              onChange={(e) => update('week_start_day', parseInt(e.target.value))}
              className="form-select"
            >
              {WEEK_DAYS.map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">週法定労働時間</label>
            <select
              value={settings.weekly_legal_hours}
              onChange={(e) => update('weekly_legal_hours', parseInt(e.target.value))}
              className="form-select"
            >
              <option value={40}>40時間（一般）</option>
              <option value={44}>44時間（特例事業場）</option>
            </select>
          </div>
          <div>
            <label className="form-label">月跨ぎ週の扱い</label>
            <select
              value={settings.week_cross_month_mode}
              onChange={(e) => update('week_cross_month_mode', e.target.value as 'prorated' | 'full_week')}
              className="form-select"
            >
              <option value="prorated">暦日按分（推奨）</option>
              <option value="full_week">完全週として計算</option>
            </select>
          </div>
        </div>
      </section>

      {/* Rounding settings */}
      <section className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
          端数処理
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">丸め単位</label>
            <select
              value={settings.rounding_unit}
              onChange={(e) => update('rounding_unit', parseInt(e.target.value))}
              className="form-select"
            >
              <option value={1}>1分（切り捨てなし）</option>
              <option value={5}>5分</option>
              <option value={10}>10分</option>
              <option value={15}>15分</option>
              <option value={30}>30分</option>
            </select>
          </div>
          <div>
            <label className="form-label">端数の処理方向</label>
            <select
              value={settings.rounding_direction}
              onChange={(e) => update('rounding_direction', e.target.value as CalculationSettings['rounding_direction'])}
              className="form-select"
            >
              <option value="none">なし（1分単位のみ）</option>
              <option value="down">切り捨て</option>
              <option value="up">切り上げ</option>
              <option value="nearest">四捨五入</option>
            </select>
          </div>
        </div>
      </section>

      {/* Night time settings */}
      <section className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
          深夜時間帯
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">深夜開始時刻（デフォルト: 22:00）</label>
            <input
              type="time"
              value={minutesToTime(settings.night_start_minutes)}
              onChange={(e) => update('night_start_minutes', timeToMinutes(e.target.value))}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">深夜終了時刻（デフォルト: 05:00）</label>
            <input
              type="time"
              value={minutesToTime(settings.night_end_minutes)}
              onChange={(e) => update('night_end_minutes', timeToMinutes(e.target.value))}
              className="form-input"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          深夜割増賃金の対象時間帯です。終了時刻は翌日（例: 5:00 → 翌05:00）として計算されます。
        </p>
      </section>

      {/* Other settings */}
      <section className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
          その他の設定
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">デフォルト所定労働時間（分）</label>
            <input
              type="number"
              value={settings.default_scheduled_work_minutes}
              onChange={(e) => update('default_scheduled_work_minutes', parseInt(e.target.value) || 480)}
              min={0}
              max={1440}
              step={30}
              className="form-input"
            />
            <p className="mt-1 text-xs text-gray-500">
              CSVに所定労働時間が未記入の場合に使用します（デフォルト: 480分 = 8時間）
            </p>
          </div>
          <div>
            <label className="form-label">月60時間超の起算日</label>
            <input
              type="date"
              value={settings.overtime_60h_start_date || ''}
              onChange={(e) => update('overtime_60h_start_date', e.target.value || null)}
              className="form-input"
            />
            <p className="mt-1 text-xs text-gray-500">
              空欄の場合は変形期間開始日から計算します。
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.include_paid_leave_in_scheduled}
              onChange={(e) => update('include_paid_leave_in_scheduled', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              有給休暇を所定内労働時間に含める
            </span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.exclude_statutory_holiday_from_60h}
              onChange={(e) => update('exclude_statutory_holiday_from_60h', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              法定休日労働を60時間超のカウントから除外する
            </span>
          </label>
        </div>
      </section>

      {/* Calculate button */}
      <div className="flex justify-end">
        <button
          onClick={onCalculate}
          disabled={!canCalculate || isCalculating}
          className="btn-primary px-8 py-3"
        >
          {isCalculating ? (
            <span className="flex items-center space-x-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>計算中...</span>
            </span>
          ) : (
            '計算実行'
          )}
        </button>
      </div>

      {!canCalculate && (
        <p className="text-sm text-gray-500 text-right">
          ※ CSVファイルをアップロードしてから計算できます
        </p>
      )}
    </div>
  )
}
