import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('🔄 Processing pending owner payouts...');

    // Fetch reservations that need payout processing
    const { data: pendingReservations, error: fetchError } = await supabaseClient
      .from('reservations')
      .select(`
        *,
        rooms!inner(
          name,
          dorms!inner(
            dorm_name,
            name,
            owner_id
          )
        )
      `)
      .eq('status', 'paid')
      .in('owner_payout_status', ['pending', 'failed'])
      .lt('owner_payout_attempts', 5);

    if (fetchError) {
      console.error('Error fetching pending reservations:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingReservations?.length || 0} reservations needing payout`);

    let successCount = 0;
    let failureCount = 0;

    for (const reservation of pendingReservations || []) {
      try {
        await processOwnerPayout(supabaseClient, reservation);
        successCount++;
      } catch (error) {
        console.error(`Failed to process payout for reservation ${reservation.id}:`, error);
        failureCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingReservations?.length || 0,
        successCount,
        failureCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing payouts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processOwnerPayout(supabaseClient: any, reservation: any) {
  const ownerId = reservation.rooms?.dorms?.owner_id;
  
  if (!ownerId) {
    console.error('No owner_id found for reservation:', reservation.id);
    return;
  }

  // Get owner details
  const { data: owner, error: ownerError } = await supabaseClient
    .from('owners')
    .select('whish_account_id, payout_status')
    .eq('id', ownerId)
    .single();

  if (ownerError || !owner) {
    console.error('Owner not found:', ownerId);
    return;
  }

  // Check if owner has active Whish account
  if (!owner.whish_account_id || owner.payout_status !== 'active') {
    console.log(`Owner ${ownerId} does not have active Whish account - leaving as pending`);
    return;
  }

  // Increment attempt counter
  await supabaseClient
    .from('reservations')
    .update({ 
      owner_payout_attempts: reservation.owner_payout_attempts + 1,
      owner_payout_status: 'processing'
    })
    .eq('id', reservation.id);

  // Attempt Whish payout
  // NOTE: This is placeholder logic - real Whish API integration needed
  const whishConfigured = Deno.env.get('WHISH_SECRET_KEY') && 
                          Deno.env.get('WHISH_SECRET_KEY') !== '__REPLACE_ME__';

  if (whishConfigured) {
    try {
      // TODO: Implement actual Whish transfer API call
      // const whishResponse = await transferToOwner(
      //   owner.whish_account_id,
      //   reservation.owner_payout_amount,
      //   reservation.id
      // );

      // For now, simulate success in preview mode
      console.log(`✅ Simulated payout: $${reservation.owner_payout_amount} to owner ${ownerId}`);

      // Update reservation on success
      await supabaseClient
        .from('reservations')
        .update({
          owner_payout_status: 'paid',
          owner_payout_timestamp: new Date().toISOString(),
          roomy_commission_captured: true,
          payout_batch_id: `batch_${Date.now()}`,
        })
        .eq('id', reservation.id);

      console.log(`Payout processed for reservation ${reservation.id}`);
    } catch (error) {
      console.error('Whish transfer failed:', error);
      
      // Update reservation on failure
      await supabaseClient
        .from('reservations')
        .update({
          owner_payout_status: 'failed',
        })
        .eq('id', reservation.id);
    }
  } else {
    console.log('⚠️ Whish not configured - marking as pending');
    await supabaseClient
      .from('reservations')
      .update({
        owner_payout_status: 'pending',
      })
      .eq('id', reservation.id);
  }
}
