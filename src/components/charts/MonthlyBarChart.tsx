import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getTransactionsByMonth } from '@/services/transactions'
import { formatCurrencyCompact, formatCurrency } from '@/utils/formatCurrency'
import { format, subMonths, parseISO } from 'date-fns'

interface MonthlyBarChartProps {
  userId: string
  currentMonth: string  // "YYYY-MM"
}

type MonthData = {
  month: string
  income: number
  expense: number
}

function useLastSixMonths(userId: string, currentMonth: string) {
  const months = Array.from({ length: 6 }, (_, i) =>
    format(subMonths(parseISO(`${currentMonth}-01`), 5 - i), 'yyyy-MM'),
  )

  return useQuery({
    queryKey: ['monthlyBar', userId, currentMonth],
    queryFn: async (): Promise<MonthData[]> => {
      const results = await Promise.all(
        months.map((m) => getTransactionsByMonth(userId, m)),
      )
      return months.map((m, i) => {
        const txs = results[i]
        return {
          month: format(parseISO(`${m}-01`), 'MMM'),
          income: txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
          expense: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        }
      })
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
}

export function MonthlyBarChart({ userId, currentMonth }: MonthlyBarChartProps) {
  const { data, isLoading } = useLastSixMonths(userId, currentMonth)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground">6-Month Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barSize={14} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={formatCurrencyCompact}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                formatter={(value, name) => [formatCurrency(Number(value ?? 0)), String(name)]}
                contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: '11px' }}>{v}</span>} />
              <Bar dataKey="income" name="Income" fill="#1d9e75" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#e24b4a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
