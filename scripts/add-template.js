/**
 * Utility script to add PlayZone template to Supabase
 * Run with: node scripts/add-template.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addPlayZoneTemplate() {
    console.log('🎮 Adding PlayZone template to database...');

    const { data, error } = await supabase
        .from('templates')
        .insert({
            name: 'PlayZone Gaming',
            description: 'Modern gaming club template with vibrant purple/pink/blue gradients, neon effects, and futuristic gaming aesthetics',
            component_name: 'PlayZoneTemplate',
            default_config: { themeColor: '#9333EA' },
            is_active: true
        })
        .select();

    if (error) {
        // Check if it's a duplicate
        if (error.code === '23505') {
            console.log('✅ PlayZone template already exists in database');
            return;
        }
        console.error('❌ Error adding template:', error);
        process.exit(1);
    }

    console.log('✅ PlayZone template added successfully!');
    console.log('Template ID:', data[0].id);
}

addPlayZoneTemplate();
