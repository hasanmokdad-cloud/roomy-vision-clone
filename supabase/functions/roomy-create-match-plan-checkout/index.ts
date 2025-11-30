import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MATCH_PLAN_PRICES = {
  basic: 0,
  advanced: 4.99,
  vip: 9.99,
} as const;

interface MatchPlanCheckoutRequest {
  planType: 'basic' | 'advanced' | 'vip';
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get student record
    const { data: student, error: studentError } = await supabaseClient
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      throw new Error('Student profile not found');
    }

    const { planType } = await req.json() as MatchPlanCheckoutRequest;

    if (planType === 'basic') {
      // Basic plan is free - activate immediately
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 365); // 1 year for free basic

      const { data: matchPlan, error: planError } = await supabaseClient
        .from('student_match_plans')
        .insert({
          student_id: student.id,
          plan_type: 'basic',
          status: 'active',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (planError) {
        throw new Error('Failed to activate basic plan');
      }

      // Update student record
      await supabaseClient
        .from('students')
        .update({ ai_match_plan: 'basic' })
        .eq('id', student.id);

      return new Response(
        JSON.stringify({
          success: true,
          planType: 'basic',
          message: 'Basic plan activated',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // For Advanced/VIP - create payment
    const amount = MATCH_PLAN_PRICES[planType];

    if (!amount) {
      throw new Error('Invalid plan type');
    }

    // Whish API integration (Codnloc Pay)
    const whishSecretKey = Deno.env.get('WHISH_SECRET_KEY');
    const whishApiBase = Deno.env.get('WHISH_API_BASE') || 'https://pay.codnloc.com';
    
    let checkoutUrl: string;
    let paymentId: string;
    
    // Check if in preview mode (keys not configured)
    if (!whishSecretKey || whishSecretKey === '__REPLACE_ME__') {
      console.log('Whish: Running in preview mode - no real API calls');
      checkoutUrl = `/ai-match?preview=true&planType=${planType}`;
      paymentId = `preview_plan_${student.id}_${Date.now()}`;
    } else {
      // Real Whish API call
      try {
        const successUrl = `${Deno.env.get('SUPABASE_URL')}/ai-match?planType=${planType}&status=success`;
        const cancelUrl = `${Deno.env.get('SUPABASE_URL')}/ai-match?planType=${planType}&status=cancelled`;
        
        const whishResponse = await fetch(`${whishApiBase}/api/v1/payments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whishSecretKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: amount,
            currency: 'USD',
            description: `AI Match ${planType} plan subscription`,
            metadata: {
              payment_type: 'match_plan',
              student_id: student.id,
              plan_type: planType
            },
            success_url: successUrl,
            cancel_url: cancelUrl
          })
        });

        if (!whishResponse.ok) {
          throw new Error(`Whish API error: ${whishResponse.status}`);
        }

        const whishData = await whishResponse.json();
        checkoutUrl = whishData.checkout_url;
        paymentId = whishData.payment_id;
      } catch (error) {
        console.error('Whish API error:', error);
        throw new Error('Failed to create payment session');
      }
    }

    console.log('Match plan checkout created:', {
      studentId: student.id,
      planType,
      amount,
      paymentId,
    });

    return new Response(
      JSON.stringify({
        checkoutUrl,
        paymentId,
        planType,
        amount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating match plan checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
