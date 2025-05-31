const API_BASE_URL = "https://api.location.utu-ranch.uz"

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

export interface Contractor {
  id: number
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  contract_number: string
  inn: string
  website: string
  notes: string
  is_active: boolean
  billboards_count: number
  display_contact: string
  created_at: string
  updated_at: string
}

export interface Billboard {
  id: number
  title: string
  description: string
  category: number
  category_data?: Category
  contractor: number
  contractor_data?: Contractor
  employee: number
  employee_name: string
  width: number
  height: number
  size: string
  address: string
  latitude: number
  longitude: number
  location: {
    lat: number
    lng: number
  }
  start_date: string
  end_date: string
  period: string
  status: "active" | "pending" | "expired" | "maintenance"
  price: string
  notes: string
  images: any[]
  days_until_expiry: number
  created_at: string
  updated_at: string
  [key: string]: any
}

// Обновляем интерфейс ApiResponse, чтобы он включал информацию о пагинации
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
  contractors: { [key: string]: number }
  billboards?: number
  bus_stops?: number
}

// Добавляем новый метод в ApiService для поддержки пагинации
class ApiService {
  private apiUrls = [
    "https://api.location.utu-ranch.uz/api",
    "https://api.location.utu-ranch.uz",
    "http://api.location.utu-ranch.uz/api",
    "http://api.location.utu-ranch.uz",
  ]

  private workingUrl: string | null = null

  private async findWorkingUrl(): Promise<string> {
    if (this.workingUrl) {
      return this.workingUrl
    }

    console.log("🔍 Поиск рабочего URL API...")

    for (const url of this.apiUrls) {
      try {
        console.log(`🔄 Проверяем: ${url}`)

        const response = await fetch(`${url}/categories/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          mode: "cors",
          signal: AbortSignal.timeout(5000), // 5 second timeout
        })

        if (response.ok) {
          console.log(`✅ Найден рабочий URL: ${url}`)
          this.workingUrl = url
          return url
        } else {
          console.log(`❌ ${url} вернул статус: ${response.status}`)
        }
      } catch (error) {
        console.log(`❌ ${url} недоступен:`, error)
      }
    }

    throw new Error("Ни один из URL API не доступен")
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const baseUrl = await this.findWorkingUrl()
      const url = `${baseUrl}${endpoint}`

      console.log(`🌐 Запрос к API: ${url}`)

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options?.headers,
        },
        mode: "cors",
        signal: AbortSignal.timeout(10000), // 10 second timeout
        ...options,
      })

      console.log(`📡 Ответ API (${response.status}):`, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Ошибка API ${response.status}:`, errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      console.log(`✅ Данные получены:`, data)

      return data
    } catch (error) {
      console.error(`🚨 Ошибка запроса:`, error)
      throw error
    }
  }

  // Mock data for fallback
  private getMockCategories(): Category[] {
    return [
      {
        id: 1,
        name: "Билборды",
        slug: "billboard",
        description: "Крупноформатные рекламные конструкции",
        icon: "monitor",
        color: "#3b82f6",
        is_active: true,
        order: 1,
        billboards_count: 3,
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
  }

  private getMockContractors(): Contractor[] {
    return [
      {
        id: 1,
        name: 'ООО "Рекламные технологии"',
        contact_person: "Алексей Петров",
        phone: "+998 90 123 45 67",
        email: "info@reklama-tech.uz",
        address: "г. Ташкент, ул. Амира Темура, 15",
        contract_number: "РТ-2024-001",
        inn: "123456789",
        website: "https://reklama-tech.uz",
        notes: "",
        is_active: true,
        billboards_count: 2,
        display_contact: "Алексей Петров • +998 90 123 45 67",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        name: 'ИП "Медиа Групп"',
        contact_person: "Мария Иванова",
        phone: "+998 91 234 56 78",
        email: "contact@media-group.uz",
        address: "г. Ташкент, пр. Мустакиллик, 78",
        contract_number: "МГ-2024-002",
        inn: "987654321",
        website: "",
        notes: "",
        is_active: true,
        billboards_count: 1,
        display_contact: "Мария Иванова • +998 91 234 56 78",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ]
  }

  private getMockBillboards(category?: string): Billboard[] {
    const contractors = this.getMockContractors()

    const billboards = [
      {
        id: 1,
        title: "Билборд на проспекте Мустакиллик",
        description: "Крупноформатный билборд в центре города с высокой проходимостью",
        category: 1,
        category_data: {
          id: 1,
          name: "Билборды",
          slug: "billboard",
          description: "Крупноформатные рекламные конструкции",
          icon: "monitor",
          color: "#3b82f6",
          is_active: true,
          order: 1,
          billboards_count: 3,
        },
        contractor: 1,
        contractor_data: contractors[0],
        employee: 1,
        employee_name: "Алексей Петров",
        width: 3,
        height: 6,
        size: "3.00x6.00 м",
        address: "пр. Мустакиллик, 45, Ташкент",
        latitude: 41.2995,
        longitude: 69.2401,
        location: { lat: 41.2995, lng: 69.2401 },
        start_date: "2024-01-15",
        end_date: "2024-12-31",
        period: "15.01.2024 – 31.12.2024",
        status: "active" as const,
        price: "2500000 сум",
        notes: "",
        images: ["/placeholder.svg?height=400&width=600"],
        days_until_expiry: 180,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
      },
      {
        id: 2,
        title: "Реклама на остановке Чорсу",
        description: "Реклама на популярной остановке общественного транспорта",
        category: 2,
        category_data: {
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
        contractor: 2,
        contractor_data: contractors[1],
        employee: 2,
        employee_name: "Мария Иванова",
        width: 1.2,
        height: 1.8,
        size: "1.20x1.80 м",
        address: "Остановка Чорсу, ул. Навои, Ташкент",
        latitude: 41.3167,
        longitude: 69.25,
        location: { lat: 41.3167, lng: 69.25 },
        start_date: "2024-02-01",
        end_date: "2024-11-30",
        period: "01.02.2024 – 30.11.2024",
        status: "active" as const,
        price: "800000 сум",
        notes: "",
        images: ["/placeholder.svg?height=400&width=600"],
        days_until_expiry: 150,
        created_at: "2024-02-01T10:00:00Z",
        updated_at: "2024-02-01T10:00:00Z",
      },
    ]

    if (category === "billboard") {
      return billboards.filter((b) => b.category_data?.slug === "billboard")
    } else if (category === "bus_stop") {
      return billboards.filter((b) => b.category_data?.slug === "bus_stop")
    }

    return billboards
  }

  async getCategories(): Promise<Category[]> {
    console.log("🔄 Загрузка категорий...")

    try {
      const response = await this.request<Category[] | ApiResponse<Category>>("/categories/")

      let categories: Category[] = []

      if (Array.isArray(response)) {
        categories = response
      } else if (response && "results" in response) {
        categories = response.results
      } else {
        throw new Error("Неожиданный формат ответа категорий")
      }

      console.log("✅ Категории загружены с API:", categories)
      return categories
    } catch (error) {
      console.warn("⚠️ Не удалось загрузить категории с API, используем mock данные:", error)
      return this.getMockCategories()
    }
  }

  async getContractors(): Promise<Contractor[]> {
    console.log("🔄 Загрузка контрагентов...")

    try {
      const response = await this.request<Contractor[] | ApiResponse<Contractor>>("/contractors/")

      let contractors: Contractor[] = []

      if (Array.isArray(response)) {
        contractors = response
      } else if (response && "results" in response) {
        contractors = response.results
      } else {
        throw new Error("Неожиданный формат ответа контрагентов")
      }

      console.log("✅ Контрагенты загружены с API:", contractors)
      return contractors
    } catch (error) {
      console.warn("⚠️ Не удалось загрузить контрагентов с API, используем mock данные:", error)
      return this.getMockContractors()
    }
  }

  // Обновляем метод getBillboards для поддержки пагинации
  async getBillboards(params?: {
    status?: string
    employee?: number
    search?: string
    category?: string | number
    contractor?: number
    page?: number
  }): Promise<{ billboards: Billboard[]; nextPage: number | null; totalCount: number }> {
    console.log("🔄 Загрузка билбордов, параметры:", params)

    try {
      const searchParams = new URLSearchParams()

      if (params?.status) searchParams.append("status", params.status)
      if (params?.employee) searchParams.append("employee", params.employee.toString())
      if (params?.search) searchParams.append("search", params.search)
      if (params?.category) searchParams.append("category", params.category.toString())
      if (params?.contractor) searchParams.append("contractor", params.contractor.toString())
      if (params?.page) searchParams.append("page", params.page.toString())

      const queryString = searchParams.toString()
      const endpoint = `/billboards/${queryString ? `?${queryString}` : ""}`

      const response = await this.request<ApiResponse<Billboard>>(endpoint)

      let billboards: Billboard[] = []
      let nextPage: number | null = null
      let totalCount = 0

      if (response && "results" in response) {
        billboards = response.results
        totalCount = response.count

        // Определяем номер следующей страницы из URL
        if (response.next) {
          const nextUrl = new URL(response.next)
          const nextPageParam = nextUrl.searchParams.get("page")
          nextPage = nextPageParam ? Number.parseInt(nextPageParam) : null
        }
      } else if (Array.isArray(response)) {
        billboards = response
        totalCount = response.length
      } else {
        throw new Error("Неожиданный формат ответа билбордов")
      }

      console.log("✅ Билборды загружены с API:", billboards)

      // Обрабатываем данные билбордов
      const processedBillboards = billboards.map((billboard: any) => {
        let images: string[] = []
        if (billboard.images && Array.isArray(billboard.images)) {
          images = billboard.images.map((img: any) => {
            if (typeof img === "string") return img
            if (img && img.image) return img.image
            return "/placeholder.svg?height=400&width=600"
          })
        }

        if (images.length === 0) {
          images = ["/placeholder.svg?height=400&width=600"]
        }

        return {
          ...billboard,
          images,
          location: {
            lat: Number.parseFloat(billboard.latitude) || 0,
            lng: Number.parseFloat(billboard.longitude) || 0,
          },
          employee: billboard.employee_name || billboard.employee || "Не указан",
          size: billboard.size || `${billboard.width || 0}x${billboard.height || 0} м`,
          period: billboard.period || `${billboard.start_date || ""} – ${billboard.end_date || ""}`,
          price: billboard.price ? `${billboard.price} сум` : undefined,
        }
      })

      return {
        billboards: processedBillboards,
        nextPage,
        totalCount,
      }
    } catch (error) {
      console.warn("⚠️ Не удалось загрузить билборды с API, используем mock данные:", error)
      const mockBillboards = this.getMockBillboards(params?.category?.toString())
      return {
        billboards: mockBillboards,
        nextPage: null,
        totalCount: mockBillboards.length,
      }
    }
  }

  async getBillboard(id: number): Promise<Billboard> {
    console.log(`🔄 Загрузка билборда #${id}...`)

    try {
      const billboard = await this.request<any>(`/billboards/${id}/`)
      console.log("✅ Билборд загружен с API:", billboard)

      let images: string[] = []
      if (billboard.images && Array.isArray(billboard.images)) {
        images = billboard.images.map((img: any) => {
          if (typeof img === "string") return img
          if (img && img.image) return img.image
          return "/placeholder.svg?height=400&width=600"
        })
      }

      if (images.length === 0) {
        images = ["/placeholder.svg?height=400&width=600"]
      }

      return {
        ...billboard,
        images,
        location: {
          lat: Number.parseFloat(billboard.latitude) || 0,
          lng: Number.parseFloat(billboard.longitude) || 0,
        },
        employee: billboard.employee_name || billboard.employee || "Не указан",
        size: billboard.size || `${billboard.width || 0}x${billboard.height || 0} м`,
        period: billboard.period || `${billboard.start_date || ""} – ${billboard.end_date || ""}`,
        price: billboard.price ? `${billboard.price} сум` : undefined,
      }
    } catch (error) {
      console.warn(`⚠️ Не удалось загрузить билборд #${id} с API, используем mock данные:`, error)
      const mockBillboards = this.getMockBillboards()
      const billboard = mockBillboards.find((b) => b.id === id)
      if (!billboard) {
        throw new Error(`Билборд #${id} не найден`)
      }
      return billboard
    }
  }

  async createBillboard(data: Partial<Billboard>): Promise<Billboard> {
    console.log("🔄 Создание билборда:", data)

    try {
      const result = await this.request<Billboard>("/billboards/", {
        method: "POST",
        body: JSON.stringify(data),
      })
      console.log("✅ Билборд создан:", result)
      return result
    } catch (error) {
      console.error("❌ Ошибка создания билборда:", error)
      throw new Error("Не удалось создать билборд")
    }
  }

  async updateBillboard(id: number, data: Partial<Billboard>): Promise<Billboard> {
    console.log(`🔄 Обновление билборда #${id}:`, data)

    try {
      const result = await this.request<Billboard>(`/billboards/${id}/`, {
        method: "PUT",
        body: JSON.stringify(data),
      })
      console.log("✅ Билборд обновлен:", result)
      return result
    } catch (error) {
      console.error("❌ Ошибка обновления билборда:", error)
      throw new Error("Не удалось обновить билборд")
    }
  }

  async deleteBillboard(id: number): Promise<void> {
    console.log(`🔄 Удаление билборда #${id}...`)

    try {
      await this.request<void>(`/billboards/${id}/`, {
        method: "DELETE",
      })
      console.log("✅ Билборд удален")
    } catch (error) {
      console.error("❌ Ошибка удаления билборда:", error)
      throw new Error("Не удалось удалить билборд")
    }
  }

  async getStatistics(): Promise<Statistics> {
    console.log("🔄 Загрузка статистики...")

    try {
      const stats = await this.request<Statistics>("/billboards/statistics/")
      console.log("✅ Статистика загружена с API:", stats)
      return stats
    } catch (error) {
      console.warn("⚠️ Не удалось загрузить статистику с API, используем mock данные:", error)
      return {
        total: 5,
        active: 3,
        pending: 1,
        expired: 0,
        maintenance: 1,
        categories: {
          billboard: 3,
          bus_stop: 2,
        },
        contractors: {
          'ООО "Рекламные технологии"': 2,
          'ИП "Медиа Групп"': 1,
        },
      }
    }
  }

  async getExpiringSoon(): Promise<Billboard[]> {
    console.log("🔄 Загрузка истекающих билбордов...")

    try {
      const response = await this.request<Billboard[] | ApiResponse<Billboard>>("/billboards/expiring_soon/")

      let billboards: Billboard[] = []

      if (Array.isArray(response)) {
        billboards = response
      } else if (response && "results" in response) {
        billboards = response.results
      } else {
        throw new Error("Неожиданный формат ответа")
      }

      console.log("✅ Истекающие билборды загружены с API:", billboards)
      return billboards
    } catch (error) {
      console.warn("⚠️ Не удалось загрузить истекающие билборды с API, используем mock данные:", error)
      return []
    }
  }

  async getEmployees(): Promise<Array<{ id: number; full_name: string; email: string }>> {
    console.log("🔄 Загрузка сотрудников...")

    try {
      const response = await this.request<any[] | ApiResponse<any>>("/employees/")

      let employees: any[] = []

      if (Array.isArray(response)) {
        employees = response
      } else if (response && "results" in response) {
        employees = response.results
      } else {
        throw new Error("Неожиданный формат ответа")
      }

      console.log("✅ Сотрудники загружены с API:", employees)
      return employees
    } catch (error) {
      console.warn("⚠️ Не удалось загрузить сотрудников с API, используем mock данные:", error)
      return [
        { id: 1, full_name: "Алексей Петров", email: "alexey@example.com" },
        { id: 2, full_name: "Мария Иванова", email: "maria@example.com" },
      ]
    }
  }

  async checkApiHealth(): Promise<{ status: string; message: string }> {
    try {
      console.log("🔄 Проверка доступности API...")

      await this.findWorkingUrl()
      console.log("✅ API доступен и отвечает")
      return { status: "ok", message: "API доступен" }
    } catch (error) {
      console.error("❌ API недоступен:", error)
      return {
        status: "error",
        message: `API недоступен. Возможные причины: CORS, сеть, сервер недоступен. Используются mock данные.`,
      }
    }
  }
}

export const apiService = new ApiService()
