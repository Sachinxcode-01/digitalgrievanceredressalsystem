const supabase = require('../server/config/supabase');
const bcrypt = require('bcryptjs');

const DEMO_ACCOUNTS = [
  {
    email: 'sachiii8827@gmail.com',
    password: 'Student@8827',
    role: 'student',
    dbRole: 'student',
    fullName: 'Sachin Student'
  },
  {
    email: 'saxhin0708@gmail.com',
    password: 'Admin@0708',
    role: 'admin',
    dbRole: 'admin',
    fullName: 'Sachin Admin'
  },
  {
    email: 'heyyysachiii88@gmail.com',
    password: 'Officer@88',
    role: 'officer',
    dbRole: 'staff',
    fullName: 'Sachin Officer'
  }
];

async function seedDemoAccounts() {
  if (!supabase) {
    console.error('❌ Supabase client is null. Check environment variables.');
    process.exit(1);
  }

  console.log('--- Creating / Verifying ResolveNow Demo Accounts ---');
  for (const acc of DEMO_ACCOUNTS) {
    const passwordHash = await bcrypt.hash(acc.password, 10);
    const emailNorm = acc.email.toLowerCase().trim();

    // 1. Check if user exists
    const { data: existingUser, error: findErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', emailNorm)
      .maybeSingle();

    if (findErr) {
      console.error(`Error searching for ${emailNorm}:`, findErr.message);
      continue;
    }

    let userRecord;
    if (existingUser) {
      console.log(`[UPDATE] Updating existing account for ${emailNorm} (ID: ${existingUser.id})...`);
      const { data: updated, error: updateErr } = await supabase
        .from('users')
        .update({
          password_hash: passwordHash,
          role: acc.dbRole,
          status: 'active',
          email_verified: true,
          phone_verified: true,
          failed_login_attempts: 0,
          lockout_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateErr) {
        console.error(`❌ Failed to update ${emailNorm}:`, updateErr.message);
        continue;
      }
      userRecord = updated;
    } else {
      console.log(`[CREATE] Creating new account for ${emailNorm}...`);
      const { data: created, error: createErr } = await supabase
        .from('users')
        .insert([{
          email: emailNorm,
          password_hash: passwordHash,
          role: acc.dbRole,
          status: 'active',
          email_verified: true,
          phone_verified: true
        }])
        .select()
        .single();

      if (createErr) {
        console.error(`❌ Failed to create ${emailNorm}:`, createErr.message);
        continue;
      }
      userRecord = created;
    }

    // 2. Ensure profile exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userRecord.id)
      .maybeSingle();

    if (existingProfile) {
      await supabase
        .from('user_profiles')
        .update({ full_name: acc.fullName })
        .eq('user_id', userRecord.id);
    } else {
      await supabase
        .from('user_profiles')
        .insert([{
          user_id: userRecord.id,
          full_name: acc.fullName,
          notification_preferences: { email: true, sms: true }
        }]);
    }

    console.log(`✅ [VERIFIED] ${emailNorm} | Role: ${acc.role} (DB: ${userRecord.role}) | Status: ${userRecord.status} | Verified: ${userRecord.email_verified}`);
  }
}

seedDemoAccounts()
  .then(() => {
    console.log('--- Demo Account Seeding Complete ---');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding script encountered an error:', err);
    process.exit(1);
  });
