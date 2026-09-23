/**
 * User & Authentication Domain Types
 */

export type UserRole =
  | 'student'
  | 'officer'
  | 'faculty'
  | 'staff'
  | 'admin'
  | 'super admin';

export interface UserAccount {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  department?: string;
  avatar_url?: string;
  phone?: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface AuthSession {
  user: UserAccount | null;
  token?: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}
