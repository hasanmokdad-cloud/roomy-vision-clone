// create-admin-profile/index.ts
// Edge function to create admin profile records when admin role is assigned manually
// This should be called by existing admins when promoting users to admin status

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Validate JWT and get user
    const {
      data: { user: requestingUser },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verify requesting user is an admin
    const { data: adminCheck } = await supabase
      .from("user_roles")
      .select("id, roles(name)")
      .eq("user_id", requestingUser.id)
      .maybeSingle();

    if (!adminCheck || (adminCheck.roles as any)?.name !== "admin") {
      return new Response(
        JSON.stringify({ error: "Only admins can create admin profiles" }),
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    // Get target user info from request
    const body = await req.json();
    const { user_id, full_name, email, phone_number } = body ?? {};

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: "user_id and email are required" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Verify target user has admin role
    const { data: targetRoleCheck } = await supabase
      .from("user_roles")
      .select("id, roles(name)")
      .eq("user_id", user_id)
      .maybeSingle();

    if (!targetRoleCheck || (targetRoleCheck.roles as any)?.name !== "admin") {
      return new Response(
        JSON.stringify({ error: "Target user must have admin role assigned first" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Check if admin profile already exists
    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (existingAdmin) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Admin profile already exists",
          admin_id: existingAdmin.id,
        }),
        {
          status: 200,
          headers: corsHeaders,
        }
      );
    }

    // Create admin profile
    const { data: newAdmin, error: insertError } = await supabase
      .from("admins")
      .insert({
        user_id,
        full_name: full_name || email.split("@")[0],
        email,
        phone_number: phone_number || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Admin profile creation error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create admin profile" }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin profile created successfully",
        admin: newAdmin,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (err) {
    console.error("Unexpected server error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
