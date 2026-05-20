export type Role = 'ADMIN' | 'CUSTOMER'

export type MealCategory =
  | 'HIGH_PROTEIN'
  | 'LOW_CALORIE'
  | 'HIGH_FIBRE'
  | 'VEGETARIAN'
  | 'BALANCED'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export interface Meal {
  id: string
  name: string
  desc: string
  emoji: string
  cal: number
  pro: number
  carb: number
  fat: number
  fib: number
  sod: number
  price: number
  cat: MealCategory
  badge: string | null
  active: boolean
  weekId: string
  createdAt: string
}

export interface Week {
  id: string
  weekNum: number
  startDate: string
  active: boolean
  createdAt: string
}

export interface OrderItem {
  id: string
  mealId: string
  meal: Meal
  qty: number
  unitPrice: number
  linePrice: number
}

export interface Order {
  id: string
  userId: string
  weekId: string
  week: Week
  items: OrderItem[]
  subtotal: number
  delivery: number
  total: number
  totalCal: number
  totalPro: number
  totalCarb: number
  totalFat: number
  totalFib: number
  totalSod: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
  user?: { name: string; email: string }
}

export interface EatenItem {
  id: string
  mealId: string
  meal: Meal
  qty: number
}

export interface EatenLog {
  id: string
  userId: string
  weekNum: number
  day: DayOfWeek
  items: EatenItem[]
  createdAt: string
  updatedAt: string
}

export interface MacroTotals {
  cal: number
  pro: number
  carb: number
  fat: number
  fib: number
  sod: number
}

export interface DaySummary extends MacroTotals {
  day: DayOfWeek
  mealCount: number
}

export interface AdminStats {
  totalOrders: number
  weekOrders: number
  totalUsers: number
  totalMeals: number
  totalRevenue: number
  weekRevenue: number
  statusCounts: Record<OrderStatus, number>
  activeWeek: Week | null
}

export interface CartTotals extends MacroTotals {
  count: number
  price: number
}
