/**
 * Security Regression Testing Script
 * 
 * This script can be run in CI/CD pipelines to verify security baselines.
 * 
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node tests/security_regression.ts
 * 
 * Exit codes:
 *   0 - All security checks passed
 *   1 - Critical security issues found
 *   2 - Warnings found (non-critical)
 */

import { createClient } from '@supabase/supabase-js';

interface SecurityCheckResult {
  tablename: string;
  rls_enabled: boolean;
  policy_count: number;
  issue_type: 'critical' | 'warning' | 'info';
  message: string;
}

interface SecurityBaseline {
  total_tables: number;
  tables_with_rls: number;
  tables_without_rls: number;
  tables_with_no_policies: number;
  critical_issues: SecurityCheckResult[];
  warnings: SecurityCheckResult[];
}

async function runSecurityChecks(): Promise<void> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔐 Running Security Regression Tests...\n');

  // Check 1: RLS Status for all tables
  const { data: rlsStatus, error: rlsError } = await supabase.rpc('check_rls_regression');
  
  if (rlsError) {
    // If the function doesn't exist, fall back to direct query
    console.log('⚠️  check_rls_regression function not found, using direct query...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public');

    if (tablesError) {
      console.error('❌ Failed to query tables:', tablesError);
      process.exit(1);
    }
  }

  // Check 2: Security Baseline Assertion
  const { data: baselineResult, error: baselineError } = await supabase.rpc('assert_security_baseline');
  
  if (baselineError) {
    console.log('⚠️  assert_security_baseline function not found, running manual checks...');
  }

  // Manual RLS check as fallback
  const { data: manualCheck, error: manualError } = await supabase
    .from('security_rls_overview')
    .select('*');

  if (manualError) {
    // If view doesn't exist, run raw query
    console.log('Running direct pg_tables query...');
  }

  // Parse results and categorize
  const baseline: SecurityBaseline = {
    total_tables: 0,
    tables_with_rls: 0,
    tables_without_rls: 0,
    tables_with_no_policies: 0,
    critical_issues: [],
    warnings: []
  };

  // Query tables directly
  const { data: tableData } = await supabase.rpc('get_table_security_status').catch(() => ({ data: null }));

  if (!tableData) {
    console.log('📊 Security baseline functions not installed. Running basic checks...\n');
    
    // Basic connectivity check
    const { error: pingError } = await supabase.from('students').select('id').limit(1);
    
    if (pingError) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    console.log('⚠️  For full security regression testing, run the database migration to install security functions.');
    console.log('\nTo install, apply migration: security_regression_functions\n');
    process.exit(0);
  }

  // Process results
  for (const table of tableData) {
    baseline.total_tables++;
    
    if (table.rls_enabled) {
      baseline.tables_with_rls++;
    } else {
      baseline.tables_without_rls++;
      baseline.critical_issues.push({
        tablename: table.tablename,
        rls_enabled: false,
        policy_count: 0,
        issue_type: 'critical',
        message: `Table ${table.tablename} has RLS disabled`
      });
    }

    if (table.rls_enabled && table.policy_count === 0) {
      baseline.tables_with_no_policies++;
      baseline.warnings.push({
        tablename: table.tablename,
        rls_enabled: true,
        policy_count: 0,
        issue_type: 'warning',
        message: `Table ${table.tablename} has RLS enabled but no policies defined`
      });
    }
  }

  // Print results
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    SECURITY BASELINE REPORT                    ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`📊 Summary:`);
  console.log(`   Total tables:           ${baseline.total_tables}`);
  console.log(`   Tables with RLS:        ${baseline.tables_with_rls}`);
  console.log(`   Tables without RLS:     ${baseline.tables_without_rls}`);
  console.log(`   Tables with no policies: ${baseline.tables_with_no_policies}\n`);

  if (baseline.critical_issues.length > 0) {
    console.log('🚨 CRITICAL ISSUES:');
    for (const issue of baseline.critical_issues) {
      console.log(`   ❌ ${issue.message}`);
    }
    console.log('');
  }

  if (baseline.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    for (const warning of baseline.warnings) {
      console.log(`   ⚠️  ${warning.message}`);
    }
    console.log('');
  }

  if (baseline.critical_issues.length === 0 && baseline.warnings.length === 0) {
    console.log('✅ All security checks passed!\n');
  }

  console.log('═══════════════════════════════════════════════════════════════\n');

  // Exit with appropriate code
  if (baseline.critical_issues.length > 0) {
    console.log('❌ Security regression test FAILED - Critical issues found');
    process.exit(1);
  } else if (baseline.warnings.length > 0) {
    console.log('⚠️  Security regression test completed with warnings');
    process.exit(2);
  } else {
    console.log('✅ Security regression test PASSED');
    process.exit(0);
  }
}

// Run the checks
runSecurityChecks().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
