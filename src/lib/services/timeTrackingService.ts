import { createClient } from '@/lib/supabase/client'

export interface TimeEntry {
    id: number
    employee_id: number
    clock_in: string
    clock_out?: string
    break_minutes: number
    notes?: string
    created_at: string
}

/**
 * Clock in an employee
 */
export async function clockIn(employeeId: number, notes?: string): Promise<TimeEntry> {
    const supabase = createClient()

    try {
        // Check if already clocked in
        const { data: existing } = await supabase
            .from('time_entries')
            .select('*')
            .eq('employee_id', employeeId)
            .is('clock_out', null)
            .single()

        if (existing) {
            throw new Error('Already clocked in')
        }

        const { data, error } = await supabase
            .from('time_entries')
            .insert({
                employee_id: employeeId,
                clock_in: new Date().toISOString(),
                break_minutes: 0,
                notes,
            })
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error clocking in:', error)
        throw error
    }
}

/**
 * Clock out an employee
 */
export async function clockOut(employeeId: number, breakMinutes: number = 0): Promise<TimeEntry> {
    const supabase = createClient()

    try {
        const { data: entry, error: fetchError } = await supabase
            .from('time_entries')
            .select('*')
            .eq('employee_id', employeeId)
            .is('clock_out', null)
            .single()

        if (fetchError || !entry) {
            throw new Error('Not clocked in')
        }

        const { data, error } = await supabase
            .from('time_entries')
            .update({
                clock_out: new Date().toISOString(),
                break_minutes: breakMinutes,
            })
            .eq('id', entry.id)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error clocking out:', error)
        throw error
    }
}

/**
 * Get current clock status
 */
export async function getCurrentClockStatus(employeeId: number): Promise<TimeEntry | null> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('time_entries')
            .select('*')
            .eq('employee_id', employeeId)
            .is('clock_out', null)
            .single()

        if (error && error.code !== 'PGRST116') throw error
        return data
    } catch (error) {
        console.error('Error getting clock status:', error)
        return null
    }
}

/**
 * Get time entries for employee
 */
export async function getTimeEntries(
    employeeId: number,
    dateRange?: { from: Date; to: Date }
): Promise<TimeEntry[]> {
    const supabase = createClient()

    try {
        let query = supabase
            .from('time_entries')
            .select('*')
            .eq('employee_id', employeeId)
            .order('clock_in', { ascending: false })

        if (dateRange) {
            query = query
                .gte('clock_in', dateRange.from.toISOString())
                .lte('clock_in', dateRange.to.toISOString())
        }

        const { data, error } = await query

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting time entries:', error)
        return []
    }
}

/**
 * Calculate hours worked
 */
export function calculateHoursWorked(entry: TimeEntry): number {
    if (!entry.clock_out) return 0

    const clockIn = new Date(entry.clock_in)
    const clockOut = new Date(entry.clock_out)
    const totalMinutes = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60)
    const workedMinutes = totalMinutes - (entry.break_minutes || 0)

    return workedMinutes / 60
}

/**
 * Calculate total hours for period
 */
export function calculateTotalHours(entries: TimeEntry[]): {
    totalHours: number
    regularHours: number
    overtimeHours: number
} {
    const totalHours = entries.reduce((sum, entry) => {
        return sum + calculateHoursWorked(entry)
    }, 0)

    // Assume 40 hours per week is regular, rest is overtime
    const regularHours = Math.min(totalHours, 40)
    const overtimeHours = Math.max(totalHours - 40, 0)

    return {
        totalHours,
        regularHours,
        overtimeHours,
    }
}

/**
 * Get timesheet summary
 */
export async function getTimesheetSummary(
    employeeId: number,
    startDate: Date,
    endDate: Date
): Promise<any> {
    const entries = await getTimeEntries(employeeId, { from: startDate, to: endDate })
    const { totalHours, regularHours, overtimeHours } = calculateTotalHours(entries)

    return {
        entries,
        totalHours,
        regularHours,
        overtimeHours,
        daysWorked: entries.filter(e => e.clock_out).length,
    }
}
