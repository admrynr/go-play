import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email, secret } = await request.json();

        // Simple protection to prevent public abuse
        // In production, this route should be disabled or protected by IP/VPN
        if (secret !== 'go-play-admin-setup') {
            return NextResponse.json({ error: 'Invalid secret' }, { status: 403 });
        }

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // Find user by email (we need to list users to find ID, or just trust the ID if provided)
        // admin.listUsers is the way to find by email
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();

        if (listError) throw listError;

        const user = users.find(u => u.email === email);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Update user metadata
        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { user_metadata: { ...user.user_metadata, role: 1 } }
        );

        if (updateError) throw updateError;

        return NextResponse.json({
            success: true,
            message: `User ${email} upgraded to Super Admin (Role 1). Please logout and login again to refresh capabilities.`
        });

    } catch (error: any) {
        console.error('Setup Admin Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
