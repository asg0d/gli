"use client"

import { useState, useEffect } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import Image from "next/image"
import { MapPin, Calendar, User, Maximize2, ChevronLeft, ChevronRight, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { apiService, type Billboard } from "@/lib/api"

export default function Dashboard() {
  const [billboards, setBillboards] = useState<Billboard[]>([])
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadBillboards()
  }, [])

  const loadBillboards = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await apiService.getBillboards()
      setBillboards(data)
    } catch (error) {
      console.error("Failed to load billboards:", error)
      setError("Не удалось загрузить данные о билбордах")
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка билбордов...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadBillboards} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Попробовать снова</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Билборды Live
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Billboards Grid */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h2 className="text-3xl font-bold mb-2">Размещённые билборды</h2>
            <p className="text-gray-600">Актуальная информация о всех рекламных конструкциях</p>
          </div>
          <Button onClick={loadBillboards} variant="outline" className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Обновить</span>
          </Button>
        </motion.div>

        {billboards.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет билбордов</h3>
            <p className="text-gray-600">Билборды не найдены или еще не добавлены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {billboards.map((billboard, index) => (
              <BillboardCard
                key={billboard.id}
                billboard={billboard}
                index={index}
                onDetailsClick={() => openBillboardModal(billboard)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Billboard Detail Modal */}
      <BillboardModal billboard={selectedBillboard} onClose={closeBillboardModal} />
    </div>
  )
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

  const nextImage = () => {
    if (billboard.images && billboard.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % billboard.images.length)
    }
  }

  const prevImage = () => {
    if (billboard.images && billboard.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + billboard.images.length) % billboard.images.length)
    }
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

  // Используем placeholder если нет изображений
  const currentImage =
    billboard.images && billboard.images.length > 0
      ? billboard.images[currentImageIndex]
      : "/placeholder.svg?height=400&width=600"

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
                  alt={`Билборд ${billboard.id} - фото ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Image Navigation */}
                {billboard.images && billboard.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Image Indicators */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                      {billboard.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentImageIndex ? "bg-white" : "bg-white/50"
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
                  <h3 className="text-xl font-bold text-gray-900">{billboard.title || `Билборд #${billboard.id}`}</h3>
                  <Badge className={getStatusColor(billboard.status)}>{getStatusText(billboard.status)}</Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Ответственный</p>
                      <p className="font-medium">{billboard.employee}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Maximize2 className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Размер</p>
                      <p className="font-medium">{billboard.size}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Адрес</p>
                      <p className="font-medium">{billboard.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Период аренды</p>
                      <p className="font-medium">{billboard.period}</p>
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

  const nextImage = () => {
    if (billboard.images && billboard.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % billboard.images.length)
    }
  }

  const prevImage = () => {
    if (billboard.images && billboard.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + billboard.images.length) % billboard.images.length)
    }
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

  const currentImage =
    billboard.images && billboard.images.length > 0
      ? billboard.images[currentImageIndex]
      : "/placeholder.svg?height=400&width=600"

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

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Handle */}
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-bold">{billboard.title || `Билборд #${billboard.id}`}</h2>
                  <Badge className={getStatusColor(billboard.status)}>{getStatusText(billboard.status)}</Badge>
                </div>

                {/* Images and Map Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Images */}
                  <div className="relative">
                    <div className="relative aspect-square rounded-2xl overflow-hidden">
                      <Image
                        src={currentImage || "/placeholder.svg"}
                        alt={`Билборд ${billboard.id} - фото ${currentImageIndex + 1}`}
                        fill
                        className="object-cover"
                      />

                      {/* Image Navigation */}
                      {billboard.images && billboard.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>

                          {/* Image Indicators */}
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                            {billboard.images.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setCurrentImageIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  idx === currentImageIndex ? "bg-white" : "bg-white/50"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Map */}
                  <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${billboard.location.lng - 0.01},${billboard.location.lat - 0.01},${billboard.location.lng + 0.01},${billboard.location.lat + 0.01}&layer=mapnik&marker=${billboard.location.lat},${billboard.location.lng}`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Карта расположения билборда ${billboard.id}`}
                    />
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Ответственный</p>
                        <p className="font-medium">{billboard.employee}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Maximize2 className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Размер</p>
                        <p className="font-medium">{billboard.size}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Адрес</p>
                        <p className="font-medium">{billboard.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Период аренды</p>
                        <p className="font-medium">{billboard.period}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {billboard.description && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Описание</h3>
                    <p className="text-gray-600">{billboard.description}</p>
                  </div>
                )}

                {/* Price */}
                {billboard.price && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Стоимость аренды</p>
                    <p className="text-2xl font-bold text-green-600">{billboard.price}</p>
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
