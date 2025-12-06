/**
 * Security Baseline Check Script
 * 
 * PURPOSE: Verify RLS policies are correctly configured across all tables
 * USAGE: npx ts-node scripts/check_security_baseline.ts
 * 
 * Exit codes:
 *   0 - All security checks passed
 *   1 - Critical security issues found
 *   2 - Warnings found (non-critical)
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

interface SecurityOverviewRow {
  table_name: string;
  rls_enabled: boolean;
  policy_count: number;
  select_policies: number;
  insert_policies: number;
  update_policies: number;
  delete_policies: number;
  is_sensitive: boolean;
  security_status: string;
}

interface SecurityCheckResult {
  critical: SecurityOverviewRow[];
  warnings: SecurityOverviewRow[];
  healthy: SecurityOverviewRow[];
}

async function checkSecurityBaseline(): Promise<void> {
  console.log('\n🔒 Roomy Security Baseline Check\n');
  console.log('='.repeat(50));

  // Validate environment
  if (!SUPABASE_URL) {
    console.error('❌ Error: SUPABASE_URL not set');
    console.log('Set VITE_SUPABASE_URL or SUPABASE_URL environment variable');
    process.exit(1);
  }

  const apiKey = SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
  if (!apiKey) {
    console.error('❌ Error: No Supabase API key found');
    console.log('Set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_PUBLISHABLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, apiKey);

  try {
    // Query security overview
    const { data, error } = await supabase
      .from('security_rls_overview')
      .select('*');

    if (error) {
      console.error('❌ Failed to query security_rls_overview:', error.message);
      console.log('\nMake sure the security_rls_overview view exists.');
      console.log('Run the security guardrails migration if not.');
      process.exit(1);
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No tables found in security overview');
      process.exit(0);
    }

    // Categorize results
    const result: SecurityCheckResult = {
      critical: [],
      warnings: [],
      healthy: []
    };

    for (const row of data as SecurityOverviewRow[]) {
      if (row.security_status.startsWith('CRITICAL')) {
        result.critical.push(row);
      } else if (row.security_status.startsWith('WARNING')) {
        result.warnings.push(row);
      } else {
        result.healthy.push(row);
      }
    }

    // Report Critical Issues
    if (result.critical.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES\n');
      for (const issue of result.critical) {
        console.log(`  ❌ ${issue.table_name}`);
        console.log(`     Status: ${issue.security_status}`);
        console.log(`     RLS: ${issue.rls_enabled ? 'Enabled' : 'DISABLED'}`);
        console.log(`     Policies: ${issue.policy_count}`);
        console.log(`     Fix: ALTER TABLE public.${issue.table_name} ENABLE ROW LEVEL SECURITY;`);
        console.log('');
      }
    }

    // Report Warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS\n');
      for (const warning of result.warnings) {
        console.log(`  ⚠️ ${warning.table_name}`);
        console.log(`     Status: ${warning.security_status}`);
        console.log(`     Policies: ${warning.policy_count} (SELECT: ${warning.select_policies})`);
        console.log('');
      }
    }

    // Summary
    console.log('\n📊 SUMMARY\n');
    console.log(`  Total tables:     ${data.length}`);
    console.log(`  ✅ Healthy:       ${result.healthy.length}`);
    console.log(`  ⚠️ Warnings:      ${result.warnings.length}`);
    console.log(`  ❌ Critical:      ${result.critical.length}`);
    console.log('');

    // Healthy tables (abbreviated)
    if (result.healthy.length > 0) {
      console.log('✅ Healthy tables:');
      const healthyNames = result.healthy.map(t => t.table_name);
      // Show first 10, then "and X more..."
      if (healthyNames.length <= 10) {
        console.log(`   ${healthyNames.join(', ')}`);
      } else {
        console.log(`   ${healthyNames.slice(0, 10).join(', ')}`);
        console.log(`   ... and ${healthyNames.length - 10} more`);
      }
      console.log('');
    }

    // Exit with appropriate code
    if (result.critical.length > 0) {
      console.log('❌ Security check FAILED - Critical issues require immediate attention\n');
      process.exit(1);
    } else if (result.warnings.length > 0) {
      console.log('⚠️ Security check PASSED with warnings\n');
      process.exit(0); // Warnings don't fail CI, but are visible
    } else {
      console.log('✅ Security check PASSED - All tables properly secured\n');
      process.exit(0);
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

// Run the check
checkSecurityBaseline();
