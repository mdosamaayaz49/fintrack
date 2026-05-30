import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORY_LABELS, CATEGORY_COLORS, type MonthlyStats } from '@/types'
import { formatCurrency } from '@/utils/formatCurrency'

interface SpendingPieChartProps {
  stats: MonthlyStats
  isLoading: boolean
}

export function SpendingPieChart({ stats, isLoading }: SpendingPieChartProps) {
  const data = Object.entries(stats.byCategory)
    .filter(([, amount]) => amount > 0)
    .map(([category, amount]) => ({
      name: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS],
      value: amount,
      color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS],
    }))
    .sort((a, b) => b.value - a.value)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
        ) : data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No expenses this month</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                aria-label="Spending by category pie chart"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Spent']}
                contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: '11px' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
