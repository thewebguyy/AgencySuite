import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mocking Clerk
vi.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'user_123', orgId: 'org_123' }),
  useUser: () => ({ user: { id: 'user_123' } }),
  useOrganization: () => ({ organization: { id: 'org_123' } }),
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: async () => ({ userId: 'user_123', orgId: 'org_123' }),
}));

// Mocking Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mocking headers
vi.mock('next/headers', () => ({
  headers: async () => new Map([['x-pathname', '/dashboard']]),
}));
