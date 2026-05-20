'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Meal, MealCategory } from '@/types'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { api } from '@/lib/api'
import { toast } from '@/components/ui/Toast'

const schema = z.object({
  name: z.string().min(2),
  desc: z.string().min(5),
  emoji: z.string().min(1),
  cal: z.coerce.number().min(1),
  pro: z.coerce.number().min(0),
  carb: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  fib: z.coerce.number().min(0),
  sod: z.coerce.number().min(0),
  price: z.coerce.number().min(1),
  cat: z.string().min(1),
  weekNum: z.coerce.number().min(1),
  badge: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const CATS: MealCategory[] = ['HIGH_PROTEIN', 'LOW_CALORIE', 'HIGH_FIBRE', 'VEGETARIAN', 'BALANCED']

interface Props {
  editMeal?: Meal | null
  defaultWeekNum?: number
  onSaved: () => void
}

export default function MealForm({ editMeal, defaultWeekNum = 21, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: { weekNum: defaultWeekNum, cat: 'BALANCED' },
  })

  useEffect(() => {
    if (editMeal) {
      reset({ ...editMeal, weekNum: defaultWeekNum, badge: editMeal.badge ?? '' } as FormData)
    }
  }, [editMeal, defaultWeekNum, reset])

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      if (editMeal) {
        await api.put(`/api/admin/meals/${editMeal.id}`, data)
        toast('Meal updated')
      } else {
        await api.post('/api/admin/meals', data)
        toast('Meal added')
      }
      reset({ weekNum: defaultWeekNum, cat: 'BALANCED' })
      onSaved()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save meal', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <h3 className="font-semibold text-charcoal">{editMeal ? 'Edit Meal' : 'Add Meal'}</h3>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Name" {...register('name')} error={errors.name?.message} />
        <Input label="Emoji" {...register('emoji')} error={errors.emoji?.message} />
      </div>
      <Input label="Description" {...register('desc')} error={errors.desc?.message} />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Calories" type="number" {...register('cal')} error={errors.cal?.message} />
        <Input label="Protein (g)" type="number" {...register('pro')} error={errors.pro?.message} />
        <Input label="Carbs (g)" type="number" {...register('carb')} error={errors.carb?.message} />
        <Input label="Fat (g)" type="number" {...register('fat')} error={errors.fat?.message} />
        <Input label="Fibre (g)" type="number" {...register('fib')} error={errors.fib?.message} />
        <Input label="Sodium (mg)" type="number" {...register('sod')} error={errors.sod?.message} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Price (KSh)" type="number" {...register('price')} error={errors.price?.message} />
        <Input label="Week #" type="number" {...register('weekNum')} error={errors.weekNum?.message} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-charcoal">Category</label>
          <select {...register('cat')} className="rounded-lg border border-[rgba(45,74,62,0.25)] bg-warm-white px-3 py-2 text-sm text-charcoal outline-none focus:border-forest">
            {CATS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-charcoal">Badge</label>
          <select {...register('badge')} className="rounded-lg border border-[rgba(45,74,62,0.25)] bg-warm-white px-3 py-2 text-sm text-charcoal outline-none focus:border-forest">
            <option value="">None</option>
            <option value="Popular">Popular</option>
            <option value="New">New</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="primary" loading={loading} className="flex-1">{editMeal ? 'Update' : 'Add Meal'}</Button>
        <Button type="button" variant="outline" onClick={() => reset({ weekNum: defaultWeekNum, cat: 'BALANCED' })}>Clear</Button>
      </div>
    </form>
  )
}
