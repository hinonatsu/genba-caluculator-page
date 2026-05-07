import type { MonthlyFrameResult, OvertimeSegment, CalculationSettings } from '../types'
import { DAY_TYPE_LABELS, formatMinutes } from '../types'

interface Props {
  monthlyFrame: MonthlyFrameResult
  overtimeSegments: OvertimeSegment[]
  settings: CalculationSettings
}

export default function MonthlyFrame({ monthlyFrame: mf, overtimeSegments, settings }: Props) {
  const threshold60h = 3600 // 60h in minutes

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">月総枠判定</h2>
        <p className="text-sm text-gray-500">
          変形労働時間制における月法定総枠の計算と時間外労働の判定結果です。
        </p>
      </div>

      {/* Monthly frame calculation */}
      <div className="card border border-blue-200 bg-blue-50">
        <h3 className="text-sm font-semibold text-blue-800 mb-4">月法定総枠の計算式</h3>
        <div className="bg-white rounded-lg p-4 font-mono text-sm text-center border border-blue-100">
          <span className="text-blue-700 font-bold">{settings.weekly_legal_hours}時間</span>
          <span className="text-gray-500 mx-2">×</span>
          <span className="text-blue-700 font-bold">{mf.period_days}日</span>
          <span className="text-gray-500 mx-2">÷</span>
          <span className="text-gray-500">7日</span>
          <span className="text-gray-500 mx-2">=</span>
          <span className="text-blue-800 font-bold text-lg">{formatMinutes(Math.floor(mf.monthly_legal_minutes))}</span>
          <span className="text-gray-400 text-xs ml-1">({mf.monthly_legal_minutes.toFixed(2)}分)</span>
        </div>
      </div>

      {/* Step-by-step calculation */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
          月次時間外判定ステップ
        </h3>
        <div className="space-y-3">
          <CalculationStep
            step={1}
            label="変形期間日数"
            value={`${mf.period_days}日`}
            color="blue"
          />
          <CalculationStep
            step={2}
            label="月法定総枠"
            value={formatMinutes(Math.floor(mf.monthly_legal_minutes))}
            sub={`${mf.monthly_legal_minutes.toFixed(2)}分`}
            color="blue"
          />
          <CalculationStep
            step={3}
            label="実労働時間（法定休日除く）"
            value={formatMinutes(mf.work_excluding_statutory_minutes)}
            color="gray"
          />
          <CalculationStep
            step={4}
            label="日次超過時間外（控除）"
            value={`- ${formatMinutes(mf.overtime_day_total_minutes)}`}
            color="orange"
          />
          <CalculationStep
            step={5}
            label="週次超過時間外（控除）"
            value={`- ${formatMinutes(mf.overtime_week_total_minutes)}`}
            color="orange"
          />
          <div className="border-t border-gray-200 pt-3">
            <CalculationStep
              step={6}
              label="月総枠超過時間外"
              value={formatMinutes(mf.overtime_month_minutes)}
              color={mf.overtime_month_minutes > 0 ? 'red' : 'green'}
              bold
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg font-mono text-xs text-gray-600">
          <p className="font-semibold text-gray-700 mb-1">計算式:</p>
          <p>
            max(0, {formatMinutes(mf.work_excluding_statutory_minutes)} - {formatMinutes(mf.overtime_day_total_minutes)} - {formatMinutes(mf.overtime_week_total_minutes)} - {formatMinutes(Math.floor(mf.monthly_legal_minutes))})
            = <strong>{formatMinutes(mf.overtime_month_minutes)}</strong>
          </p>
        </div>
      </div>

      {/* Trace */}
      {mf.trace.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">計算トレース</h3>
          <div className="bg-gray-50 rounded p-3 font-mono text-xs text-gray-700 space-y-1 max-h-48 overflow-y-auto">
            {mf.trace.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* Overtime segments table */}
      {overtimeSegments.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            60時間超過判定一覧
            <span className="ml-2 text-xs font-normal text-gray-500">
              （月60時間 = {formatMinutes(threshold60h)}）
            </span>
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th className="px-3 py-2 text-left">日付</th>
                  <th className="px-3 py-2 text-left">日区分</th>
                  <th className="px-3 py-2 text-left">発生元</th>
                  <th className="px-3 py-2 text-right">時間外分</th>
                  <th className="px-3 py-2 text-right">累計</th>
                  <th className="px-3 py-2 text-center">60h超</th>
                </tr>
              </thead>
              <tbody>
                {overtimeSegments.map((seg, i) => {
                  const isOver = seg.is_over_60h
                  const crossesBoundary = !isOver && seg.cumulative_minutes === threshold60h
                  const rowBg = isOver ? 'bg-red-50' : crossesBoundary ? 'bg-yellow-50' : ''
                  return (
                    <tr key={i} className={`${rowBg} border-b border-gray-100`}>
                      <td className="px-3 py-1.5 font-medium">{seg.date}</td>
                      <td className="px-3 py-1.5">{DAY_TYPE_LABELS[seg.day_type] ?? seg.day_type}</td>
                      <td className="px-3 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          seg.source === 'day' ? 'bg-orange-100 text-orange-700' :
                          seg.source === 'week' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {seg.source === 'day' ? '日次' : seg.source === 'week' ? '週次' : '月総枠'}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatMinutes(seg.minutes)}</td>
                      <td className={`px-3 py-1.5 text-right font-mono font-semibold ${
                        seg.cumulative_minutes > threshold60h ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        {formatMinutes(seg.cumulative_minutes)}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        {isOver ? (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">超過</span>
                        ) : crossesBoundary ? (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">境界</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-xs">
              <p className="text-gray-500">60h以下時間外合計</p>
              <p className="font-mono font-bold text-gray-700">
                {formatMinutes(overtimeSegments.filter(s => !s.is_over_60h).reduce((sum, s) => sum + s.minutes, 0))}
              </p>
            </div>
            <div className="text-xs">
              <p className="text-gray-500">60h超時間外合計</p>
              <p className="font-mono font-bold text-red-600">
                {formatMinutes(overtimeSegments.filter(s => s.is_over_60h).reduce((sum, s) => sum + s.minutes, 0))}
              </p>
            </div>
            <div className="text-xs">
              <p className="text-gray-500">最終累計</p>
              <p className="font-mono font-bold text-gray-700">
                {overtimeSegments.length > 0
                  ? formatMinutes(overtimeSegments[overtimeSegments.length - 1].cumulative_minutes)
                  : '-'}
              </p>
            </div>
            <div className="text-xs">
              <p className="text-gray-500">60時間超の閾値</p>
              <p className="font-mono font-bold text-blue-600">{formatMinutes(threshold60h)}</p>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            ※ 月60時間超の時間外労働については、割増賃金率が25%から50%に引き上げられます（2023年4月施行）。
            法定休日労働はこのカウントに含まれません。
          </p>
        </div>
      )}
    </div>
  )
}

function CalculationStep({
  step,
  label,
  value,
  sub,
  color,
  bold = false,
}: {
  step: number
  label: string
  value: string
  sub?: string
  color: 'blue' | 'gray' | 'orange' | 'red' | 'green'
  bold?: boolean
}) {
  const colorMap = {
    blue: 'text-blue-600',
    gray: 'text-gray-700',
    orange: 'text-orange-600',
    red: 'text-red-600',
    green: 'text-green-600',
  }

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center space-x-3">
        <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {step}
        </span>
        <span className={`text-sm ${bold ? 'font-semibold' : ''} text-gray-700`}>{label}</span>
      </div>
      <div className="text-right">
        <span className={`font-mono font-bold text-sm ${colorMap[color]}`}>{value}</span>
        {sub && <span className="block text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  )
}
