import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingProfiles() {
  console.log('Starting to fix missing profiles...');

  try {
    // Get all users from auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users.users.length} users in auth.users`);

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }

    console.log(`Found ${profiles.length} profiles in profiles table`);

    // Find users without profiles
    const profileIds = new Set(profiles.map(profile => profile.id));
    const usersWithoutProfiles = users.users.filter(user => !profileIds.has(user.id));

    console.log(`Found ${usersWithoutProfiles.length} users without profiles`);

    // Create profiles for users without them
    for (const user of usersWithoutProfiles) {
      console.log(`Creating profile for user ${user.id} (${user.email})`);

      // Generate username from email or random string
      const username = user.email 
        ? user.email.split('@')[0] 
        : `user_${Math.random().toString(36).slice(2, 7)}`;

      // Create profile
      const { error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          current_streak: 0,
          role: 'USER',
          coins: 0
        }]);

      if (createError) {
        console.error(`Error creating profile for user ${user.id}:`, createError);
        continue;
      }

      // Create reading time record
      const { error: readingTimeError } = await supabase
        .from('reading_time')
        .insert([{
          profile_id: user.id,
          total_minutes: 0
        }]);

      if (readingTimeError) {
        console.error(`Error creating reading time for user ${user.id}:`, readingTimeError);
        // Continue anyway since the profile was created
      }

      console.log(`Successfully created profile for user ${user.id}`);
    }

    console.log('Finished fixing missing profiles');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
fixMissingProfiles()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 