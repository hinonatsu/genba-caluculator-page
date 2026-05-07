import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react'
import type { ValidateResponse } from '../types'
import { validateCSV } from '../api/client'

interface Props {
  onCSVLoaded: (content: string, validation: ValidateResponse) => void
  validateResult: ValidateResponse | null
}

export default function CSVUpload({ onCSVLoaded, validateResult }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [previewRows, setPreviewRows] = useState<string[][]>([])
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setIsLoading(true)
    setFileName(file.name)

    try {
      const text = await readFileAsText(file)

      // Build preview
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length > 0) {
        const headers = parseCSVLine(lines[0])
        setPreviewHeaders(headers)
        const rows: string[][] = []
        for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
          rows.push(parseCSVLine(lines[i]))
        }
        setPreviewRows(rows)
      }

      // Validate via API
      const validation = await validateCSV(text)
      onCSVLoaded(text, validation)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイルの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [onCSVLoaded])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-1">CSVファイルアップロード</h2>
        <p className="text-sm text-gray-500">
          標準形式（日付・日区分・実始業・実終業など）または デモ形式（社員番号・出社時刻・退社時刻など）に対応しています。
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={[
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-150',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
        ].join(' ')}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFileChange}
        />
        {isLoading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">処理中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-600">
              CSVファイルをドラッグ＆ドロップ、またはクリックして選択
            </p>
            <p className="text-xs text-gray-400">CSV / TXT ファイル対応（UTF-8、Shift-JIS）</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Validation result */}
      {validateResult && (
        <div className={[
          'p-4 rounded-lg border',
          validateResult.ok
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200',
        ].join(' ')}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {validateResult.ok ? (
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className={`text-sm font-semibold ${validateResult.ok ? 'text-green-800' : 'text-red-800'}`}>
                {validateResult.ok ? 'CSV検証OK' : 'CSV検証エラー'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {validateResult.format !== 'unknown' && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  validateResult.format === 'spec'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {validateResult.format === 'spec' ? '標準形式' : 'デモ形式'}
                </span>
              )}
              <span className="text-xs text-gray-500">{validateResult.row_count}行</span>
            </div>
          </div>

          {validateResult.errors.length > 0 && (
            <ul className="mt-2 space-y-1">
              {validateResult.errors.map((e, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start space-x-1">
                  <span className="mt-0.5">•</span><span>{e}</span>
                </li>
              ))}
            </ul>
          )}

          {validateResult.warnings.length > 0 && (
            <div className={`mt-2 ${validateResult.errors.length > 0 ? 'pt-2 border-t border-red-200' : ''}`}>
              <p className="text-xs font-medium text-yellow-700 mb-1">警告:</p>
              <ul className="space-y-0.5">
                {validateResult.warnings.map((w, i) => (
                  <li key={i} className="text-xs text-yellow-700 flex items-start space-x-1">
                    <span className="mt-0.5">•</span><span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Preview table */}
      {previewHeaders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            プレビュー（先頭5行）— {fileName}
          </h3>
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-100">
                  {previewHeaders.map((h, i) => (
                    <th key={i} className="px-2 py-1.5 text-left font-medium text-gray-600 whitespace-nowrap border-b border-gray-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {previewHeaders.map((_, ci) => (
                      <td key={ci} className="px-2 py-1.5 text-gray-700 whitespace-nowrap border-b border-gray-100">
                        {row[ci] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV format guide */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">対応CSVフォーマット</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-700">
          <div>
            <p className="font-medium mb-1">標準形式（spec）</p>
            <code className="block bg-blue-100 px-2 py-1 rounded font-mono">
              日付,日区分,予定始業,予定終業,所定労働時間(分),実績区分,実始業,実終業,実休憩明細
            </code>
            <p className="mt-1 text-blue-600">休憩明細はセミコロン区切り: 12:00-13:00;18:00-18:30</p>
          </div>
          <div>
            <p className="font-medium mb-1">デモ形式（demo）</p>
            <code className="block bg-blue-100 px-2 py-1 rounded font-mono">
              社員番号,社員名,日付,有休区分,出社時刻,退社時刻,休憩開始1,休憩終了1,...
            </code>
            <p className="mt-1 text-blue-600">休憩は何セットでも対応（休憩開始1,休憩終了1,休憩開始2,… と連番で追加可）</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Helpers ----

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('ファイルの読み込みに失敗しました'))
      }
    }
    reader.onerror = () => reject(new Error('ファイルの読み込み中にエラーが発生しました'))
    reader.readAsText(file, 'UTF-8')
  })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}
