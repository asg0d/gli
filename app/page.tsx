"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Image from "next/image"
import {
  MapPin,
  Calendar,
  User,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  AlertCircle,
  Monitor,
  Bus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiService, type Billboard, type Category } from "@/lib/api"

export default function Dashboard() {
  const [billboards, setBillboards] = useState<Billboard[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>("")

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (activeCategory) {
      loadBillboards(activeCategory)
    }
  }, [activeCategory])

  const loadInitialData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setIsUsingMockData(false)

      const categoriesData = await apiService.getCategories()
      setCategories(categoriesData)

      // Устанавливаем первую категорию как активную
      if (categoriesData.length > 0) {
        setActiveCategory(categoriesData[0].slug)
      }
    } catch (error) {
      console.error("Failed to load initial data:", error)
      setError("Сервер недоступен. Показаны демонстрационные данные.")
      setIsUsingMockData(true)

      // Загружаем mock данные
      try {
        const mockCategories = await apiService.getCategories()
        setCategories(mockCategories)
        if (mockCategories.length > 0) {
          setActiveCategory(mockCategories[0].slug)
        }
      } catch (mockError) {
        setError("Не удалось загрузить данные")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadBillboards = async (categorySlug: string) => {
    try {
      setIsLoading(true)
      const data = await apiService.getBillboards({ category: categorySlug })
      setBillboards(data)

      // Отладочная информация
      console.log("Loaded billboards for category:", categorySlug, data)
    } catch (error) {
      console.error("Failed to load billboards:", error)
      setError("Не удалось загрузить билборды")
    } finally {
      setIsLoading(false)
    }
  }

  const openBillboardModal = (billboard: Billboard) => {
    setSelectedBillboard(billboard)
  }

  const closeBillboardModal = () => {
    setSelectedBillboard(null)
  }

  const handleCategoryChange = (categorySlug: string) => {
    setActiveCategory(categorySlug)
  }

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case "monitor":
        return <Monitor className="h-4 w-4" />
      case "bus":
        return <Bus className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  if (isLoading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Рекламные конструкции</h2>
              <p className="text-gray-600">Управление билбордами и рекламой на остановках</p>
            </div>
            <Button
              onClick={() => activeCategory && loadBillboards(activeCategory)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Обновить</span>
            </Button>
          </div>

          {/* Category Tabs */}
          {categories.length > 0 && (
            <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                {categories.map((category) => (
                  <TabsTrigger key={category.slug} value={category.slug} className="flex items-center space-x-2">
                    {getIconComponent(category.icon)}
                    <span>{category.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category.slug} value={category.slug} className="mt-6">
                  <CategoryContent
                    category={category}
                    billboards={billboards}
                    isLoading={isLoading}
                    error={error}
                    isUsingMockData={isUsingMockData}
                    onBillboardClick={openBillboardModal}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </motion.div>
      </section>

      {/* Billboard Detail Modal */}
      <BillboardModal billboard={selectedBillboard} onClose={closeBillboardModal} />
    </div>
  )
}

interface CategoryContentProps {
  category: Category
  billboards: Billboard[]
  isLoading: boolean
  error: string | null
  isUsingMockData: boolean
  onBillboardClick: (billboard: Billboard) => void
}

function CategoryContent({
  category,
  billboards,
  isLoading,
  error,
  isUsingMockData,
  onBillboardClick,
}: CategoryContentProps) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2" style={{ color: category.color }}>
          {category.name}
        </h3>
        <p className="text-gray-600">{category.description}</p>
      </div>

      {/* Error/Mock Data Warning */}
      {(error || isUsingMockData) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center space-x-3"
        >
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-medium">
              {isUsingMockData ? "Демонстрационный режим" : "Предупреждение"}
            </p>
            <p className="text-amber-700 text-sm">{error || "Показаны демонстрационные данные."}</p>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка {category.name.toLowerCase()}...</p>
        </div>
      ) : billboards.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">{category.icon === "bus" ? "🚌" : "📋"}</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет {category.name.toLowerCase()}</h3>
          <p className="text-gray-600">Данные не найдены или еще не добавлены</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {billboards.map((billboard, index) => (
            <BillboardCard
              key={billboard.id}
              billboard={billboard}
              index={index}
              onDetailsClick={() => onBillboardClick(billboard)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Функция для получения названия билборда из любого возможного поля
function getBillboardName(billboard: Billboard): string {
  // Safety check for billboard object
  if (!billboard) {
    return "Неизвестная конструкция"
  }

  // Проверяем все возможные поля для названия
  const possibleNameFields = ["title", "name", "billboard_name", "display_name", "label"]

  for (const field of possibleNameFields) {
    if (billboard[field] && typeof billboard[field] === "string" && billboard[field].trim()) {
      return billboard[field].trim()
    }
  }

  // Если ничего не найдено, показываем название категории + ID
  // Добавляем проверку на существование category_data
  const categoryName = billboard.category_data?.name || "Рекламная конструкция"
  const billboardId = billboard.id || "Unknown"
  return `${categoryName} #${billboardId}`
}

interface BillboardCardProps {
  billboard: Billboard
  index: number
  onDetailsClick: () => void
}

function BillboardCard({ billboard, index, onDetailsClick }: BillboardCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const controls = useAnimation()
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  useEffect(() => {
    if (inView) {
      controls.start("visible")
    }
  }, [controls, inView])

  const variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: index * 0.1,
        ease: "easeOut",
      },
    },
  }

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (billboard.images && billboard.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % billboard.images.length)
    }
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (billboard.images && billboard.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + billboard.images.length) % billboard.images.length)
    }
  }

  const setImageIndex = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    setCurrentImageIndex(index)
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

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case "monitor":
        return <Monitor className="h-4 w-4" />
      case "bus":
        return <Bus className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  // Используем placeholder если нет изображений
  const currentImage =
    billboard.images && billboard.images.length > 0
      ? billboard.images[currentImageIndex]
      : "/placeholder.svg?height=400&width=600"

  // Получаем название билборда с дополнительной проверкой
  const billboardName = getBillboardName(billboard)

  return (
    <motion.div ref={ref} initial="hidden" animate={controls} variants={variants}>
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Images Section */}
            <div className="md:w-1/2 relative">
              <div className="relative h-64 md:h-80">
                <Image
                  src={currentImage || "/placeholder.svg"}
                  alt={`${billboardName} - фото ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Category Badge */}
                <div
                  className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1"
                  style={{ borderLeft: `3px solid ${billboard.category_data?.color || "#3b82f6"}` }}
                >
                  {getIconComponent(billboard.category_data?.icon)}
                  <span className="text-xs font-medium">{billboard.category_data?.name || "Реклама"}</span>
                </div>

                {/* Image Navigation */}
                {billboard.images && billboard.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Image Indicators */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1 z-10">
                      {billboard.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => setImageIndex(e, idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? "bg-white" : "bg-white/50"
                            }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">{billboardName}</h3>
                  <Badge className={getStatusColor(billboard.status)}>{getStatusText(billboard.status)}</Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Ответственный</p>
                      <p className="font-medium">{billboard.employee || "Не указан"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Maximize2 className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Размер</p>
                      <p className="font-medium">{billboard.size || "Не указан"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Адрес</p>
                      <p className="font-medium">{billboard.address || "Не указан"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Период аренды</p>
                      <p className="font-medium">{billboard.period || "Не указан"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <Button variant="outline" className="w-full" onClick={onDetailsClick}>
                  Подробнее
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface BillboardModalProps {
  billboard: Billboard | null
  onClose: () => void
}

function BillboardModal({ billboard, onClose }: BillboardModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (billboard) {
      document.body.style.overflow = "hidden"
      setCurrentImageIndex(0)
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [billboard])

  if (!billboard) return null

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (billboard.images && billboard.images.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % billboard.images.length)
    }
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (billboard.images && billboard.images.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + billboard.images.length) % billboard.images.length)
    }
  }

  const setImageIndex = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    setCurrentImageIndex(index)
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

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case "monitor":
        return <Monitor className="h-6 w-6" />
      case "bus":
        return <Bus className="h-6 w-6" />
      default:
        return <Monitor className="h-6 w-6" />
    }
  }

  const currentImage =
    billboard.images && billboard.images.length > 0
      ? billboard.images[currentImageIndex]
      : "/placeholder.svg?height=400&width=600"

  // Получаем название билборда
  const billboardName = getBillboardName(billboard)

  return (
    <AnimatePresence>
      {billboard && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Modal - Full Screen */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto"
          >
            <div className="min-h-full p-6">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="fixed top-4 right-4 p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Content */}
              <div className="max-w-6xl mx-auto space-y-8 pt-16">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div style={{ color: billboard.category_data?.color || "#3b82f6" }}>
                      {getIconComponent(billboard.category_data?.icon)}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold">{billboardName}</h1>
                  </div>
                  <Badge className={`${getStatusColor(billboard.status)} text-lg px-4 py-2`}>
                    {getStatusText(billboard.status)}
                  </Badge>
                </div>

                {/* Images and Map Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Images */}
                  <div className="relative">
                    <div className="relative aspect-square rounded-3xl overflow-hidden shadow-lg">
                      <Image
                        src={currentImage || "/placeholder.svg"}
                        alt={`${billboardName} - фото ${currentImageIndex + 1}`}
                        fill
                        className="object-cover"
                      />

                      {/* Image Navigation */}
                      {billboard.images && billboard.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>

                          {/* Image Indicators */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                            {billboard.images.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => setImageIndex(e, idx)}
                                className={`w-3 h-3 rounded-full transition-colors ${idx === currentImageIndex ? "bg-white" : "bg-white/50"
                                  }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Yandex Map */}
                  <div className="aspect-square rounded-3xl overflow-hidden bg-gray-100 shadow-lg">
                    {billboard.location && (
                      <iframe
                        src={`https://yandex.ru/map-widget/v1/?ll=${billboard.location.lng}%2C${billboard.location.lat}&mode=search&ol=geo&ouri=ymapsbm1%3A%2F%2Fgeo%3Fdata%3DCgg1NjE1NzQwNhI%2F0KPQt9Cx0LXQutC40YHRgtCw0L0sINCi0LDRiNC60LXQvdGCLCDQvtC70LjQvNC%2F0LjQudGB0LrQuNC5INCy0LjQu9C%2B0Y%2FRgtGCIkEKBQAAAEAQBQAAAEAaJAoSCZOJhEBdUUFAEYOJhEBdUUFAEhIJk4mEQF1RQUARg4mEQF1RQUA%3D&z=16&pt=${billboard.location.lng},${billboard.location.lat},pm2rdm`}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`Яндекс карта расположения ${billboardName}`}
                      />
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="h-6 w-6 text-gray-500" />
                      <p className="text-sm text-gray-500 font-medium">Ответственный</p>
                    </div>
                    <p className="text-lg font-semibold">{billboard.employee || "Не указан"}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <Maximize2 className="h-6 w-6 text-gray-500" />
                      <p className="text-sm text-gray-500 font-medium">Размер</p>
                    </div>
                    <p className="text-lg font-semibold">{billboard.size || "Не указан"}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <MapPin className="h-6 w-6 text-gray-500" />
                      <p className="text-sm text-gray-500 font-medium">Адрес</p>
                    </div>
                    <p className="text-lg font-semibold">{billboard.address || "Не указан"}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <Calendar className="h-6 w-6 text-gray-500" />
                      <p className="text-sm text-gray-500 font-medium">Период аренды</p>
                    </div>
                    <p className="text-lg font-semibold">{billboard.period || "Не указан"}</p>
                  </div>
                </div>

                {/* Description */}
                {billboard.description && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-semibold mb-4">Описание</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">{billboard.description}</p>
                  </div>
                )}

                {/* Price */}
                {billboard.price && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8">
                    <h3 className="text-xl font-semibold mb-2 text-green-800">Стоимость аренды</h3>
                    <p className="text-3xl font-bold text-green-600">{billboard.price}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
