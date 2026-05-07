import axios from 'axios'
import type { CalculationSettings, CalculateResponse, ValidateResponse } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
})

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const detail = error.response.data?.detail
      const message = typeof detail === 'string'
        ? detail
        : `APIエラー: ${error.response.status} ${error.response.statusText}`
      return Promise.reject(new Error(message))
    } else if (error.request) {
      return Promise.reject(new Error('サーバーに接続できませんでした。バックエンドが起動しているか確認してください。'))
    }
    return Promise.reject(error)
  }
)

export async function validateCSV(content: string): Promise<ValidateResponse> {
  const response = await apiClient.post<ValidateResponse>('/api/validate-csv', {
    csv_content: content,
  })
  return response.data
}

export async function calculate(
  content: string,
  settings: CalculationSettings
): Promise<CalculateResponse> {
  const response = await apiClient.post<CalculateResponse>('/api/calculate', {
    csv_content: content,
    settings,
  })
  return response.data
}

export async function exportResult(
  result: CalculateResponse,
  format: 'csv' | 'excel'
): Promise<Blob> {
  const response = await apiClient.post(
    '/api/export',
    { result, format },
    { responseType: 'blob' }
  )
  return response.data
}
