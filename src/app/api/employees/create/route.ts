import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        
        // 1. Verify the requester is an Admin
        const { data: { user: requester } } = await supabase.auth.getUser()
        if (!requester) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: requesterEmployee } = await supabase
            .from('employees')
            .select('roles(name)')
            .eq('user_id', requester.id)
            .single()

        const role = (requesterEmployee?.roles as any)?.name
        if (role !== 'Admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
        }

        // 2. Parse request body
        const body = await request.json()
        const { email, password, firstName, lastName, username, roleId } = body

        if (!email || !password || !firstName || !lastName || !username || !roleId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const adminSupabase = createAdminClient()

        // 3. Create Auth User
        const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        })

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 })
        }

        // 4. Create Person Record
        const { data: person, error: personError } = await adminSupabase
            .from('people')
            .insert({
                first_name: firstName,
                last_name: lastName,
                email: email,
            })
            .select()
            .single()

        if (personError) {
            // Rollback auth user
            await adminSupabase.auth.admin.deleteUser(authUser.user.id)
            return NextResponse.json({ error: personError.message }, { status: 400 })
        }

        // 5. Create Employee Record
        const { data: employee, error: employeeError } = await adminSupabase
            .from('employees')
            .insert({
                person_id: person.id,
                user_id: authUser.user.id,
                username: username,
                role_id: roleId,
                deleted: false,
            })
            .select()
            .single()

        if (employeeError) {
            // Rollback
            await adminSupabase.from('people').delete().eq('id', person.id)
            await adminSupabase.auth.admin.deleteUser(authUser.user.id)
            return NextResponse.json({ error: employeeError.message }, { status: 400 })
        }

        return NextResponse.json({ 
            success: true, 
            employeeId: employee.id,
            userId: authUser.user.id 
        })

    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
