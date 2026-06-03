import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import EmployeeView from './EmployeeView'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My Hours' }

export default async function EmployeePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== 'EMPLOYEE') redirect('/menu')

  const entries = await prisma.timeEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { checkIn: 'desc' },
    take: 50,
  })

  const openEntry = entries.find((e) => !e.checkOut) ?? null

  return (
    <EmployeeView
      name={session.user.name ?? 'Employee'}
      entries={entries as never}
      openEntry={openEntry as never}
    />
  )
}
