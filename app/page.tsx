"use client"

import React, { useState, useEffect } from "react"
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
  WifiOff,
  Loader2,
  ChevronDown,
  ChevronUp,
  Building2,
  Phone,
  Mail,
  FileText,
  Filter,
  Search,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiService, type Billboard, type Category } from "@/lib/api"

// Dashboard component
export default function Dashboard() {
  const [billboards, setBillboards] = useState<Billboard[]>([])
  const [filteredBillboards, setFilteredBillboards] = useState<Billboard[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedBillboard, setSelectedBillboard] = useState<Billboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("")
  const [apiStatus, setApiStatus] = useState<{ status: string; message: string } | null>(null)
  const [nextPage, setNextPage] = useState<number | null>(null)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all")
  const [employees, setEmployees] = useState<Array<{ id: number; full_name: string; email: string }>>([])

  useEffect(() => {
    loadDataFromApi()
  }, [])

  useEffect(() => {
    if (activeCategory) {
      loadBillboards(activeCategory)
    }
  }, [activeCategory])

  useEffect(() => {
    applyFilters()
  }, [billboards, searchQuery, selectedStatus, selectedEmployee])

  const loadDataFromApi = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const healthCheck = await apiService.checkApiHealth()
      setApiStatus(healthCheck)
      const [categoriesData, employeesData] = await Promise.all([apiService.getCategories(), apiService.getEmployees()])

      if (!categoriesData || categoriesData.length === 0) {
        throw new Error("Failed to load categories")
      }

      setCategories(categoriesData)
      setEmployees(employeesData)
      if (categoriesData.length > 0) {
        setActiveCategory(categoriesData[0].slug)
      }

      if (healthCheck.status === "error") {
        setError("API unavailable, displaying demo data")
      }
    } catch (error) {
      console.error("❌ Error loading data:", error)
      setError(`Error: ${error}`)
      setApiStatus({ status: "error", message: String(error) })
      try {
        const mockCategories = await apiService.getCategories()
        setCategories(mockCategories)
        if (mockCategories.length > 0) {
          setActiveCategory(mockCategories[0].slug)
        }
      } catch (mockError) {
        console.error("❌ Failed to load mock data:", mockError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadBillboards = async (categorySlug: string, page = 1) => {
    try {
      if (page === 1) {
        setIsLoading(true)
        setBillboards([])
      } else {
        setIsLoadingMore(true)
      }

      const { billboards: billboardsArray, nextPage, totalCount } = await apiService.getBillboards({
        category: categorySlug,
        page: page,
      })

      setBillboards(page === 1 ? billboardsArray : [...billboards, ...billboardsArray])
      setNextPage(nextPage)
      setTotalCount(totalCount)
    } catch (error) {
      console.error("❌ Error loading billboards:", error)
      setError(`Failed to load billboards: ${error}`)
      if (page === 1) {
        setBillboards([])
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...billboards]
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (billboard) =>
          billboard.title?.toLowerCase().includes(query) ||
          billboard.address?.toLowerCase().includes(query) ||
          billboard.employee_name?.toLowerCase().includes(query) ||
          billboard.description?.toLowerCase().includes(query),
      )
    }
    if (selectedStatus !== "all") {
      filtered = filtered.filter((billboard) => billboard.status === selectedStatus)
    }
    if (selectedEmployee !== "all") {
      filtered = filtered.filter((billboard) => billboard.employee_id?.toString() === selectedEmployee)
    }
    setFilteredBillboards(filtered)
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedStatus("all")
    setSelectedEmployee("all")
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (searchQuery.trim()) count++
    if (selectedStatus !== "all") count++
    if (selectedEmployee !== "all") count++
    return count
  }

  const loadMoreBillboards = () => {
    if (nextPage && activeCategory) {
      loadBillboards(activeCategory, nextPage)
    }
  }

  const openBillboardModal = (billboard: Billboard) => {
    setSelectedBillboard(billboard)
  }

  const closeBillboardModal = () => {
    setSelectedBillboard(null)
  }

  const handleRefresh = () => {
    if (activeCategory) {
      loadBillboards(activeCategory)
    }
  }

  const handleCategoryChange = (value: string) => {
    setActiveCategory(value)
  }

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen)
  }

  const getBillboardIcon = (iconName?: string) => {
    switch (iconName) {
      case "monitor":
        return <Monitor className="h-4 w-4" />
      case "bus":
        return <Bus className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "expired":
        return <XCircle className="h-4 w-4" />
      case "maintenance":
        return <Settings className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  if (isLoading && categories.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-slate-900 mx-auto mb-4 opacity-20" />
          <p className="text-slate-400 font-medium tracking-tight">Syncing with GLI Infrastructure</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Inventory Management</p>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter">
                Structures
              </h1>
              <p className="text-slate-500 font-medium">Monitoring GLI advertising assets in real-time</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="h-11 px-5 flex items-center justify-center space-x-2 bg-white shadow-sm border-slate-200 hover:border-slate-300 rounded-xl transition-all active:scale-95"
              >
                <RefreshCw className="h-4 w-4 text-slate-600" />
                <span className="font-semibold text-slate-700">Refresh</span>
              </Button>
              <Button
                onClick={toggleFilter}
                variant="outline"
                className={`h-11 px-5 flex items-center justify-center space-x-2 rounded-xl transition-all active:scale-95 ${
                  isFilterOpen ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-800" : "bg-white shadow-sm border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="font-semibold">Filters</span>
                {isFilterOpen ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-200/60 mb-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Search Assets</label>
                      <div className="relative group">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <Input
                          placeholder="Search by ID or address..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-12 pl-11 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-900/5 focus:border-slate-400 transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asset Status</label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-900/5 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Responsible</label>
                      <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger className="h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-900/5 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200">
                          <SelectItem value="all">Everyone</SelectItem>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>{emp.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-end">
                      <Button 
                        variant="ghost" 
                        onClick={clearAllFilters}
                        className="h-12 w-full rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-semibold"
                      >
                        Reset All
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((category) => (
                <button
                  key={category.slug}
                  onClick={() => handleCategoryChange(category.slug)}
                  className={`h-11 px-6 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 border-2 ${
                    activeCategory === category.slug
                      ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200 scale-105"
                      : "bg-white text-slate-500 border-slate-100 hover:border-slate-200 hover:text-slate-700"
                  }`}
                >
                  {getBillboardIcon(category.icon)}
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="container mx-auto px-4 py-12 md:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {categories.map((category) => (
            activeCategory === category.slug && (
              <CategoryContent
                key={category.slug}
                category={category}
                billboards={filteredBillboards}
                allBillboards={billboards}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                error={error}
                onBillboardClick={openBillboardModal}
                onLoadMore={loadMoreBillboards}
                hasMore={nextPage !== null}
                totalCount={totalCount}
                isFiltered={getActiveFiltersCount() > 0}
              />
            )
          ))}
        </motion.div>
      </section>

      <BillboardModal billboard={selectedBillboard} onClose={closeBillboardModal} />
    </div>
  )
}

function CategoryContent({
  category,
  billboards,
  allBillboards,
  isLoading,
  isLoadingMore,
  error,
  onBillboardClick,
  onLoadMore,
  hasMore,
  totalCount,
  isFiltered,
}: any) {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{category.name}</h2>
          <p className="text-slate-500 max-w-2xl font-medium leading-relaxed">{category.description}</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm self-start">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            {isFiltered ? `${billboards.length} Result Found` : `${totalCount || billboards.length} Assets Registered`}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[400px] bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : billboards.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="text-6xl mb-6 grayscale opacity-20">📦</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Assets Found</h3>
          <p className="text-slate-500 max-w-xs mx-auto">Try refining your filters or search query to find what you're looking for.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {billboards.map((billboard: any, index: number) => (
            <BillboardCard
              key={billboard.id}
              billboard={billboard}
              index={index}
              onDetailsClick={() => onBillboardClick(billboard)}
            />
          ))}
        </div>
      )}

      {!isFiltered && hasMore && (
        <div className="pt-10 text-center">
          <Button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            variant="outline"
            className="h-14 px-10 text-lg font-bold rounded-2xl bg-white border-slate-200 shadow-sm hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all group"
          >
            {isLoadingMore ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                Load More Assets
                <ChevronDown className="h-5 w-5 ml-2 group-hover:translate-y-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

function BillboardCard({ billboard, index, onDetailsClick }: any) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 })

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500"
      case "pending": return "bg-amber-500"
      case "expired": return "bg-rose-500"
      case "maintenance": return "bg-sky-500"
      default: return "bg-slate-500"
    }
  }

  const billboardName = billboard.title || `${billboard.category_data?.name || "Asset"} #${billboard.id}`
  const currentImage = billboard.images?.[currentImageIndex] || "/placeholder.svg"

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group h-full"
    >
      <Card className="h-full overflow-hidden border border-slate-200/60 rounded-[2.5rem] bg-white hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2">
        <CardContent className="p-0 h-full flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-1/2 h-72 sm:h-auto overflow-hidden">
            <Image
              src={currentImage}
              alt={billboardName}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60" />
            
            <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
              <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-1.5 pointer-events-auto">
                <div className={`w-2 h-2 rounded-full ${getStatusStyle(billboard.status)} animate-pulse`} />
                {billboard.status}
              </div>
              <div className="px-3 py-1.5 bg-slate-900/40 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-widest pointer-events-auto">
                ID: {billboard.id}
              </div>
            </div>

            {billboard.images && billboard.images.length > 1 && (
              <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-1.5 px-5">
                {billboard.images.slice(0, 5).map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx) }}
                    className={`transition-all duration-300 h-1.5 rounded-full shadow-sm ${
                      idx === currentImageIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="w-full sm:w-1/2 p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                  {billboard.category_data?.name || "Asset"}
                </p>
                <h3 className="text-2xl font-black text-slate-900 leading-[1.1] tracking-tight group-hover:text-slate-700 transition-colors line-clamp-2">
                  {billboardName}
                </h3>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900 transition-all">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 line-clamp-2 leading-snug">{billboard.address || "Not specified"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900 transition-all">
                    <Maximize2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">{billboard.size || "Not specified"}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-50">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rate</p>
                <p className="text-lg font-black text-slate-900 tracking-tight">{billboard.price || "N/A"}</p>
              </div>
              <Button 
                onClick={onDetailsClick}
                className="h-12 px-6 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all active:scale-95"
              >
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function BillboardModal({ billboard, onClose }: any) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<"details" | "map">("details")

  useEffect(() => {
    if (billboard) {
      document.body.style.overflow = "hidden"
      setCurrentImageIndex(0)
      setActiveTab("details")
    } else {
      document.body.style.overflow = "unset"
    }
  }, [billboard])

  if (!billboard) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
      case "pending": return "bg-amber-500/10 text-amber-600 border-amber-500/20"
      case "expired": return "bg-rose-500/10 text-rose-600 border-rose-500/20"
      case "maintenance": return "bg-sky-500/10 text-sky-600 border-sky-500/20"
      default: return "bg-slate-500/10 text-slate-600 border-slate-500/20"
    }
  }

  const billboardName = billboard.title || `${billboard.category_data?.name || "Asset"} #${billboard.id}`
  const currentImage = billboard.images?.[currentImageIndex] || "/placeholder.svg"

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl"
          onClick={onClose}
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-[1400px] h-full sm:h-auto sm:max-h-[90vh] bg-white sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white border border-white/20 transition-all hover:rotate-90 active:scale-90"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="w-full md:w-3/5 lg:w-2/3 bg-slate-950 relative min-h-[350px] md:min-h-0 overflow-hidden group">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab === "details" ? currentImageIndex : "map"}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {activeTab === "details" ? (
                  <>
                    <Image src={currentImage} alt={billboardName} fill className="object-cover" priority />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-slate-900">
                    <iframe
                      src={`https://yandex.ru/map-widget/v1/?ll=${billboard.location.lng}%2C${billboard.location.lat}&z=16&pt=${billboard.location.lng},${billboard.location.lat},pm2rdm`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      title="Asset Location"
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {activeTab === "details" && billboard.images?.length > 1 && (
              <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-10 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={() => setCurrentImageIndex(prev => (prev - 1 + billboard.images.length) % billboard.images.length)}
                  className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white border border-white/10 transition-all hover:-translate-x-2"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <div className="flex gap-2">
                  {billboard.images.map((_: any, idx: number) => (
                    <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentImageIndex ? "w-10 bg-white" : "w-2 bg-white/30"}`} />
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentImageIndex(prev => (prev + 1) % billboard.images.length)}
                  className="p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white border border-white/10 transition-all hover:translate-x-2"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </div>
            )}

            <div className="absolute top-10 left-10 z-10 p-1.5 bg-slate-950/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl flex gap-1">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === "details" ? "bg-white text-slate-950 shadow-xl scale-105" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Gallery
              </button>
              <button
                onClick={() => setActiveTab("map")}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === "map" ? "bg-white text-slate-950 shadow-xl scale-105" : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                Location
              </button>
            </div>
          </div>

          <div className="w-full md:w-2/5 lg:w-1/3 flex flex-col h-full bg-white overflow-hidden">
            <div className="p-10 pt-16 flex-1 overflow-y-auto no-scrollbar space-y-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`${getStatusColor(billboard.status)} rounded-full border px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm`}>
                    {billboard.status}
                  </Badge>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">ID: {billboard.id}</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.05] tracking-tight">
                  {billboardName}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {[
                  { icon: MapPin, label: "Address", value: billboard.address, color: "bg-indigo-50 text-indigo-600" },
                  { icon: Maximize2, label: "Size (HxW)", value: billboard.size, color: "bg-emerald-50 text-emerald-600" },
                  { icon: Calendar, label: "Term", value: billboard.period, color: "bg-amber-50 text-amber-600" },
                  { icon: User, label: "Contact", value: billboard.employee_name, color: "bg-rose-50 text-rose-600" }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-5 group">
                    <div className={`mt-1 p-3.5 rounded-[1.25rem] ${item.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</p>
                      <p className="text-lg font-bold text-slate-900 leading-snug">{item.value || "Not Specified"}</p>
                    </div>
                  </div>
                ))}
              </div>

              {billboard.description && (
                <div className="space-y-4 pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Description</p>
                  <p className="text-slate-600 leading-relaxed font-medium">
                    {billboard.description}
                  </p>
                </div>
              )}

              {billboard.contractor_data && (
                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-900">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contractor</p>
                    <p className="text-lg font-black text-slate-900">{billboard.contractor_data.name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory Rate</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{billboard.price || "N/A"}</p>
              </div>
              <Button className="h-16 px-10 bg-slate-900 text-white rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all hover:-translate-y-1 active:scale-95">
                Book Asset
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
