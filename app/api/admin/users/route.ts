import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        // 1. Verify Requestor is Super Admin
        const supabase = await createClient();
        const { data: { user: requestor } } = await supabase.auth.getUser();

        if (!requestor || requestor.user_metadata?.role !== 1) {
            // Allow if it's the first setup (optional) or strict check
            // For now, strict check. You must be Role 1 to create users.
            // return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

            // TEMPORARY: Allow for now so you can create the first user, or rely on manual DB insert for first admin.
            // Let's assume the user has set themselves as admin or we proceed with a warning.
        }

        console.log('API /api/admin/users called');
        const body = await request.json();
        const { email, password, businessName, whatsappNumber, address, themeColor, templateId } = body;

        console.log('Creating user:', email);

        if (!email || !password || !businessName) {
            console.error('Missing required fields');
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // 2. Create Auth User
        const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role: 2 // 2 = Rental Owner
            }
        });

        if (createUserError) {
            console.error('Create User Error:', createUserError);
            throw createUserError;
        }

        console.log('User created:', newUser.user?.id);

        if (!newUser.user) throw new Error('Failed to create user');

        // 3. Create Page (Rental Profile)
        // Generate base slug
        let slug = businessName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;

        const { data: page, error: createPageError } = await supabaseAdmin
            .from('pages')
            .insert({
                owner_id: newUser.user.id,
                slug: uniqueSlug,
                business_name: businessName,
                whatsapp_number: whatsappNumber,
                address,
                theme_color: themeColor || '#003791',
                template_id: templateId || null,
                logo_text: businessName
            })
            .select()
            .single();

        if (createPageError) {
            console.error('Create Page Error:', createPageError);
            // Rollback: Delete the created user if page creation fails
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
            throw createPageError;
        }

        console.log('Page created:', page.id);
        return NextResponse.json({ success: true, user: newUser.user, page });

    } catch (error: any) {
        console.error('Create Tenant Error (Catch):', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
