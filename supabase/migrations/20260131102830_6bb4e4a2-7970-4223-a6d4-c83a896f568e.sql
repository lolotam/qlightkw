-- Add admin role for Handasa10@yahoo.com (nour hamdi)
INSERT INTO public.user_roles (user_id, role)
VALUES ('633b37ff-2fda-4c3a-8cd1-0f8b11e71a3b', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;