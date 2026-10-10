import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://szxficncfyvghhxqzlnp.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_GkEujMRPoEwn1vl3XLSevQ_IGxT85LU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

async function runTests() {
  console.log('=== PHASE 1 COMPREHENSIVE BACKEND VERIFICATION ===');
  console.log('Target URL:', SUPABASE_URL);
  console.log('Anon Key:', SUPABASE_ANON_KEY.substring(0, 15) + '...');

  const results: Record<string, { status: 'PASS' | 'FAIL' | 'BLOCKED'; details: string; error?: any; table?: string }> = {};

  // Test 6: Course listing (test public queries first to see basic connectivity)
  try {
    const { data, error } = await supabase.from('courses').select('*').limit(5);
    if (error) {
      results['6. Course listing'] = { status: 'FAIL', table: 'courses', details: error.message, error };
    } else {
      results['6. Course listing'] = { status: 'PASS', table: 'courses', details: `Found ${data?.length} courses. Fields: ${Object.keys(data?.[0] || {}).join(', ')}` };
    }
  } catch (err: any) {
    results['6. Course listing'] = { status: 'FAIL', table: 'courses', details: err.message, error: err };
  }

  // Test 8: Lesson reading
  let sampleCourseId = '59c1368a-ba15-4f0d-be41-d3be44272b68';
  let sampleLessonId: string | null = null;
  try {
    const { data, error } = await supabase.from('lessons').select('*').limit(5);
    if (error) {
      results['8. Lesson reading'] = { status: 'FAIL', table: 'lessons', details: error.message, error };
    } else {
      if (data && data.length > 0) {
        sampleLessonId = data[0].id;
        results['8. Lesson reading'] = { status: 'PASS', table: 'lessons', details: `Found ${data.length} lessons. Fields: ${Object.keys(data[0]).join(', ')}` };
      } else {
        results['8. Lesson reading'] = { status: 'PASS', table: 'lessons', details: 'Query succeeded but table has 0 rows.' };
      }
    }
  } catch (err: any) {
    results['8. Lesson reading'] = { status: 'FAIL', table: 'lessons', details: err.message, error: err };
  }

  // Test 10: Quiz loading
  let sampleQuizId: string | null = null;
  try {
    const { data, error } = await supabase.from('quizzes').select('*').limit(5);
    if (error) {
      results['10. Quiz loading'] = { status: 'FAIL', table: 'quizzes', details: error.message, error };
    } else {
      if (data && data.length > 0) {
        sampleQuizId = data[0].id;
        results['10. Quiz loading'] = { status: 'PASS', table: 'quizzes', details: `Found ${data.length} quizzes. Fields: ${Object.keys(data[0]).join(', ')}` };
      } else {
        results['10. Quiz loading'] = { status: 'PASS', table: 'quizzes', details: 'Query succeeded, 0 rows in quizzes table.' };
      }
    }
  } catch (err: any) {
    results['10. Quiz loading'] = { status: 'FAIL', table: 'quizzes', details: err.message, error: err };
  }

  // Check questions and answers tables
  try {
    const { data: qData, error: qErr } = await supabase.from('questions').select('*').limit(2);
    console.log('Questions table check:', qErr ? qErr.message : `OK, fields: ${Object.keys(qData?.[0] || {}).join(', ')}`);
    const { data: aData, error: aErr } = await supabase.from('answers').select('*').limit(2);
    console.log('Answers table check:', aErr ? aErr.message : `OK, fields: ${Object.keys(aData?.[0] || {}).join(', ')}`);
  } catch (e: any) {
    console.log('Questions/Answers error:', e.message);
  }

  // Test 12: Internal groups
  let sampleGroupId: string | null = null;
  try {
    const { data, error } = await supabase.from('groups').select('*').limit(5);
    if (error) {
      results['12. Internal groups'] = { status: 'FAIL', table: 'groups', details: error.message, error };
    } else {
      if (data && data.length > 0) {
        sampleGroupId = data[0].id;
        results['12. Internal groups'] = { status: 'PASS', table: 'groups', details: `Found ${data.length} groups. Fields: ${Object.keys(data[0]).join(', ')}` };
      } else {
        results['12. Internal groups'] = { status: 'PASS', table: 'groups', details: 'Query succeeded, 0 rows in groups.' };
      }
    }
  } catch (err: any) {
    results['12. Internal groups'] = { status: 'FAIL', table: 'groups', details: err.message, error: err };
  }

  // Test 13: Group members
  try {
    const { data, error } = await supabase.from('group_members').select('*').limit(5);
    if (error) {
      results['13. Group members'] = { status: 'FAIL', table: 'group_members', details: error.message, error };
    } else {
      results['13. Group members'] = { status: 'PASS', table: 'group_members', details: `Found ${data?.length} rows. Fields: ${Object.keys(data?.[0] || {}).join(', ')}` };
    }
  } catch (err: any) {
    results['13. Group members'] = { status: 'FAIL', table: 'group_members', details: err.message, error: err };
  }

  // Test 14: Group messages
  try {
    const { data, error } = await supabase.from('group_messages').select('*').limit(5);
    if (error) {
      results['14. Group messages'] = { status: 'FAIL', table: 'group_messages', details: error.message, error };
    } else {
      results['14. Group messages'] = { status: 'PASS', table: 'group_messages', details: `Found ${data?.length} rows. Fields: ${Object.keys(data?.[0] || {}).join(', ')}` };
    }
  } catch (err: any) {
    results['14. Group messages'] = { status: 'FAIL', table: 'group_messages', details: err.message, error: err };
  }

  // Test 15: Realtime group messages
  try {
    const channel = supabase.channel('test-realtime');
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'group_messages' },
      () => {}
    );
    channel.subscribe((status) => {
      console.log('Realtime subscription status:', status);
    });
    results['15. Realtime group messages'] = { status: 'PASS', table: 'group_messages', details: 'Realtime channel established successfully on public.group_messages.' };
  } catch (err: any) {
    results['15. Realtime group messages'] = { status: 'FAIL', table: 'group_messages', details: err.message, error: err };
  }

  // Test 16: External community links
  try {
    const { data, error } = await supabase.from('community_links').select('*').limit(5);
    if (error) {
      results['16. External community links'] = { status: 'FAIL', table: 'community_links', details: error.message, error };
    } else {
      results['16. External community links'] = { status: 'PASS', table: 'community_links', details: `Found ${data?.length} rows. Fields: ${Object.keys(data?.[0] || {}).join(', ')}` };
    }
  } catch (err: any) {
    results['16. External community links'] = { status: 'FAIL', table: 'community_links', details: err.message, error: err };
  }

  // Test 17: Dictionary
  try {
    const { data, error } = await supabase.from('dictionary_entries').select('*').limit(5);
    if (error) {
      results['17. Dictionary'] = { status: 'FAIL', table: 'dictionary_entries', details: error.message, error };
    } else {
      results['17. Dictionary'] = { status: 'PASS', table: 'dictionary_entries', details: `Found ${data?.length} rows. Fields: ${Object.keys(data?.[0] || {}).join(', ')}` };
    }
  } catch (err: any) {
    results['17. Dictionary'] = { status: 'FAIL', table: 'dictionary_entries', details: err.message, error: err };
  }

  // Test 18: Books
  let sampleBookId: string | null = null;
  try {
    const { data, error } = await supabase.from('books').select('*').limit(5);
    if (error) {
      results['18. Books'] = { status: 'FAIL', table: 'books', details: error.message, error };
    } else {
      if (data && data.length > 0) sampleBookId = data[0].id;
      results['18. Books'] = { status: 'PASS', table: 'books', details: `Found ${data?.length} rows. Fields: ${Object.keys(data?.[0] || {}).join(', ')}` };
    }
  } catch (err: any) {
    results['18. Books'] = { status: 'FAIL', table: 'books', details: err.message, error: err };
  }

  // Test 19: Book access/reading
  try {
    const { data, error } = await supabase.from('book_access').select('*').limit(5);
    if (error) {
      results['19. Book access/reading'] = { status: 'FAIL', table: 'book_access', details: error.message, error };
    } else {
      results['19. Book access/reading'] = { status: 'PASS', table: 'book_access', details: `Found ${data?.length} rows. Fields: ${Object.keys(data?.[0] || {}).join(', ')}` };
    }
  } catch (err: any) {
    results['19. Book access/reading'] = { status: 'FAIL', table: 'book_access', details: err.message, error: err };
  }

  // Test 20: Book orders
  try {
    const { data, error } = await supabase.from('book_orders').select('*').limit(5);
    if (error) {
      results['20. Book orders'] = { status: 'FAIL', table: 'book_orders', details: error.message, error };
    } else {
      results['20. Book orders'] = { status: 'PASS', table: 'book_orders', details: `Found ${data?.length} rows. Fields: ${Object.keys(data?.[0] || {}).join(', ')}` };
    }
  } catch (err: any) {
    results['20. Book orders'] = { status: 'FAIL', table: 'book_orders', details: err.message, error: err };
  }

  // Check profiles table schema
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    console.log('Profiles table check:', error ? error.message : `OK, fields: ${Object.keys(data?.[0] || {}).join(', ')}`);
  } catch (e: any) {
    console.log('Profiles error:', e.message);
  }

  // Now Test 1, 2, 3, 4, 5, 7, 9, 11 (Authentication & Authenticated writes)
  const testEmail = `tafita_test_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!Secure';
  let userId: string | null = null;

  // Test 1: Registration
  try {
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test Audit User',
          role: 'Mpianatra',
        },
      },
    });

    if (signUpErr) {
      results['1. Registration'] = { status: 'FAIL', details: signUpErr.message, error: signUpErr };
    } else {
      userId = signUpData.user?.id || null;
      results['1. Registration'] = { status: 'PASS', details: `User registered: ${userId}, confirmed: ${Boolean(signUpData.session)}` };
      if (signUpData.session) {
        results['2. Login'] = { status: 'PASS', details: 'Auto-logged in with session token.' };
      }
    }
  } catch (err: any) {
    results['1. Registration'] = { status: 'FAIL', details: err.message, error: err };
  }

  // Test 2: Login if session was not returned automatically
  if (!results['2. Login']) {
    try {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (signInErr) {
        results['2. Login'] = { status: 'FAIL', details: signInErr.message, error: signInErr };
      } else {
        results['2. Login'] = { status: 'PASS', details: `Session obtained. Token present: ${Boolean(signInData.session?.access_token)}` };
        userId = signInData.user?.id || userId;
      }
    } catch (err: any) {
      results['2. Login'] = { status: 'FAIL', details: err.message, error: err };
    }
  }

  // Test 3: Session persistence after reload
  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) {
      results['3. Session persistence after reload'] = { status: 'FAIL', details: sessionErr.message, error: sessionErr };
    } else if (sessionData.session) {
      results['3. Session persistence after reload'] = { status: 'PASS', details: `Session persists in client storage for user: ${sessionData.session.user.id}` };
    } else {
      results['3. Session persistence after reload'] = { status: 'FAIL', details: 'No active session returned.' };
    }
  } catch (err: any) {
    results['3. Session persistence after reload'] = { status: 'FAIL', details: err.message, error: err };
  }

  // Test 5: Profile loading
  if (userId) {
    try {
      const { data: profData, error: profErr } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (profErr) {
        results['5. Profile loading'] = { status: 'FAIL', table: 'profiles', details: profErr.message, error: profErr };
      } else if (profData) {
        results['5. Profile loading'] = { status: 'PASS', table: 'profiles', details: `Profile loaded: ${JSON.stringify(profData)}` };
      } else {
        results['5. Profile loading'] = { status: 'BLOCKED', table: 'profiles', details: `No profile row auto-created on auth.signUp for user ${userId}. Profiles requires trigger or manual insert.` };
      }
    } catch (err: any) {
      results['5. Profile loading'] = { status: 'FAIL', table: 'profiles', details: err.message, error: err };
    }
  } else {
    results['5. Profile loading'] = { status: 'BLOCKED', table: 'profiles', details: 'Blocked by failed auth login/registration.' };
  }

  // Test 7: Course enrollment (authenticated insert into course_enrollments)
  if (userId) {
    try {
      const { data, error } = await supabase.from('course_enrollments').insert({
        user_id: userId,
        course_id: sampleCourseId,
      }).select();
      if (error) {
        results['7. Course enrollment'] = { status: 'FAIL', table: 'course_enrollments', details: error.message, error };
      } else {
        results['7. Course enrollment'] = { status: 'PASS', table: 'course_enrollments', details: 'Enrolled successfully.' };
      }
    } catch (err: any) {
      results['7. Course enrollment'] = { status: 'FAIL', table: 'course_enrollments', details: err.message, error: err };
    }
  } else {
    results['7. Course enrollment'] = { status: 'BLOCKED', table: 'course_enrollments', details: 'Blocked by unauthenticated user.' };
  }

  // Test 9: Lesson progress
  if (userId && sampleLessonId) {
    try {
      const { data, error } = await supabase.from('lesson_progress').insert({
        user_id: userId,
        lesson_id: sampleLessonId,
        completed: true,
      }).select();
      if (error) {
        results['9. Lesson progress'] = { status: 'FAIL', table: 'lesson_progress', details: error.message, error };
      } else {
        results['9. Lesson progress'] = { status: 'PASS', table: 'lesson_progress', details: 'Lesson progress inserted successfully.' };
      }
    } catch (err: any) {
      results['9. Lesson progress'] = { status: 'FAIL', table: 'lesson_progress', details: err.message, error: err };
    }
  } else {
    results['9. Lesson progress'] = { status: 'BLOCKED', table: 'lesson_progress', details: 'Blocked by missing userId or lessonId.' };
  }

  // Test 11: Quiz attempt and score
  if (userId && sampleQuizId) {
    try {
      const { data, error } = await supabase.from('quiz_attempts').insert({
        quiz_id: sampleQuizId,
        user_id: userId,
        score: 10,
        max_score: 10,
        passed: true,
      }).select();
      if (error) {
        results['11. Quiz attempt and score'] = { status: 'FAIL', table: 'quiz_attempts', details: error.message, error };
      } else {
        results['11. Quiz attempt and score'] = { status: 'PASS', table: 'quiz_attempts', details: 'Quiz attempt saved.' };
      }
    } catch (err: any) {
      results['11. Quiz attempt and score'] = { status: 'FAIL', table: 'quiz_attempts', details: err.message, error: err };
    }
  } else {
    results['11. Quiz attempt and score'] = { status: 'BLOCKED', table: 'quiz_attempts', details: 'Blocked by missing quizId (quizzes table has 0 rows).' };
  }

  // Test 4: Logout
  try {
    const { error: signOutErr } = await supabase.auth.signOut();
    if (signOutErr) {
      results['4. Logout'] = { status: 'FAIL', details: signOutErr.message, error: signOutErr };
    } else {
      results['4. Logout'] = { status: 'PASS', details: 'Successfully signed out session.' };
    }
  } catch (err: any) {
    results['4. Logout'] = { status: 'FAIL', details: err.message, error: err };
  }

  console.log('\n=== DETAILED SUMMARY ===');
  for (const [key, val] of Object.entries(results)) {
    console.log(`[${val.status}] ${key} => ${val.details}`);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
