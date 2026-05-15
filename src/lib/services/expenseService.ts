import { createClient } from '@/lib/supabase/client'

export interface Expense {
    id: number
    tenant_id: string
    expense_time: string
    category: string
    amount: number
    description: string
    payment_method?: string
    employee_id?: number
    created_at: string
}

export async function getExpenses(tenantId: string, filters?: { dateFrom?: string, dateTo?: string }): Promise<Expense[]> {
    const supabase = createClient()
    let query = supabase
        .from('expenses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('expense_time', { ascending: false })

    if (filters?.dateFrom) {
        query = query.gte('expense_time', filters.dateFrom)
    }
    if (filters?.dateTo) {
        query = query.lte('expense_time', filters.dateTo)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
}

export async function addExpense(expense: Partial<Expense>) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single()

    if (error) throw error
    return data
}

export async function getExpenseCategories(tenantId: string): Promise<string[]> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('expenses')
        .select('category')
        .eq('tenant_id', tenantId)
    
    if (error) throw error
    const categories = Array.from(new Set(data?.map(d => d.category) || []))
    return categories.length > 0 ? categories : ['Rent', 'Electricity', 'Salaries', 'Maintenance', 'Others']
}
