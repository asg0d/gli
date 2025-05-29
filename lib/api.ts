const API_BASE_URL = "https://api.location.utu-ranch.uz/api"

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  icon: string
  color: string
  is_active: boolean
  order: number
  billboards_count: number
}

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
  category: number // ID категории
  category_data?: Category // Полные данные категории (опционально)
  // Возможные поля для названия
  name?: string
  title?: string
  billboard_name?: string
  display_name?: string
  label?: string
  description?: string
  price?: string
  created_at?: string
  updated_at?: string
  // Добавляем any для неизвестных полей от API
  [key: string]: any
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
  categories: { [key: string]: number }
}

// Mock данные как fallback
const mockCategories: Category[] = [
  {
    id: 1,
    name: "Билборды",
    slug: "billboard",
    description: "Крупноформатные рекламные конструкции",
    icon: "monitor",
    color: "#3b82f6",
    is_active: true,
    order: 1,
    billboards_count: 2,
  },
  {
    id: 2,
    name: "Остановки",
    slug: "bus_stop",
    description: "Реклама на остановках общественного транспорта",
    icon: "bus",
    color: "#10b981",
    is_active: true,
    order: 2,
    billboards_count: 2,
  },
]

const mockBillboards: Billboard[] = [
  {
    id: 1,
    images: ["/placeholder.svg?height=400&width=400", "/placeholder.svg?height=400&width=400&text=Фото+2"],
    employee: "Алексей Петров",
    size: "3x6 м",
    address: "ул. Амира Темура, 15, Ташкент",
    location: { lat: 41.2995, lng: 69.2401 },
    period: "01.06.2025 – 01.09.2025",
    status: "active",
    category: 1,
    category_data: mockCategories[0],
    title: "Центральный билборд Амира Темура",
    description: "Премиальное расположение в центре города с высокой проходимостью.",
    price: "2,500,000 сум/месяц",
  },
  {
    id: 2,
    images: ["/placeholder.svg?height=400&width=400&text=Билборд+2"],
    employee: "Мария Иванова",
    size: "4x8 м",
    address: "пр. Шахрисабз, 25, Ташкент",
    location: { lat: 41.3111, lng: 69.2797 },
    period: "15.05.2025 – 15.08.2025",
    status: "pending",
    category: 1,
    category_data: mockCategories[0],
    title: "Большой билборд на Шахрисабз",
    description: "Большой билборд на главной магистрали города.",
    price: "3,200,000 сум/месяц",
  },
  {
    id: 3,
    images: ["/placeholder.svg?height=400&width=400&text=Остановка+1"],
    employee: "Дмитрий Сидоров",
    size: "1.2x1.8 м",
    address: "Остановка Чорсу, ул. Навои, Ташкент",
    location: { lat: 41.3167, lng: 69.25 },
    period: "10.04.2025 – 10.07.2025",
    status: "active",
    category: 2,
    category_data: mockCategories[1],
    title: "Реклама на остановке Чорсу",
    description: "Реклама на популярной остановке общественного транспорта.",
    price: "800,000 сум/месяц",
  },
  {
    id: 4,
    images: ["/placeholder.svg?height=400&width=400&text=Остановка+2"],
    employee: "Анна Козлова",
    size: "1.2x1.8 м",
    address: "Остановка Университет, пр. Мустакиллик, Ташкент",
    location: { lat: 41.2856, lng: 69.2034 },
    period: "01.03.2025 – 01.06.2025",
    status: "maintenance",
    category: 2,
    category_data: mockCategories[1],
    title: "Реклама на остановке Университет",
    description: "Реклама рядом с университетом, высокий студенческий трафик.",
    price: "650,000 сум/месяц",
  },
]

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

      const data = await response.json()

      // Отладочная информация для проверки структуры данных
      if (endpoint.includes("/billboards") && data.results && data.results.length > 0) {
        console.log("API Response structure:", data.results[0])
        console.log("Available fields:", Object.keys(data.results[0]))
      }

      return data
    } catch (error) {
      console.warn(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.request<ApiResponse<Category>>("/categories/")
      return response.results || (response as any)
    } catch (error) {
      console.warn("API недоступен, используем демо данные категорий")
      return mockCategories
    }
  }

  async getBillboards(params?: {
    status?: string
    employee?: number
    search?: string
    category?: string | number // Может быть slug или id
  }): Promise<Billboard[]> {
    try {
      const searchParams = new URLSearchParams()

      if (params?.status) searchParams.append("status", params.status)
      if (params?.employee) searchParams.append("employee", params.employee.toString())
      if (params?.search) searchParams.append("search", params.search)
      if (params?.category) searchParams.append("category", params.category.toString())

      const queryString = searchParams.toString()
      const endpoint = `/billboards/${queryString ? `?${queryString}` : ""}`

      const response = await this.request<ApiResponse<Billboard>>(endpoint)
      const billboards = response.results || (response as any)

      // Если API не возвращает category_data, добавляем fallback
      return billboards.map((billboard: Billboard) => ({
        ...billboard,
        category_data: billboard.category_data || {
          id: billboard.category || 1,
          name: "Рекламная конструкция",
          slug: "unknown",
          description: "",
          icon: "monitor",
          color: "#3b82f6",
          is_active: true,
          order: 0,
          billboards_count: 0,
        },
      }))
    } catch (error) {
      console.warn("API недоступен, используем демо данные")

      // Применяем фильтр по категории к mock данным
      let filteredData = [...mockBillboards]
      if (params?.category) {
        if (typeof params.category === "string") {
          // Фильтр по slug - используем optional chaining
          filteredData = filteredData.filter((item) => item.category_data?.slug === params.category)
        } else {
          // Фильтр по id
          filteredData = filteredData.filter((item) => item.category === params.category)
        }
      }

      return filteredData
    }
  }

  async getBillboard(id: number): Promise<Billboard> {
    try {
      const billboard = await this.request<Billboard>(`/billboards/${id}/`)
      // Добавляем fallback для category_data если его нет
      return {
        ...billboard,
        category_data: billboard.category_data || {
          id: billboard.category || 1,
          name: "Рекламная конструкция",
          slug: "unknown",
          description: "",
          icon: "monitor",
          color: "#3b82f6",
          is_active: true,
          order: 0,
          billboards_count: 0,
        },
      }
    } catch (error) {
      const billboard = mockBillboards.find((b) => b.id === id)
      if (!billboard) throw new Error(`Billboard ${id} not found`)
      return billboard
    }
  }

  async createBillboard(data: Partial<Billboard>): Promise<Billboard> {
    try {
      return this.request<Billboard>("/billboards/", {
        method: "POST",
        body: JSON.stringify(data),
      })
    } catch (error) {
      throw new Error("Не удалось создать билборд")
    }
  }

  async updateBillboard(id: number, data: Partial<Billboard>): Promise<Billboard> {
    try {
      return this.request<Billboard>(`/billboards/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
    } catch (error) {
      throw new Error("Не удалось обновить билборд")
    }
  }

  async deleteBillboard(id: number): Promise<void> {
    try {
      await this.request<void>(`/billboards/${id}/`, {
        method: "DELETE",
      })
    } catch (error) {
      throw new Error("Не удалось удалить билборд")
    }
  }

  async getStatistics(): Promise<Statistics> {
    try {
      return this.request<Statistics>("/billboards/statistics/")
    } catch (error) {
      const categories: { [key: string]: number } = {}
      mockCategories.forEach((cat) => {
        // Используем optional chaining для безопасного доступа
        categories[cat.slug] = mockBillboards.filter((b) => b.category_data?.slug === cat.slug).length
      })

      return {
        total: mockBillboards.length,
        active: mockBillboards.filter((b) => b.status === "active").length,
        pending: mockBillboards.filter((b) => b.status === "pending").length,
        expired: mockBillboards.filter((b) => b.status === "expired").length,
        maintenance: mockBillboards.filter((b) => b.status === "maintenance").length,
        categories,
      }
    }
  }

  async getExpiringSoon(): Promise<Billboard[]> {
    try {
      const response = await this.request<ApiResponse<Billboard>>("/billboards/expiring_soon/")
      const billboards = response.results || (response as any)

      // Добавляем fallback для category_data
      return billboards.map((billboard: Billboard) => ({
        ...billboard,
        category_data: billboard.category_data || {
          id: billboard.category || 1,
          name: "Рекламная конструкция",
          slug: "unknown",
          description: "",
          icon: "monitor",
          color: "#3b82f6",
          is_active: true,
          order: 0,
          billboards_count: 0,
        },
      }))
    } catch (error) {
      return mockBillboards.filter((b) => b.status === "expired")
    }
  }

  async getEmployees(): Promise<Array<{ id: number; full_name: string; email: string }>> {
    try {
      const response = await this.request<ApiResponse<any>>("/employees/")
      return response.results || (response as any)
    } catch (error) {
      return [
        { id: 1, full_name: "Алексей Петров", email: "alexey@example.com" },
        { id: 2, full_name: "Мария Иванова", email: "maria@example.com" },
      ]
    }
  }
}

export const apiService = new ApiService()
