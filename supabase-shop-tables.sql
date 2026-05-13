-- ショップ系DBテーブル作成スクリプト
-- rt18_formula1 Official Site
-- 作成日: 2026-05-12

-- 1. user_profiles (Supabase Authと連携)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  display_id TEXT UNIQUE,
  display_name TEXT,
  last_name TEXT,
  first_name TEXT,
  postal_code TEXT,
  prefecture TEXT,
  city TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  agreed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. products
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ja TEXT NOT NULL,
  name_en TEXT,
  description_ja TEXT,
  description_en TEXT,
  type TEXT CHECK (type IN ('digital', 'physical', 'skill')) DEFAULT 'digital',
  price INTEGER NOT NULL,
  stock INTEGER,
  status TEXT CHECK (status IN ('on_sale', 'sold_out', 'draft')) DEFAULT 'draft',
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. digital_contents
CREATE TABLE IF NOT EXISTS digital_contents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  delivery_type TEXT CHECK (delivery_type IN ('file', 'activate_code', 'link', 'text')),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. activate_codes
CREATE TABLE IF NOT EXISTS activate_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by uuid REFERENCES user_profiles(id),
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id),
  status TEXT CHECK (status IN (
    'pending', 'awaiting_payment', 'paid',
    'processing', 'shipped', 'delivered', 'cancelled'
  )) DEFAULT 'pending',
  total_price INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  shipping_name TEXT,
  shipping_postal_code TEXT,
  shipping_prefecture TEXT,
  shipping_city TEXT,
  shipping_address_line1 TEXT,
  shipping_address_line2 TEXT,
  stripe_checkout_session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. order_items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity INTEGER DEFAULT 1,
  price INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 7. commissions (イラスト制作依頼)
CREATE TABLE IF NOT EXISTS commissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id),
  status TEXT CHECK (status IN (
    'requested', 'reviewing', 'quoted',
    'approved', 'agreement_sent', 'agreed',
    'in_progress', 'checking', 'completed', 'cancelled'
  )) DEFAULT 'requested',
  detail TEXT NOT NULL,
  budget INTEGER,
  quoted_price INTEGER,
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8. inquiries (問い合わせ)
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'replied', 'closed')) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_profiles_display_id ON user_profiles(display_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_activate_codes_product_id ON activate_codes(product_id);
CREATE INDEX IF NOT EXISTS idx_activate_codes_code ON activate_codes(code);
CREATE INDEX IF NOT EXISTS idx_activate_codes_is_used ON activate_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_commissions_user_id ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- RLS (Row Level Security) 有効化
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activate_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- RLSポリシー（基本設定）
-- user_profiles: ユーザー自身のプロフィールのみ閲覧・更新可能
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- products: 誰でも閲覧可能、認証ユーザーのみ挿入・更新可能
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (status = 'on_sale');

CREATE POLICY "Authenticated users can manage products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- digital_contents: products経由でのみアクセス
CREATE POLICY "Users can view digital contents via products" ON digital_contents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = digital_contents.product_id 
      AND products.status = 'on_sale'
    )
  );

-- orders: ユーザー自身の注文のみ閲覧可能
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- order_items: orders経由でのみアクセス
CREATE POLICY "Users can view order items via orders" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- commissions: ユーザー自身の依頼のみ閲覧・作成可能
CREATE POLICY "Users can view own commissions" ON commissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own commissions" ON commissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- inquiries: ユーザー自身の問い合わせのみ閲覧・作成可能
CREATE POLICY "Users can view own inquiries" ON inquiries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own inquiries" ON inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- activate_codes: products経由でのみアクセス
CREATE POLICY "Users can view activate codes via products" ON activate_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = activate_codes.product_id 
      AND products.status = 'on_sale'
    )
  );

-- トリガー: user_profilesの自動作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_id, agreed_at)
  VALUES (
    new.id,
    '匿名#' || LPAD(EXTRACT(MILLISECOND FROM NOW())::TEXT, 6, '0'),
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- トリガー: display_idの自動生成（未設定の場合）
CREATE OR REPLACE FUNCTION public.generate_display_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.display_id IS NULL OR NEW.display_id = '' THEN
    NEW.display_id := '匿名#' || LPAD(EXTRACT(MILLISECOND FROM NOW())::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_display_id_trigger
  BEFORE INSERT OR UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.generate_display_id();
