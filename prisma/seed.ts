import { PrismaClient, MealCategory } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Clean up existing data
  await prisma.eatenItem.deleteMany()
  await prisma.eatenLog.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.meal.deleteMany()
  await prisma.week.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@kimskitchen.com', password: adminPassword, role: 'ADMIN' },
  })

  await prisma.user.create({
    data: { name: 'Jane Doe', email: 'jane@example.com', password: userPassword, role: 'CUSTOMER' },
  })

  // Create active week
  const week = await prisma.week.create({
    data: { weekNum: 21, startDate: new Date('2026-05-19'), active: true },
  })

  // Create meals
  const mealsData = [
    { name: 'Grilled Salmon Bowl',      desc: 'Wild salmon, quinoa, avocado, sesame',            emoji: '🐟', cal: 520, pro: 42, carb: 38, fat: 18, fib: 7,  sod: 420,  price: 1150, cat: MealCategory.HIGH_PROTEIN, badge: 'Popular' },
    { name: 'Chicken & Sweet Potato',   desc: 'Herb-roasted chicken, sweet potato mash, greens', emoji: '🍗', cal: 480, pro: 38, carb: 45, fat: 10, fib: 9,  sod: 380,  price: 950,  cat: MealCategory.HIGH_PROTEIN, badge: null },
    { name: 'Vegan Buddha Bowl',        desc: 'Roasted chickpeas, brown rice, tahini dressing',  emoji: '🥗', cal: 390, pro: 18, carb: 58, fat: 11, fib: 14, sod: 310,  price: 850,  cat: MealCategory.VEGETARIAN,   badge: 'New' },
    { name: 'Beef Stir-Fry & Rice',     desc: 'Lean beef, jasmine rice, stir-fry vegetables',    emoji: '🥩', cal: 560, pro: 44, carb: 52, fat: 16, fib: 6,  sod: 640,  price: 1050, cat: MealCategory.HIGH_PROTEIN, badge: null },
    { name: 'Lentil Soup & Bread',      desc: 'Red lentil soup with whole-grain bread',           emoji: '🍲', cal: 340, pro: 20, carb: 52, fat: 4,  fib: 16, sod: 480,  price: 750,  cat: MealCategory.HIGH_FIBRE,   badge: null },
    { name: 'Turkey Meatballs & Pasta', desc: 'Lean turkey meatballs, whole wheat pasta',         emoji: '🍝', cal: 510, pro: 36, carb: 62, fat: 9,  fib: 8,  sod: 520,  price: 980,  cat: MealCategory.BALANCED,     badge: null },
    { name: 'Tuna Nicoise Salad',       desc: 'Tuna, eggs, green beans, olives, dijon',          emoji: '🥙', cal: 310, pro: 32, carb: 18, fat: 12, fib: 5,  sod: 560,  price: 900,  cat: MealCategory.LOW_CALORIE,  badge: 'New' },
    { name: 'Oat & Berry Porridge',     desc: 'Steel-cut oats, mixed berries, chia seeds',       emoji: '🫐', cal: 280, pro: 10, carb: 48, fat: 5,  fib: 12, sod: 80,   price: 600,  cat: MealCategory.HIGH_FIBRE,   badge: null },
    { name: 'Grilled Chicken Wrap',     desc: 'Chicken breast, whole-wheat wrap, hummus',        emoji: '🌯', cal: 420, pro: 34, carb: 42, fat: 9,  fib: 7,  sod: 440,  price: 850,  cat: MealCategory.BALANCED,     badge: null },
    { name: 'Prawn & Veggie Stir-Fry',  desc: 'Tiger prawns, broccoli, snap peas, oyster sauce', emoji: '🍤', cal: 360, pro: 30, carb: 28, fat: 7,  fib: 8,  sod: 710,  price: 1100, cat: MealCategory.LOW_CALORIE,  badge: null },
    { name: 'Egg White Omelette',       desc: 'Egg whites, spinach, feta, whole-grain toast',    emoji: '🥚', cal: 260, pro: 28, carb: 20, fat: 6,  fib: 4,  sod: 520,  price: 700,  cat: MealCategory.LOW_CALORIE,  badge: null },
    { name: 'Quinoa & Black Bean Bowl', desc: 'Quinoa, black beans, corn salsa, lime',            emoji: '🌽', cal: 430, pro: 22, carb: 65, fat: 7,  fib: 15, sod: 330,  price: 880,  cat: MealCategory.VEGETARIAN,   badge: 'Popular' },
  ]

  for (const meal of mealsData) {
    await prisma.meal.create({ data: { ...meal, weekId: week.id } })
  }

  console.log('✓ Seed complete: 2 users, 1 week (Week 21), 12 meals created.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
