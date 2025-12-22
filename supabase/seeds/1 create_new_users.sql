-- Considered as the admin user for development purposes
-- Admin/Sales rep users can be changed from the public.user_roles table
-- These data cannot be seeded. 
-- Only way to create users is through the auth.sign_up function from client or server side

-- -- 1. Create development auth users
-- select auth.sign_up(
--   email => "savindu@6ixsenses.com",
--   password => "1234"
-- );

-- select auth.sign_up(
--   email => "savindudulanaka00@gmail.com",
--   password => "1234"
-- );