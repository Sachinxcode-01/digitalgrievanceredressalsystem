-- Migration Version 4.0: SLA due dates, User Ratings, and In-App Notifications

-- 1. Extend grievances table with SLA due dates and feedback columns
ALTER TABLE public.grievances
ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rating INT CHECK (rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS feedback_comments TEXT;

-- 2. Create in-app notifications table
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create index for fast unread notifications queries
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_unread 
ON public.in_app_notifications(user_id) 
WHERE is_read = FALSE;

-- 4. Enable Row Level Security (RLS) on in-app notifications
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- 5. Define Security Policies
DROP POLICY IF EXISTS notification_owner_all ON public.in_app_notifications;
CREATE POLICY notification_owner_all ON public.in_app_notifications
    FOR ALL USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super admin')
    ));

-- Allow inserting notifications anonymously or via system functions
DROP POLICY IF EXISTS notification_system_insert ON public.in_app_notifications;
CREATE POLICY notification_system_insert ON public.in_app_notifications
    FOR INSERT WITH CHECK (true);
