const API_BASE_URL = "http://127.0.0.1:3333/api"

export interface Billboard {
  id: number
  images: string[]
  employee: string
  size: string
  address: string
  location: {
    lat: number
    lng: number
  }
  period: string
  status: "active" | "pending" | "expired" | "maintenance"
  title?: string
  description?: string
  price?: string
  created_at?: string
  updated_at?: string
}

export interface ApiResponse<T> {
  results: T[]
  count: number
  next: string | null
  previous: string | null
}

export interface Statistics {
  total: number
  active: number
  pending: number
  expired: number
  maintenance: number
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Получить все билборды
  async getBillboards(params?: {
    status?: string
    employee?: number
    search?: string
  }): Promise<Billboard[]> {
    const searchParams = new URLSearchParams()

    if (params?.status) searchParams.append("status", params.status)
    if (params?.employee) searchParams.append("employee", params.employee.toString())
    if (params?.search) searchParams.append("search", params.search)

    const queryString = searchParams.toString()
    const endpoint = `/billboards/${queryString ? `?${queryString}` : ""}`

    const response = await this.request<ApiResponse<Billboard>>(endpoint)
    return response.results || (response as any) // Поддержка разных форматов ответа
  }

  // Получить билборд по ID
  async getBillboard(id: number): Promise<Billboard> {
    return this.request<Billboard>(`/billboards/${id}/`)
  }

  // Создать новый билборд
  async createBillboard(data: Partial<Billboard>): Promise<Billboard> {
    return this.request<Billboard>("/billboards/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Обновить билборд
  async updateBillboard(id: number, data: Partial<Billboard>): Promise<Billboard> {
    return this.request<Billboard>(`/billboards/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Удалить билборд
  async deleteBillboard(id: number): Promise<void> {
    await this.request<void>(`/billboards/${id}/`, {
      method: "DELETE",
    })
  }

  // Получить статистику
  async getStatistics(): Promise<Statistics> {
    return this.request<Statistics>("/billboards/statistics/")
  }

  // Получить билборды с истекающей арендой
  async getExpiringSoon(): Promise<Billboard[]> {
    const response = await this.request<ApiResponse<Billboard>>("/billboards/expiring_soon/")
    return response.results || (response as any)
  }

  // Получить сотрудников
  async getEmployees(): Promise<Array<{ id: number; full_name: string; email: string }>> {
    const response = await this.request<ApiResponse<any>>("/employees/")
    return response.results || (response as any)
  }
}

export const apiService = new ApiService()
