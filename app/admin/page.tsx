"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Edit, Trash2, Save, X, MapPin, User, Calendar, Maximize2, RefreshCw, Monitor, Bus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { apiService, type Billboard, type Statistics } from "@/lib/api"

export default function AdminPanel() {
  const [billboards, setBillboards] = useState<Billboard[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [employees, setEmployees] = useState<Array<{ id: number; full_name: string; email: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingBillboard, setEditingBillboard] = useState<Billboard | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<Billboard>>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [billboardsData, statsData, employeesData] = await Promise.all([
        apiService.getBillboards(),
        apiService.getStatistics(),
        apiService.getEmployees(),
      ])

      setBillboards(billboardsData)
      setStatistics(statsData)
      setEmployees(employeesData)
    } catch (error) {
      console.error("Failed to load data:", error)
      setError("Не удалось загрузить данные")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setFormData({
      images: ["", ""],
      employee: "",
      size: "",
      address: "",
      location: { lat: 41.2995, lng: 69.2401 },
      period: "",
      status: "pending",
      category: 1, // Добавлено значение по умолчанию
      title: "",
      description: "",
    })
  }

  const handleEdit = (billboard: Billboard) => {
    setEditingBillboard(billboard)
    setFormData({
      ...billboard,
      employee: billboard.employee,
    })
  }

  const handleSave = async () => {
    try {
      if (isCreating) {
        await apiService.createBillboard(formData)
        setIsCreating(false)
      } else if (editingBillboard) {
        await apiService.updateBillboard(editingBillboard.id, formData)
        setEditingBillboard(null)
      }

      setFormData({})
      await loadData()
    } catch (error) {
      console.error("Failed to save billboard:", error)
      setError("Не удалось сохранить билборд")
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm("Вы уверены, что хотите удалить этот билборд?")) {
      try {
        await apiService.deleteBillboard(id)
        await loadData()
      } catch (error) {
        console.error("Failed to delete billboard:", error)
        setError("Не удалось удалить билборд")
      }
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingBillboard(null)
    setFormData({})
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateLocation = (field: "lat" | "lng", value: string) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location!,
        [field]: Number.parseFloat(value) || 0,
      },
    }))
  }

  const updateImages = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.map((img, i) => (i === index ? value : img)) || [],
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "expired":
        return "bg-red-100 text-red-800"
      case "maintenance":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Активен"
      case "pending":
        return "Ожидание"
      case "expired":
        return "Истёк"
      case "maintenance":
        return "Обслуживание"
      default:
        return "Неизвестно"
    }
  }

  const getCategoryColor = (category_data?: any) => {
    if (category_data?.slug === "billboard") {
      return "bg-blue-100 text-blue-800"
    } else if (category_data?.slug === "bus_stop") {
      return "bg-green-100 text-green-800"
    }
    return "bg-gray-100 text-gray-800"
  }

  const getCategoryText = (category_data?: any) => {
    return category_data?.name || "Неизвестно"
  }

  const getCategoryIcon = (category_data?: any) => {
    return category_data?.icon === "bus" ? <Bus className="h-4 w-4" /> : <Monitor className="h-4 w-4" />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка админ-панели...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Админ-панель</h1>
              <p className="text-gray-600 mt-1">Управление билбордами и рекламой на остановках</p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={loadData} variant="outline" className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Обновить</span>
              </Button>
              <Button onClick={handleCreate} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Добавить</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Всего</p>
                    <p className="text-2xl font-bold">{statistics.total}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Билборды</p>
                    <p className="text-2xl font-bold text-blue-600">{statistics.categories?.billboard || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Monitor className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Остановки</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.categories?.bus_stop || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Bus className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Активных</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.active}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">В ожидании</p>
                    <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Истёкших</p>
                    <p className="text-2xl font-bold text-red-600">{statistics.expired}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <Maximize2 className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Billboards Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список рекламных конструкций</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billboards.map((billboard) => (
                <motion.div
                  key={billboard.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">ID</p>
                        <p className="font-medium">#{billboard.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Категория</p>
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(billboard.category_data)}
                          <Badge className={getCategoryColor(billboard.category_data)}>
                            {getCategoryText(billboard.category_data)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Название</p>
                        <p className="font-medium">
                          {billboard.title || `${getCategoryText(billboard.category_data)} #${billboard.id}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Сотрудник</p>
                        <p className="font-medium">{billboard.employee}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Размер</p>
                        <p className="font-medium">{billboard.size}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Статус</p>
                        <Badge className={getStatusColor(billboard.status)}>{getStatusText(billboard.status)}</Badge>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(billboard)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(billboard.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {(isCreating || editingBillboard) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={handleCancel}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                      {isCreating ? "Добавить рекламную конструкцию" : "Редактировать"}
                    </h2>
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <Label htmlFor="title">Название</Label>
                      <Input
                        id="title"
                        value={formData.title || ""}
                        onChange={(e) => updateFormData("title", e.target.value)}
                        placeholder="Название рекламной конструкции"
                      />
                    </div>

                    {/* Employee */}
                    <div>
                      <Label htmlFor="employee">Ответственный сотрудник</Label>
                      <Input
                        id="employee"
                        value={formData.employee || ""}
                        onChange={(e) => updateFormData("employee", e.target.value)}
                        placeholder="Имя сотрудника"
                      />
                    </div>

                    {/* Size - обновлен placeholder для отражения нового формата */}
                    <div>
                      <Label htmlFor="size">Размер (ВxШ м)</Label>
                      <Input
                        id="size"
                        value={formData.size || ""}
                        onChange={(e) => updateFormData("size", e.target.value)}
                        placeholder="6x3 м (высота x ширина)"
                      />
                    </div>

                    {/* Address */}
                    <div>
                      <Label htmlFor="address">Адрес</Label>
                      <Textarea
                        id="address"
                        value={formData.address || ""}
                        onChange={(e) => updateFormData("address", e.target.value)}
                        placeholder="Полный адрес"
                        rows={2}
                      />
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="lat">Широта</Label>
                        <Input
                          id="lat"
                          type="number"
                          step="any"
                          value={formData.location?.lat || ""}
                          onChange={(e) => updateLocation("lat", e.target.value)}
                          placeholder="41.2995"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lng">Долгота</Label>
                        <Input
                          id="lng"
                          type="number"
                          step="any"
                          value={formData.location?.lng || ""}
                          onChange={(e) => updateLocation("lng", e.target.value)}
                          placeholder="69.2401"
                        />
                      </div>
                    </div>

                    {/* Period */}
                    <div>
                      <Label htmlFor="period">Период аренды</Label>
                      <Input
                        id="period"
                        value={formData.period || ""}
                        onChange={(e) => updateFormData("period", e.target.value)}
                        placeholder="01.06.2025 – 01.09.2025"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <Label htmlFor="status">Статус</Label>
                      <Select value={formData.status || ""} onValueChange={(value) => updateFormData("status", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Активен</SelectItem>
                          <SelectItem value="pending">Ожидание</SelectItem>
                          <SelectItem value="expired">Истёк</SelectItem>
                          <SelectItem value="maintenance">Обслуживание</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="description">Описание</Label>
                      <Textarea
                        id="description"
                        value={formData.description || ""}
                        onChange={(e) => updateFormData("description", e.target.value)}
                        placeholder="Подробное описание"
                        rows={3}
                      />
                    </div>

                    {/* Images */}
                    <div>
                      <Label>Изображения</Label>
                      <div className="space-y-2">
                        <Input
                          value={formData.images?.[0] || ""}
                          onChange={(e) => updateImages(0, e.target.value)}
                          placeholder="URL первого изображения"
                        />
                        <Input
                          value={formData.images?.[1] || ""}
                          onChange={(e) => updateImages(1, e.target.value)}
                          placeholder="URL второго изображения"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-4 pt-4">
                      <Button onClick={handleSave} className="flex-1">
                        <Save className="h-4 w-4 mr-2" />
                        Сохранить
                      </Button>
                      <Button variant="outline" onClick={handleCancel} className="flex-1">
                        Отмена
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
