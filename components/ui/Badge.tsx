import type { OrderStatus } from '@/types'

const statusStyles: Record<OrderStatus, string> = {
  PENDING: 'bg-terracotta/15 text-terracotta',
  CONFIRMED: 'bg-[#E8F4FF] text-[#1a6bc7]',
  PREPARING: 'bg-[#FFF9EC] text-[#9a6200]',
  OUT_FOR_DELIVERY: 'bg-[#F0EDFF] text-[#5b39c4]',
  DELIVERED: 'bg-[#EEFAF6] text-forest',
  CANCELLED: 'bg-[#FEF0F0] text-[#c42b2b]',
}

const statusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

interface Props {
  status: OrderStatus
  className?: string
}

export default function Badge({ status, className = '' }: Props) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]} ${className}`}>
      {statusLabels[status]}
    </span>
  )
}
