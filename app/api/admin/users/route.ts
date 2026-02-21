import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// GET: Fetch user by ID OR check username availability
export async function GET(request: Request) {
    try {
        const supabase = await createServerClient();
        const { data: { user: requestor } } = await supabase.auth.getUser();

        if (!requestor || requestor.user_metadata?.role !== 1) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');
        const usernameToCheck = searchParams.get('check_username');

        const supabaseAdmin = createAdminClient();

        if (usernameToCheck) {
            const { data: existing } = await supabaseAdmin
                .from('tenants')
                .select('username')
                .eq('username', usernameToCheck.toLowerCase())
                .single();

            return NextResponse.json({ available: !existing });
        }

        if (userId) {
            const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (error) throw error;
            return NextResponse.json({ user });
        }

        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    } catch (error: any) {
        console.error('Get User Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create Tenant (Auth User -> Tenant -> Page)
export async function POST(request: Request) {
    try {
        const supabase = await createServerClient();
        const { data: { user: requestor } } = await supabase.auth.getUser();

        if (!requestor || requestor.user_metadata?.role !== 1) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { email, password, username, businessName = 'New Rental' } = body;

        if (!email || !password || !username) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // 1. Check if username exists
        const { data: existingTenant } = await supabaseAdmin
            .from('tenants')
            .select('id')
            .eq('username', username.toLowerCase())
            .single();

        if (existingTenant) {
            return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
        }

        // 2. Create Auth User
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 2 }
        });

        if (createUserError) throw createUserError;
        if (!newUser.user) throw new Error('Failed to create user');

        const userId = newUser.user.id;

        try {
            // 3. Create Tenant Record
            const { data: tenant, error: tenantError } = await supabaseAdmin
                .from('tenants')
                .insert({
                    user_id: userId,
                    username: username.toLowerCase(),
                    business_name: businessName
                })
                .select()
                .single();

            if (tenantError) throw tenantError;

            // 4. Create Page Record (Website)
            const { data: page, error: pageError } = await supabaseAdmin
                .from('pages')
                .insert({
                    owner_id: userId,
                    tenant_id: tenant.id,
                    slug: username.toLowerCase(),
                    business_name: businessName,
                    logo_text: businessName,
                    whatsapp_number: '',
                    address: ''
                })
                .select()
                .single();

            if (pageError) throw pageError;

            return NextResponse.json({ success: true, tenant, page });
        } catch (innerError: any) {
            // Rollback Auth User if database records fail
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw innerError;
        }

    } catch (error: any) {
        console.error('Create Tenant Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH: Update User Credentials
export async function PATCH(request: Request) {
    try {
        const supabase = await createServerClient();
        const { data: { user: requestor } } = await supabase.auth.getUser();

        if (!requestor || requestor.user_metadata?.role !== 1) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, email, password, adminPassword, username } = body;

        if (!userId || !adminPassword) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify Super Admin Password
        const tempClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error: signInError } = await tempClient.auth.signInWithPassword({
            email: requestor.email!,
            password: adminPassword
        });

        if (signInError) {
            return NextResponse.json({ error: 'Password Super Admin salah' }, { status: 403 });
        }

        const supabaseAdmin = createAdminClient();

        // Handle Username Update
        if (username) {
            const newUsername = username.toLowerCase().replace(/[^a-z0-9-]/g, '');

            // Check availability (excluding current user's tenant)
            const { data: existing } = await supabaseAdmin
                .from('tenants')
                .select('id')
                .eq('username', newUsername)
                .neq('user_id', userId)
                .single();

            if (existing) {
                return NextResponse.json({ error: 'Username sudah digunakan tenant lain' }, { status: 400 });
            }

            // Update Tenant
            const { error: tenantError } = await supabaseAdmin
                .from('tenants')
                .update({ username: newUsername })
                .eq('user_id', userId);

            if (tenantError) throw tenantError;

            // Update Page Slug (sync with username)
            const { error: pageError } = await supabaseAdmin
                .from('pages')
                .update({ slug: newUsername })
                .eq('owner_id', userId);

            if (pageError) throw pageError;
        }

        const updates: any = {};
        if (email) {
            updates.email = email;
            updates.email_confirm = true;
        }
        if (password) {
            updates.password = password;
        }

        // Only call updateUserById if email or password updates exist
        if (Object.keys(updates).length > 0) {
            const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates);
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update User Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: Robust Tenant Deletion (Page -> Tenant -> Auth User)
export async function DELETE(request: Request) {
    try {
        const supabase = await createServerClient();
        const { data: { user: requestor } } = await supabase.auth.getUser();

        if (!requestor || requestor.user_metadata?.role !== 1) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const tenantId = searchParams.get('id');

        if (!tenantId) {
            return NextResponse.json({ error: 'Missing Tenant ID' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // 1. Get Tenant details to find User ID
        const { data: tenant, error: fetchError } = await supabaseAdmin
            .from('tenants')
            .select('user_id')
            .eq('id', tenantId)
            .single();

        if (fetchError || !tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        const userId = tenant.user_id;

        // Note: Cascade deletes in DB should handle 'pages' if linked to 'tenants'
        // But let's be safe and explicitly clear pages if needed, though migration 008 set ON DELETE CASCADE.

        // 2. Delete Tenant Record (will cascade to pages if linked)
        const { error: deleteTenantError } = await supabaseAdmin
            .from('tenants')
            .delete()
            .eq('id', tenantId);

        if (deleteTenantError) throw deleteTenantError;

        // 3. Delete Auth User
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteUserError) {
            console.error('Auth User Deletion Failed (may need manual cleanup):', deleteUserError);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete Tenant Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

