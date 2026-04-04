/**
 * Returns the correct occupant label based on tenant_selection setting.
 * 
 * tenant_selection = 'student_only' → "student" / "students"
 * tenant_selection = 'mixed' → "tenant" / "tenants"
 */
export function occupant(
  tenantSelection: string,
  options: { capitalize?: boolean; plural?: boolean } = {}
): string {
  const base = tenantSelection === 'student_only' ? 'student' : 'tenant';
  const word = options.plural ? base + 's' : base;
  return options.capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

/**
 * Helper to get the display name for a block number given blockNames array.
 * Falls back to "Block N" if no custom name is set.
 */
export function getBlockDisplayName(
  blockNumber: number,
  blockNames: Array<{ block_number: number; name: string }>
): string {
  const entry = blockNames.find(b => b.block_number === blockNumber);
  return entry?.name || `Block ${blockNumber}`;
}
