import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// GET: Fetch tenant info for claim page
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const slug = searchParams.get('slug');
        const checkUsername = searchParams.get('checkUsername');

        // Username availability check
        if (checkUsername) {
            const supabaseAdmin = createAdminClient();
            const { data: existing } = await supabaseAdmin
                .from('tenants')
                .select('id')
                .eq('username', checkUsername)
                .maybeSingle();

            return NextResponse.json({ available: !existing });
        }

        if (!slug) {
            return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        const { data: tenant } = await supabaseAdmin
            .from('tenants')
            .select('id, business_name, is_claimed, username')
            .eq('username', slug)
            .single();

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }

        if (tenant.is_claimed) {
            return NextResponse.json({ error: 'Tenant already claimed' }, { status: 400 });
        }

        return NextResponse.json({ tenant });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Claim/Takeover a tenant account
export async function POST(request: Request) {
    try {
        const { slug, username, email, password } = await request.json();

        if (!slug || !email || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // 1. Find tenant by slug
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .select('id, user_id, business_name, username')
            .eq('username', slug)
            .single();

        if (tenantError || !tenant) {
            return NextResponse.json({ error: 'Tenant tidak ditemukan' }, { status: 404 });
        }

        // 2. Check if already claimed
        const { data: tenantCheck } = await supabaseAdmin
            .from('tenants')
            .select('is_claimed')
            .eq('id', tenant.id)
            .single();

        if (tenantCheck?.is_claimed) {
            return NextResponse.json({ error: 'Akun sudah diklaim oleh orang lain' }, { status: 400 });
        }

        // 3. Check if email is already used by another auth user
        const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers();
        const emailTaken = existingUsers?.some(
            (u) => u.email === email && u.id !== tenant.user_id
        );

        if (emailTaken) {
            return NextResponse.json({ error: 'Email sudah digunakan akun lain' }, { status: 400 });
        }

        // 4. Update auth user with new email & password
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
            tenant.user_id,
            {
                email,
                password,
                email_confirm: true,
            }
        );

        if (authError) throw authError;

        // 5. Update tenant status (and username if changed)
        const tenantUpdate: any = {
            is_claimed: true,
            status: 'active',
        };

        // If username changed, validate and update
        const newUsername = username && username !== tenant.username ? username : null;

        if (newUsername) {
            // Validate username uniqueness
            const { data: usernameExists } = await supabaseAdmin
                .from('tenants')
                .select('id')
                .eq('username', newUsername)
                .neq('id', tenant.id)
                .maybeSingle();

            if (usernameExists) {
                return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
            }

            tenantUpdate.username = newUsername;
        }

        const { error: updateError } = await supabaseAdmin
            .from('tenants')
            .update(tenantUpdate)
            .eq('id', tenant.id);

        if (updateError) throw updateError;

        // 5b. Update page slug if username changed
        if (newUsername) {
            const { data: tenantPage } = await supabaseAdmin
                .from('pages')
                .select('id')
                .eq('tenant_id', tenant.id)
                .single();

            if (tenantPage) {
                await supabaseAdmin
                    .from('pages')
                    .update({ slug: newUsername })
                    .eq('id', tenantPage.id);
            }
        }

        // 6. Purge demo/dummy data
        await purgeDemoData(supabaseAdmin, tenant.id);

        return NextResponse.json({
            success: true,
            tenantName: tenant.business_name,
        });
    } catch (error: any) {
        console.error('Claim Tenant Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * Purges all demo/dummy data for a tenant after claiming.
 * Deletes in dependency order to avoid FK violations.
 */
async function purgeDemoData(
    supabaseAdmin: ReturnType<typeof createAdminClient>,
    tenantId: string
) {
    // Get the page_id for this tenant
    const { data: page } = await supabaseAdmin
        .from('pages')
        .select('id')
        .eq('tenant_id', tenantId)
        .single();

    if (!page) return;

    const pageId = page.id;

    // 1. Delete dummy station_requests
    await supabaseAdmin
        .from('station_requests')
        .delete()
        .eq('page_id', pageId)
        .eq('is_dummy', true);

    // 2. Delete dummy order_items (via orders)
    const { data: dummyOrders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('page_id', pageId)
        .eq('is_dummy', true);

    if (dummyOrders && dummyOrders.length > 0) {
        const orderIds = dummyOrders.map((o) => o.id);
        await supabaseAdmin
            .from('order_items')
            .delete()
            .in('order_id', orderIds);
    }

    // 3. Delete dummy orders
    await supabaseAdmin
        .from('orders')
        .delete()
        .eq('page_id', pageId)
        .eq('is_dummy', true);

    // 4. Delete dummy sessions
    await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('page_id', pageId)
        .eq('is_dummy', true);

    // 5. Delete dummy stations
    await supabaseAdmin
        .from('stations')
        .delete()
        .eq('page_id', pageId)
        .eq('is_dummy', true);

    // 6. Delete dummy menu items
    await supabaseAdmin
        .from('menu_items')
        .delete()
        .eq('page_id', pageId)
        .eq('is_dummy', true);
}
