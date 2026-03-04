import supabase from '../lib/supabaseClient';

export async function sendMagicLink(email) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    return { data, error };
  } catch (err) {
    return { error: err };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export function onAuthStateChange(cb) {
  return supabase.auth.onAuthStateChange((event, session) => cb(event, session));
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}
