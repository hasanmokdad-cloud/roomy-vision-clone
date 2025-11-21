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
    const { data: existingRole, error: existingError } = await supabase
      .from("user_roles")
      .select("id, role_id, roles(name)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingError) {
      console.error("Error checking existing role:", existingError);
      return new Response(JSON.stringify({ error: "Failed to check existing role" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Lookup role_id from roles table
    const { data: roleRow, error: roleError } = await supabase
      .from("roles")
      .select("id, name")
      .eq("name", chosen_role)
      .single();

    if (roleError || !roleRow) {
      return new Response(JSON.stringify({ error: "Role not found" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // If user already has a role
    if (existingRole) {
      const existingRoleName = (existingRole.roles as any)?.name;
      
      // If trying to assign the same role, return success without error
      if (existingRoleName === chosen_role) {
        return new Response(JSON.stringify({ 
          success: true, 
          role: chosen_role,
          alreadyHadRole: true 
        }), {
          status: 200,
          headers: corsHeaders,
        });
      }
      
      // If trying to switch to a different role, return 409 with current role
      return new Response(JSON.stringify({ 
        success: false,
        role: existingRoleName,
        message: `Role already set to ${existingRoleName}`
      }), {
        status: 409,
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

    // Insert into appropriate profile table (students or owners)
    const userEmail = user.email || "";
    const userName = user.user_metadata?.full_name || userEmail.split("@")[0];

    if (chosen_role === "student") {
      const { error: studentError } = await supabase.from("students").insert([
        {
          user_id: user.id,
          email: userEmail,
          full_name: userName,
        },
      ]);

      if (studentError) {
        console.error("Student profile creation error:", studentError);
        // Note: We don't fail the request if profile creation fails
        // The role is already assigned successfully
      }
    } else if (chosen_role === "owner") {
      const { error: ownerError } = await supabase.from("owners").insert([
        {
          user_id: user.id,
          email: userEmail,
          full_name: userName,
        },
      ]);

      if (ownerError) {
        console.error("Owner profile creation error:", ownerError);
        // Note: We don't fail the request if profile creation fails
        // The role is already assigned successfully
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      role: chosen_role,
      alreadyHadRole: false
    }), {
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
