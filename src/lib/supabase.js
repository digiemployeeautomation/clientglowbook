import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://yvupvtnpnrelbxgmwguy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2dXB2dG5wbnJlbGJ4Z213Z3V5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMTgxOTksImV4cCI6MjA4NDU5NDE5OX0.2Xn0wyJj-WdCXiwLA-5FoEJ6LFbxX87z-TgByREa5Uw'
);
