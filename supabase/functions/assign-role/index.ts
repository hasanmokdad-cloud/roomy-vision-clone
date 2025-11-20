// assign-role/index.ts
// Securely assigns a role ("student" or "owner") to a logged-in user exactly once.

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
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

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
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Body input
    const body = await req.json();
    const { chosen_role } = body ?? {};

    if (!chosen_role) {
      return new Response(JSON.stringify({ error: "chosen_role is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (chosen_role === "admin") {
      return new Response(JSON.stringify({ error: "Users cannot self-assign admin" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const allowed = ["student", "owner"];
    if (!allowed.includes(chosen_role)) {
      return new Response(JSON.stringify({ error: "Invalid role choice" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Check if user already has a role
    const { data: existing, error: existingError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing role:", existingError);
      return new Response(JSON.stringify({ error: "Failed to check existing role" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (existing) {
      return new Response(JSON.stringify({ error: "Role already set" }), {
        status: 409,
        headers: corsHeaders,
      });
    }

    // Lookup role_id from roles table
    const { data: roleRow, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", chosen_role)
      .single();

    if (roleError || !roleRow) {
      return new Response(JSON.stringify({ error: "Role not found" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Insert role assignment row
    const { error: insertError } = await supabase.from("user_roles").insert([
      {
        user_id: user.id,
        role_id: roleRow.id,
      },
    ]);

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to assign role" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ message: `Role '${chosen_role}' assigned` }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Unexpected server error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
