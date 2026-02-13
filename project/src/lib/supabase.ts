import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type Complaint = {
  id: string;
  title: string;
  description: string;
  category_id: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  user_id: string;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  profile?: Profile;
};

export type Comment = {
  id: string;
  complaint_id: string;
  user_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  profile?: Profile;
};
