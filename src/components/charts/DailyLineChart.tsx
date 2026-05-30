import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrencyCompact, formatCurrency } from '@/utils/formatCurrency'
import { formatDateShort } from '@/utils/formatDate'
import { eachDayOfInterval, parseISO, format, startOfMonth, endOfMonth, isAfter } from 'date-fns'
import type { Transaction } from '@/types'

interface DailyLineChartProps {
  transactions: Transaction[]
  month: string          // "YYYY-MM"
  isLoading: boolean
}

export function DailyLineChart({ transactions, month, isLoading }: DailyLineChartProps) {
  const monthStart = startOfMonth(parseISO(`${month}-01`))
  const monthEnd = endOfMonth(monthStart)
  const today = new Date()

  const days = eachDayOfInterval({
    start: monthStart,
    end: isAfter(monthEnd, today) ? today : monthEnd,
  })

  const data = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const dayExpenses = transactions
      .filter((t) => t.type === 'expense' && t.date === dateStr)
      .reduce((sum, t) => sum + t.amount, 0)
    return {
      date: dateStr,
      label: formatDateShort(dateStr),
      expense: dayExpenses,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground">Daily Spending</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={formatCurrencyCompact}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Spent']}
                contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="Daily Spend"
                stroke="#3b8bd4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
