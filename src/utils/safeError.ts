/**
 * Safe Error Response Utility
 * Returns generic error messages to users while logging detailed errors internally
 */

export function safeErrorResponse(
  message: string = 'Something went wrong. Please try again later.',
  status: number = 500,
  corsHeaders?: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  );
}

/**
 * Log error to system logs (for use in edge functions)
 */
export async function logErrorToSystem(
  supabase: any,
  source: string,
  error: unknown
): Promise<void> {
  try {
    await supabase.from('security_logs').insert({
      source,
      severity: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        stack: error instanceof Error ? error.stack : null,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (logError) {
    // Fallback to console if logging fails
    console.error('Failed to log error to system:', logError);
  }
}
