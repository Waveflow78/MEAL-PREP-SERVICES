import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import HeroSection from '@/components/menu/HeroSection'
import MenuClient from './MenuClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "This Week's Menu",
  description: 'Browse nutritionist-designed meals for this week.',
}

export default async function MenuPage() {
  const week = await prisma.week.findFirst({
    where: { active: true },
    include: { meals: { where: { active: true }, orderBy: { createdAt: 'asc' } } },
  })

  if (!week) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted">No active menu this week. Check back soon!</p>
      </div>
    )
  }

  return <MenuClient meals={week.meals as never} week={week as never} />
}
