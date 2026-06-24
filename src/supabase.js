import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://qwjhhksvbkppdgupdkym.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3amhoa3N2YmtwcGRndXBka3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDI4NjcsImV4cCI6MjA5NzYxODg2N30.EqImk2UrMvwoPwHvXepcEeto7UfEncNH8oc7KLTUczU'
);