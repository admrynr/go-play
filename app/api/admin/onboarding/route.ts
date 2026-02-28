import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createTenantUserName } from '@/lib/utils/slugify';
import { NextResponse } from 'next/server';

const DEFAULT_PASSWORD = 'goplay123';
const EMAIL_DOMAIN = '@antigravity.demo';

// Station presets for dummy data
const STATION_PRESETS = [
    { name: 'PS5 VIP 1', type: 'PS5' },
    { name: 'PS5 Regular 1', type: 'PS5' },
    { name: 'PS5 Regular 2', type: 'PS5' },
    { name: 'PS4 Room 1', type: 'PS4' },
    { name: 'PS4 Room 2', type: 'PS4' },
];

// Menu presets
const MENU_PRESETS = [
    { name: 'Es Teh Manis', price: 5000, category: 'drink' },
    { name: 'Kopi Susu', price: 12000, category: 'drink' },
    { name: 'Air Mineral', price: 4000, category: 'drink' },
    { name: 'Indomie Goreng', price: 10000, category: 'food' },
    { name: 'Nasi Goreng', price: 15000, category: 'food' },
    { name: 'Kentang Goreng', price: 12000, category: 'snack' },
    { name: 'Roti Bakar', price: 10000, category: 'snack' },
    { name: 'Pop Mie', price: 8000, category: 'food' },
];

interface LeadData {
    name: string;
    phone: string;
    address: string;
    website: string;
    rating: number;
    reviews: number;
}

// Generate random amount within range
function randomAmount(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) / 1000) * 1000;
}

// Generate random date within last N days
function randomDateWithinDays(days: number): Date {
    const now = new Date();
    const msAgo = Math.random() * days * 24 * 60 * 60 * 1000;
    return new Date(now.getTime() - msAgo);
}

async function generateDummyData(
    supabaseAdmin: ReturnType<typeof createAdminClient>,
    pageId: string,
    stationIds: string[],
    menuItemIds: { id: string; price: number }[]
) {
    const sessionData = [];
    const now = new Date();

    // Generate 15-20 completed sessions across last 3 days
    const sessionCount = 15 + Math.floor(Math.random() * 6);
    for (let i = 0; i < sessionCount; i++) {
        const startDate = randomDateWithinDays(3);
        const durationMinutes = [60, 90, 120, 180][Math.floor(Math.random() * 4)];
        const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

        // Skip if end date is in the future
        if (endDate > now) continue;

        const hourlyRate = [15000, 20000, 25000][Math.floor(Math.random() * 3)];
        const totalAmount = Math.round((durationMinutes / 60) * hourlyRate);
        const paymentMethods = ['cash', 'qris', 'transfer'];
        const sessionTypes = ['open', 'timer'];

        sessionData.push({
            station_id: stationIds[Math.floor(Math.random() * stationIds.length)],
            page_id: pageId,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            duration_minutes: durationMinutes,
            type: sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
            status: 'completed',
            total_amount: totalAmount,
            payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            is_dummy: true,
        });
    }

    const { data: sessions } = await supabaseAdmin
        .from('sessions')
        .insert(sessionData)
        .select('id');

    // Generate F&B orders for ~60% of sessions
    if (sessions && sessions.length > 0) {
        const ordersToCreate = sessions
            .filter(() => Math.random() < 0.6)
            .slice(0, 10);

        for (const session of ordersToCreate) {
            // 1-3 items per order
            const itemCount = 1 + Math.floor(Math.random() * 3);
            const selectedItems = [...menuItemIds]
                .sort(() => Math.random() - 0.5)
                .slice(0, itemCount);

            const orderTotal = selectedItems.reduce((sum, item) => {
                const qty = 1 + Math.floor(Math.random() * 2);
                return sum + item.price * qty;
            }, 0);

            const { data: order } = await supabaseAdmin
                .from('orders')
                .insert({
                    session_id: session.id,
                    page_id: pageId,
                    status: 'served',
                    total_amount: orderTotal,
                    is_dummy: true,
                })
                .select('id')
                .single();

            if (order) {
                const orderItems = selectedItems.map((item) => ({
                    order_id: order.id,
                    menu_item_id: item.id,
                    quantity: 1 + Math.floor(Math.random() * 2),
                    price: item.price,
                    is_dummy: true,
                }));

                await supabaseAdmin.from('order_items').insert(orderItems);
            }
        }
    }

    // Generate station_requests
    if (sessions && sessions.length > 0) {
        const requestTypes = ['add_time', 'stop_session', 'call_operator'];
        const requestStatuses = ['pending', 'resolved', 'resolved', 'resolved'];
        const requestCount = 4 + Math.floor(Math.random() * 4);

        const requests = [];
        for (let i = 0; i < requestCount; i++) {
            const session = sessions[Math.floor(Math.random() * sessions.length)];
            const type = requestTypes[Math.floor(Math.random() * requestTypes.length)];
            requests.push({
                session_id: session.id,
                page_id: pageId,
                type,
                payload: type === 'add_time' ? { duration: 60 } : null,
                status: requestStatuses[Math.floor(Math.random() * requestStatuses.length)],
                is_dummy: true,
            });
        }

        await supabaseAdmin.from('station_requests').insert(requests);
    }
}

export async function POST(request: Request) {
    try {
        // Verify admin access
        const supabase = await createServerClient();
        const { data: { user: requestor } } = await supabase.auth.getUser();

        if (!requestor || requestor.user_metadata?.role !== 1) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { leads } = await request.json() as { leads: LeadData[] };

        if (!leads || !Array.isArray(leads) || leads.length === 0) {
            return NextResponse.json({ error: 'No leads provided' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // Get PlayZone template ID
        const { data: template } = await supabaseAdmin
            .from('templates')
            .select('id')
            .eq('component_name', 'PlayZoneTemplate')
            .single();

        const results: Array<{
            name: string;
            slug: string;
            email: string;
            status: 'success' | 'error';
            error?: string;
        }> = [];

        for (const lead of leads) {
            try {
                // 1. Generate slug
                let slug = createTenantUserName(lead.name);
                if (!slug) slug = 'rental';

                // 2. Check uniqueness, append random suffix if needed
                const { data: existing } = await supabaseAdmin
                    .from('tenants')
                    .select('username')
                    .eq('username', slug)
                    .single();

                if (existing) {
                    const suffix = Math.floor(100 + Math.random() * 900);
                    slug = `${slug}-${suffix}`;
                }

                const email = `${slug}${EMAIL_DOMAIN}`;

                // 3. Create auth user (shadow account)
                const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email,
                    password: DEFAULT_PASSWORD,
                    email_confirm: true,
                    user_metadata: { role: 2 },
                });

                if (authError) throw authError;
                if (!newUser.user) throw new Error('Failed to create user');

                const userId = newUser.user.id;

                try {
                    // 4. Create tenant record
                    const { data: tenant, error: tenantError } = await supabaseAdmin
                        .from('tenants')
                        .insert({
                            user_id: userId,
                            username: slug,
                            business_name: lead.name,
                            is_claimed: false,
                            status: 'onboarding',
                            phone: lead.phone || null,
                            rating: lead.rating || null,
                            reviews: lead.reviews || null,
                        })
                        .select()
                        .single();

                    if (tenantError) throw tenantError;

                    // 5. Create page record
                    const { data: page, error: pageError } = await supabaseAdmin
                        .from('pages')
                        .insert({
                            owner_id: userId,
                            tenant_id: tenant.id,
                            slug: slug,
                            business_name: lead.name,
                            logo_text: lead.name,
                            whatsapp_number: lead.phone || '',
                            address: lead.address || '',
                            template_id: template?.id || null,
                        })
                        .select()
                        .single();

                    if (pageError) throw pageError;

                    // 6. Create default stations
                    const stationsToInsert = STATION_PRESETS.map((s) => ({
                        page_id: page.id,
                        name: s.name,
                        type: s.type,
                        status: 'idle',
                        is_dummy: true,
                    }));

                    const { data: stations } = await supabaseAdmin
                        .from('stations')
                        .insert(stationsToInsert)
                        .select('id');

                    // 7. Create menu items
                    const menuToInsert = MENU_PRESETS.map((m) => ({
                        page_id: page.id,
                        name: m.name,
                        price: m.price,
                        category: m.category,
                        is_available: true,
                        is_dummy: true,
                    }));

                    const { data: menuItems } = await supabaseAdmin
                        .from('menu_items')
                        .insert(menuToInsert)
                        .select('id, price');

                    // 8. Generate dummy transactions
                    if (stations && menuItems) {
                        const stationIds = stations.map((s) => s.id);
                        const menuItemsData = menuItems.map((m) => ({
                            id: m.id,
                            price: m.price,
                        }));
                        await generateDummyData(supabaseAdmin, page.id, stationIds, menuItemsData);
                    }

                    results.push({
                        name: lead.name,
                        slug,
                        email,
                        status: 'success',
                    });
                } catch (innerError: any) {
                    // Rollback: delete auth user if DB inserts fail
                    await supabaseAdmin.auth.admin.deleteUser(userId);
                    throw innerError;
                }
            } catch (error: any) {
                results.push({
                    name: lead.name,
                    slug: '',
                    email: '',
                    status: 'error',
                    error: error.message,
                });
            }
        }

        const success = results.filter((r) => r.status === 'success').length;
        const failed = results.filter((r) => r.status === 'error').length;

        return NextResponse.json({
            success: true,
            summary: { total: leads.length, success, failed },
            results,
        });
    } catch (error: any) {
        console.error('Bulk Onboarding Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
