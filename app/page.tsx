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
  const [isFilterOpen, setIsFilterOpen] = useState(false) // New state for filter visibility

  // Filter states
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

  // Filter effect
  useEffect(() => {
    applyFilters()
  }, [billboards, searchQuery, selectedStatus, selectedEmployee])

  const loadDataFromApi = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("🚀 Starting data loading...")

      // Check API health
      const healthCheck = await apiService.checkApiHealth()
      setApiStatus(healthCheck)

      // Load categories and employees
      const [categoriesData, employeesData] = await Promise.all([apiService.getCategories(), apiService.getEmployees()])

      if (!categoriesData || categoriesData.length === 0) {
        throw new Error("Failed to load categories")
      }

      setCategories(categoriesData)
      setEmployees(employeesData)
      console.log("📂 Categories loaded:", categoriesData)

      // Set the first category as active
      if (categoriesData.length > 0) {
        setActiveCategory(categoriesData[0].slug)
      }

      // Handle API unavailable case
      if (healthCheck.status === "error") {
        setError("API unavailable, displaying demo data")
      } else {
        setError(null)
      }
    } catch (error) {
      console.error("❌ Error loading data:", error)
      setError(`Error: ${error}`)
      setApiStatus({ status: "error", message: String(error) })

      // Fallback to mock data
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

      console.log(`📋 Loading billboards for category: ${categorySlug}, page: ${page}`)

      const { billboards: billboardsArray, nextPage, totalCount } = await apiService.getBillboards({
        category: categorySlug,
        page: page,
      })

      setBillboards(page === 1 ? billboardsArray : [...billboards, ...billboardsArray])
      setNextPage(nextPage)
      setTotalCount(totalCount)

      console.log(`✅ Successfully loaded ${billboardsArray.length} billboards for category ${categorySlug}`)
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

    // Search filter
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

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((billboard) => billboard.status === selectedStatus)
    }

    // Employee filter
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

  const handleCategoryChange = (categorySlug: string) => {
    setActiveCategory(categorySlug)
    clearAllFilters()
  }

  const handleRefresh = () => {
    console.log("🔄 Refreshing data...")
    loadDataFromApi()
  }

  const toggleFilter = () => {
    setIsFilterOpen((prev) => !prev)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading data from API...</p>
          <p className="text-sm text-gray-500 mt-2">api.location.utu-ranch.uz</p>
          {apiStatus && <p className="text-xs text-gray-400 mt-1">Status: {apiStatus.message}</p>}
        </div>
      </div>
    )
  }

  if (error && categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <WifiOff className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">API Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header with Filters */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          {/* Title, Refresh, and Filter Toggle */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Advertising Structures</h1>
              <p className="text-gray-600">Manage billboards and bus stops</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="flex items-center space-x-2 bg-transparent"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
              <Button
                onClick={toggleFilter}
                variant="outline"
                className="flex items-center space-x-2 bg-transparent"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {isFilterOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* API Status */}
          {apiStatus?.status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3"
            >
              <WifiOff className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-medium">API Unavailable</p>
                <p className="text-yellow-700 text-sm">Displaying demo data. {apiStatus.message}</p>
              </div>
            </motion.div>
          )}

          {/* Collapsible Filters Section */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
                // Optional: Uncomment for hover support
                // onMouseEnter={() => setIsFilterOpen(true)}
                // onMouseLeave={() => setIsFilterOpen(false)}
              >
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Filter className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Filters and Search</h3>
                      {getActiveFiltersCount() > 0 && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {getActiveFiltersCount()} active
                        </Badge>
                      )}
                    </div>
                    {getActiveFiltersCount() > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <Search className="h-4 w-4 text-gray-500" />
                        <span>Search</span>
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by title, address..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-gray-500" />
                        <span>Status</span>
                      </label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <div className="flex items-center space-x-2">
                              <Filter className="h-4 w-4 text-gray-500" />
                              <span>All statuses</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="active">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>Active</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="pending">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-yellow-500" />
                              <span>Pending</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="expired">
                            <div className="flex items-center space-x-2">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span>Expired</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="maintenance">
                            <div className="flex items-center space-x-2">
                              <Settings className="h-4 w-4 text-blue-500" />
                              <span>Maintenance</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Employee Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>Responsible</span>
                      </label>
                      <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger className="bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span>All employees</span>
                            </div>
                          </SelectItem>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>{employee.full_name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Results Counter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Results</label>
                      <div className="bg-white border border-gray-200 rounded-md px-3 py-2 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{filteredBillboards.length}</div>
                          <div className="text-xs text-gray-500">of {billboards.length}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {getActiveFiltersCount() > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-gray-600">Active filters:</span>
                        {searchQuery.trim() && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                            onClick={() => setSearchQuery("")}
                          >
                            Search: "{searchQuery}"
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        )}
                        {selectedStatus !== "all" && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                            onClick={() => setSelectedStatus("all")}
                          >
                            {getStatusIcon(selectedStatus)}
                            <span className="ml-1">
                              {selectedStatus === "active" && "Active"}
                              {selectedStatus === "pending" && "Pending"}
                              {selectedStatus === "expired" && "Expired"}
                              {selectedStatus === "maintenance" && "Maintenance"}
                            </span>
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        )}
                        {selectedEmployee !== "all" && (
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
                            onClick={() => setSelectedEmployee("all")}
                          >
                            <User className="h-3 w-3 mr-1" />
                            {employees.find((emp) => emp.id.toString() === selectedEmployee)?.full_name}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Tabs */}
          {categories.length > 0 && (
            <div className="mt-6">
              <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3 gap-2 bg-white">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.slug}
                      value={category.slug}
                      className="flex items-center space-x-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                    >
                      {getIconComponent(category.icon)}
                      <span>{category.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          {categories.length > 0 && (
            <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full">
              {categories.map((category) => (
                <TabsContent key={category.slug} value={category.slug} className="mt-0">
                  <CategoryContent
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

// CategoryContent component
interface CategoryContentProps {
  category: Category
  billboards: Billboard[]
  allBillboards: Billboard[]
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  onBillboardClick: (billboard: Billboard) => void
  onLoadMore: () => void
  hasMore: boolean
  totalCount: number
  isFiltered: boolean
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
}: CategoryContentProps) {
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2" style={{ color: category.color }}>
          {category.name}
        </h3>
        <p className="text-gray-600">{category.description}</p>
        <div className="flex items-center space-x-4 mt-2">
          <p className="text-sm text-gray-500">
            {isFiltered ? (
              <>
                Found: <span className="font-medium text-blue-600">{billboards.length}</span> of{" "}
                <span className="font-medium">{allBillboards.length}</span> loaded
              </>
            ) : (
              <>
                Shown: <span className="font-medium">{allBillboards.length}</span>
                {totalCount > allBillboards.length && (
                  <>
                    {" "}
                    of <span className="font-medium">{totalCount}</span>
                  </>
                )}
              </>
            )}
          </p>
          {isFiltered && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Filter className="h-3 w-3 mr-1" />
              Filters active
            </Badge>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3"
        >
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Loading Error</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="text-center py-16">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading {category.name.toLowerCase()} from API...</p>
        </div>
      ) : billboards.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">{category.icon === "bus" ? "🚌" : "📋"}</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {isFiltered ? "Nothing found" : `No ${category.name.toLowerCase()}`}
          </h3>
          <p className="text-gray-600">
            {isFiltered
              ? "Try changing search parameters or clearing filters"
              : "API returned no data for this category or it hasn't been added yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {billboards.map((billboard, index) => (
              <BillboardCard
                key={billboard.id}
                billboard={billboard}
                index={index}
                onDetailsClick={() => onBillboardClick(billboard)}
              />
            ))}
          </div>

          {/* Load More Button */}
          {!isFiltered && hasMore && allBillboards.length > 0 && (
            <div className="mt-10 text-center">
              <Button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                size="lg"
                className="px-8 py-6 text-lg bg-transparent"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-5 w-5 mr-2" />
                    Load More
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-2">Shown {allBillboards.length}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Helper function to get billboard name
function getBillboardName(billboard: Billboard): string {
  if (!billboard) {
    return "Unknown structure"
  }

  if (billboard.title && billboard.title.trim()) {
    return billboard.title.trim()
  }

  const categoryName = billboard.category_data?.name || "Advertising structure"
  return `${categoryName} #${billboard.id}`
}

// BillboardCard component
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
        return "Active"
      case "pending":
        return "Pending"
      case "expired":
        return "Expired"
      case "maintenance":
        return "Maintenance"
      default:
        return "Unknown"
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

  const currentImage =
    billboard.images && billboard.images.length > 0
      ? billboard.images[currentImageIndex]
      : "/placeholder.svg?height=400&width=600"

  const billboardName = getBillboardName(billboard)

  return (
    <motion.div ref={ref} initial="hidden" animate={controls} variants={variants} className="h-full">
      <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white h-full">
        <CardContent className="p-0 h-full">
          <div className="flex flex-col md:flex-row h-full">
            {/* Images Section */}
            <div className="md:w-1/2 relative">
              <div className="relative h-64 md:h-80">
                <Image
                  src={currentImage}
                  alt={`${billboardName} - photo ${currentImageIndex + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Category Badge */}
                <div
                  className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1"
                  style={{ borderLeft: `3px solid ${billboard.category_data?.color || "#3b82f6"}` }}
                >
                  {getIconComponent(billboard.category_data?.icon)}
                  <span className="text-xs font-medium">{billboard.category_data?.name || "Advertising"}</span>
                </div>

                {/* API Badge */}
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full px-2 py-1">
                  <span className="text-xs font-medium">API</span>
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
            <div className="md:w-1/2 p-6 flex flex-col justify-between h-full">
              <div className="space-y-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-h-[3.5rem]">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight">{billboardName}</h3>
                  </div>
                  <Badge className={`${getStatusColor(billboard.status)} shrink-0 ml-2`}>
                    {getStatusText(billboard.status)}
                  </Badge>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Responsible</p>
                      <p className="font-medium truncate">{billboard.employee_name || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Maximize2 className="h-5 w-5 text-gray-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Size (HxW)</p>
                      <p className="font-medium truncate">{billboard.size || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium line-clamp-2 text-sm leading-tight">
                        {billboard.address || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-500">Rental Period</p>
                      <p className="font-medium truncate text-sm">{billboard.period || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 shrink-0">
                <Button variant="outline" className="w-full bg-transparent" onClick={onDetailsClick}>
                  Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// BillboardModal component
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
        return "Active"
      case "pending":
        return "Pending"
      case "expired":
        return "Expired"
      case "maintenance":
        return "Maintenance"
      default:
        return "Unknown"
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
                    <Badge className="bg-green-100 text-green-800">Loaded from API</Badge>
                  </div>
                  <Badge className={`${getStatusColor(billboard.status)} text-lg px-4 py-2`}>
                    {getStatusText(billboard.status)}
                  </Badge>
                </div>

                {/* Contractor Card */}
                {billboard.contractor_data && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Building2 className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-blue-900 mb-2">{billboard.contractor_data.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {billboard.contractor_data.contact_person && (
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-800">{billboard.contractor_data.contact_person}</span>
                            </div>
                          )}
                          {billboard.contractor_data.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-800">{billboard.contractor_data.phone}</span>
                            </div>
                          )}
                          {billboard.contractor_data.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-800">{billboard.contractor_data.email}</span>
                            </div>
                          )}
                          {billboard.contractor_data.contract_number && (
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-800">
                                Contract: {billboard.contractor_data.contract_number}
                              </span>
                            </div>
                          )}
                        </div>
                        {billboard.contractor_data.address && (
                          <div className="mt-3 flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                            <span className="text-blue-800">{billboard.contractor_data.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Images and Map Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Images */}
                  <div className="relative">
                    <div className="relative aspect-square rounded-3xl overflow-hidden shadow-lg">
                      <Image
                        src={currentImage}
                        alt={`${billboardName} - photo ${currentImageIndex + 1}`}
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
                                className={`w-3 h-3 rounded-full transition-colors ${
                                  idx === currentImageIndex ? "bg-white" : "bg-white/50"
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
                        title={`Yandex Map for ${billboardName}`}
                      />
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="h-6 w-6 text-gray-500" />
                      <p className="text-sm text-gray-500 font-medium">Responsible</p>
                    </div>
                    <p className="text-lg font-semibold">{billboard.employee_name || "Not specified"}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <Maximize2 className="h-6 w-6 text-gray-500" />
                      <p className="text-sm text-gray-500 font-medium">Size (HxW)</p>
                    </div>
                    <p className="text-lg font-semibold">{billboard.size || "Not specified"}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <MapPin className="h-6 w-6 text-gray-500" />
                      <p className="text-sm text-gray-500 font-medium">Address</p>
                    </div>
                    <p className="text-lg font-semibold">{billboard.address || "Not specified"}</p>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <Calendar className="h-6 w-6 text-gray-500" />
                      <p className="text-sm text-gray-500 font-medium">Rental Period</p>
                    </div>
                    <p className="text-lg font-semibold">{billboard.period || "Not specified"}</p>
                  </div>
                </div>

                {/* Description */}
                {billboard.description && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-8">
                    <h3 className="text-2xl font-semibold mb-4">Description</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">{billboard.description}</p>
                  </div>
                )}

                {/* Price */}
                {billboard.price && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8">
                    <h3 className="text-xl font-semibold mb-2 text-green-800">Rental Cost</h3>
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