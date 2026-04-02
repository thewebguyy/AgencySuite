import { describe, it, expect, vi } from 'vitest';
import { getCurrentAgency } from '@/lib/auth/agency';
import { createClient } from '@/lib/supabase/server';

// Mocking dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@clerk/nextjs/server');

describe('RLS Isolation', () => {
  it('should only return agency data associated with current Clerk orgId', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ orgId: 'org_abc' });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { id: 'agency_abc', clerk_org_id: 'org_abc' }, 
              error: null 
            })),
          })),
        })),
      })),
    };
    (createClient as any).mockResolvedValue(mockSupabase);

    const agency = await getCurrentAgency();
    expect(agency).toBeDefined();
    expect(agency?.id).toBe('agency_abc');
    expect(mockSupabase.from).toHaveBeenCalledWith('agencies');
  });

  it('should return null if no agency found for orgId', async () => {
    const { auth } = await import('@clerk/nextjs/server');
    (auth as any).mockResolvedValue({ orgId: 'org_unknown' });

    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Not found' } 
            })),
          })),
        })),
      })),
    };
    (createClient as any).mockResolvedValue(mockSupabase);

    const agency = await getCurrentAgency();
    expect(agency).toBeNull();
  });
});
