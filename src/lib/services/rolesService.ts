import { createClient } from '@/lib/supabase/client'

export interface Permission {
    id: string
    name: string
    description: string
    category: string
}

export interface Role {
    id: number
    tenant_id: string
    name: string
    description: string
    permissions: string[]
    created_at: string
}

// Define all available permissions
export const PERMISSIONS: Permission[] = [
    // Sales Permissions
    { id: 'sales.view', name: 'View Sales', description: 'View sales transactions', category: 'Sales' },
    { id: 'sales.create', name: 'Create Sales', description: 'Process new sales', category: 'Sales' },
    { id: 'sales.edit', name: 'Edit Sales', description: 'Modify existing sales', category: 'Sales' },
    { id: 'sales.delete', name: 'Delete Sales', description: 'Delete sales transactions', category: 'Sales' },
    { id: 'sales.refund', name: 'Process Refunds', description: 'Issue refunds', category: 'Sales' },

    // Inventory Permissions
    { id: 'inventory.view', name: 'View Inventory', description: 'View items and stock', category: 'Inventory' },
    { id: 'inventory.create', name: 'Create Items', description: 'Add new items', category: 'Inventory' },
    { id: 'inventory.edit', name: 'Edit Items', description: 'Modify items', category: 'Inventory' },
    { id: 'inventory.delete', name: 'Delete Items', description: 'Remove items', category: 'Inventory' },
    { id: 'inventory.adjust', name: 'Adjust Stock', description: 'Adjust stock levels', category: 'Inventory' },

    // Customer Permissions
    { id: 'customers.view', name: 'View Customers', description: 'View customer list', category: 'Customers' },
    { id: 'customers.create', name: 'Create Customers', description: 'Add new customers', category: 'Customers' },
    { id: 'customers.edit', name: 'Edit Customers', description: 'Modify customers', category: 'Customers' },
    { id: 'customers.delete', name: 'Delete Customers', description: 'Remove customers', category: 'Customers' },

    // Employee Permissions
    { id: 'employees.view', name: 'View Employees', description: 'View employee list', category: 'Employees' },
    { id: 'employees.create', name: 'Create Employees', description: 'Add new employees', category: 'Employees' },
    { id: 'employees.edit', name: 'Edit Employees', description: 'Modify employees', category: 'Employees' },
    { id: 'employees.delete', name: 'Delete Employees', description: 'Remove employees', category: 'Employees' },

    // Reports Permissions
    { id: 'reports.view', name: 'View Reports', description: 'Access reports', category: 'Reports' },
    { id: 'reports.export', name: 'Export Reports', description: 'Export report data', category: 'Reports' },

    // Settings Permissions
    { id: 'settings.view', name: 'View Settings', description: 'View system settings', category: 'Settings' },
    { id: 'settings.edit', name: 'Edit Settings', description: 'Modify settings', category: 'Settings' },
    { id: 'roles.manage', name: 'Manage Roles', description: 'Create and edit roles', category: 'Settings' },
]

// Default role templates
export const DEFAULT_ROLES = [
    {
        name: 'Admin',
        description: 'Full system access',
        permissions: PERMISSIONS.map(p => p.id),
    },
    {
        name: 'Manager',
        description: 'Management access',
        permissions: [
            'sales.view', 'sales.create', 'sales.edit', 'sales.refund',
            'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust',
            'customers.view', 'customers.create', 'customers.edit',
            'employees.view',
            'reports.view', 'reports.export',
        ],
    },
    {
        name: 'Cashier',
        description: 'Basic POS access',
        permissions: [
            'sales.view', 'sales.create',
            'inventory.view',
            'customers.view', 'customers.create',
            'reports.view',
        ],
    },
]

/**
 * Get all roles for a tenant
 */
export async function getRoles(tenantId: string): Promise<Role[]> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name', { ascending: true })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error getting roles:', error)
        return []
    }
}

/**
 * Create a new role
 */
export async function createRole(
    tenantId: string,
    name: string,
    description: string,
    permissions: string[]
): Promise<Role> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('roles')
            .insert({
                tenant_id: tenantId,
                name,
                description,
                permissions,
            })
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error creating role:', error)
        throw error
    }
}

/**
 * Update a role
 */
export async function updateRole(
    roleId: number,
    updates: Partial<Role>
): Promise<Role> {
    const supabase = createClient()

    try {
        const { data, error } = await supabase
            .from('roles')
            .update(updates)
            .eq('id', roleId)
            .select()
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error('Error updating role:', error)
        throw error
    }
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: number): Promise<void> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('roles')
            .delete()
            .eq('id', roleId)

        if (error) throw error
    } catch (error) {
        console.error('Error deleting role:', error)
        throw error
    }
}

/**
 * Assign role to employee
 */
export async function assignRoleToEmployee(
    employeeId: number,
    roleId: number
): Promise<void> {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from('employees')
            .update({ role_id: roleId })
            .eq('id', employeeId)

        if (error) throw error
    } catch (error) {
        console.error('Error assigning role:', error)
        throw error
    }
}

/**
 * Check if employee has permission
 */
export async function hasPermission(
    employeeId: number,
    permission: string
): Promise<boolean> {
    const supabase = createClient()

    try {
        const { data: employee, error } = await supabase
            .from('employees')
            .select(`
                role_id,
                role:roles(permissions)
            `)
            .eq('id', employeeId)
            .single()

        if (error || !employee?.role) return false

        const permissions = (employee.role as any)?.permissions || []
        return permissions.includes(permission)
    } catch (error) {
        console.error('Error checking permission:', error)
        return false
    }
}

/**
 * Get employee permissions
 */
export async function getEmployeePermissions(employeeId: number): Promise<string[]> {
    const supabase = createClient()

    try {
        const { data: employee, error } = await supabase
            .from('employees')
            .select(`
                role:roles(permissions)
            `)
            .eq('id', employeeId)
            .single()

        if (error || !employee?.role) return []

        return (employee.role as any)?.permissions || []
    } catch (error) {
        console.error('Error getting employee permissions:', error)
        return []
    }
}

/**
 * Initialize default roles for a tenant
 */
export async function initializeDefaultRoles(tenantId: string): Promise<void> {
    const supabase = createClient()

    try {
        for (const roleTemplate of DEFAULT_ROLES) {
            await createRole(
                tenantId,
                roleTemplate.name,
                roleTemplate.description,
                roleTemplate.permissions
            )
        }
    } catch (error) {
        console.error('Error initializing default roles:', error)
        throw error
    }
}
