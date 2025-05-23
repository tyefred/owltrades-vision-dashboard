import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET the most recent active trade
export async function getActiveTrade() {
  const { data, error } = await supabase
    .from('trade_lifecycle')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching trade:", error);
    return null;
  }

  return data;
}

// UPDATE the trade's status (exit reason + timestamp)
export async function updateTradeStatus(id: string, reason: 'TP' | 'SL') {
  const { error } = await supabase
    .from('trade_lifecycle')
    .update({
      exited: true,
      exit_reason: reason,
      exit_time: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error("Error updating trade status:", error);
    return false;
  }

  return true;
}
