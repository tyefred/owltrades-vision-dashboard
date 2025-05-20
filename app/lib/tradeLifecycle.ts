import { createClient } from '@supabase/supabase-js';
// import { Database } from '@/types/supabase'; // removed for now

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TABLE = 'trade_lifecycle';

export const getLatestTrade = async () => {
  const { data, error } = await supabase
    .from('trade_lifecycle')
    .select('*')
    .eq('exited', false)
    .order('created_at', { ascending: false })
    .limit(1); // ❌ REMOVE .single()

  if (error) throw error;
  return data?.[0] ?? null;
};

export const insertNewTrade = async (trade: any) => {
  const { data, error } = await supabase.from(TABLE).insert([trade]);
  if (error) throw error;
  return data;
};

export const updateTrade = async (id: string, updates: any) => {
  const { data, error } = await supabase
  .from('trade_lifecycle')
  .select('*')
  .eq('exited', false)
  .order('created_at', { ascending: false })
  .limit(1);

if (error) throw error;
return data?.[0] || null;
};
