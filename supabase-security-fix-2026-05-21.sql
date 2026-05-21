-- Supabase Security Advisor remediation
-- rt18_formula1 Official Site
-- Applied to project ghnnfndnjvtrgkovuxte on 2026-05-21.
--
-- Fixes:
-- - rls_disabled_in_public on album_relations, album_news, album_portfolio,
--   orders, order_items, user_profiles.
-- - rls_enabled_no_policy on activate_codes, commissions, digital_contents,
--   inquiries.
-- - overly permissive albums/products write policies.

BEGIN;

ALTER TABLE public.album_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Access" ON public.album_relations;
CREATE POLICY "Public Read Access" ON public.album_relations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.album_news;
CREATE POLICY "Public Read Access" ON public.album_news
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Access" ON public.album_portfolio;
CREATE POLICY "Public Read Access" ON public.album_portfolio
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view own commissions" ON public.commissions;
CREATE POLICY "Users can view own commissions" ON public.commissions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own commissions" ON public.commissions;
CREATE POLICY "Users can create own commissions" ON public.commissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own inquiries" ON public.inquiries;
CREATE POLICY "Users can view own inquiries" ON public.inquiries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own inquiries" ON public.inquiries;
CREATE POLICY "Users can create own inquiries" ON public.inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Purchasers can view digital contents" ON public.digital_contents;
CREATE POLICY "Purchasers can view digital contents" ON public.digital_contents
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      WHERE oi.product_id = digital_contents.product_id
        AND o.user_id = auth.uid()
        AND o.status IN ('paid', 'processing', 'shipped', 'delivered')
    )
  );

DROP POLICY IF EXISTS "Users can view assigned activate codes" ON public.activate_codes;
CREATE POLICY "Users can view assigned activate codes" ON public.activate_codes
  FOR SELECT USING (used_by = auth.uid());

DROP POLICY IF EXISTS "Allow all operations" ON public.albums;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

COMMIT;
