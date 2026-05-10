import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for auth operations
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getOwnerTenantId(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { data: page } = await supabase
        .from('pages')
        .select('tenant_id')
        .eq('owner_id', user.id)
        .single();

    if (!page?.tenant_id) return { error: 'Not authorized as owner' };
    return { tenantId: page.tenant_id };
}

export async function GET(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { tenantId, error } = await getOwnerTenantId(supabase);
        
        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        // Fetch tenant users
        const { data: tenantUsers, error: dbError } = await supabase
            .from('tenant_users')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (dbError) throw dbError;

        // Fetch emails from auth.users using admin client
        const usersWithEmail = await Promise.all(
            (tenantUsers || []).map(async (tu) => {
                const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(tu.user_id);
                return {
                    ...tu,
                    email: authUser?.user?.email || 'Unknown',
                };
            })
        );

        return NextResponse.json(usersWithEmail);
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { tenantId, error } = await getOwnerTenantId(supabase);
        
        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        const body = await request.json();
        const { email, username, password, role = 'admin_rental' } = body;

        if (!email || !username || !password) {
            return NextResponse.json({ error: 'Email, username, and password are required' }, { status: 400 });
        }

        // 1. Check if username is already taken globally
        const { data: existingTenant } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .eq('username', username)
            .single();
            
        if (existingTenant) {
            return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
        }

        const { data: existingUser } = await supabaseAdmin
            .from('tenant_users')
            .select('id')
            .eq('username', username)
            .single();

        if (existingUser) {
            return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
        }

        // 2. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role } // Store role in metadata just in case
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
        }

        // 3. Create entry in tenant_users
        const { data: tenantUser, error: dbError } = await supabaseAdmin
            .from('tenant_users')
            .insert({
                tenant_id: tenantId,
                user_id: authData.user.id,
                username,
                role
            })
            .select()
            .single();

        if (dbError) {
            // Rollback auth user creation if db insert fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw dbError;
        }

        return NextResponse.json({
            ...tenantUser,
            email: authData.user.email
        });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { tenantId, error } = await getOwnerTenantId(supabase);
        
        if (error) {
            return NextResponse.json({ error }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Verify the user belongs to this tenant
        const { data: tenantUser } = await supabase
            .from('tenant_users')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('user_id', userId)
            .single();

        if (!tenantUser) {
            return NextResponse.json({ error: 'User not found in your tenant' }, { status: 404 });
        }

        // Delete from auth.users (will cascade to tenant_users)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
            throw deleteError;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
