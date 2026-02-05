-- Add admin role to user dr.vet.waleedtam@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('98604331-fb49-478f-b4cf-95158903be93', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;