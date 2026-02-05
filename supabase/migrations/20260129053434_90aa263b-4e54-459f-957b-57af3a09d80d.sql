-- =====================================================
-- Phase 1: Admin Dashboard Feature Tables
-- =====================================================

-- 1. System Logs Table
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error', 'debug')),
  category TEXT NOT NULL DEFAULT 'system' CHECK (category IN ('token', 'edge', 'post', 'auth', 'system', 'order', 'payment')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX idx_system_logs_level ON public.system_logs(level);
CREATE INDEX idx_system_logs_category ON public.system_logs(category);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_logs
CREATE POLICY "Admins can view all logs" ON public.system_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert logs" ON public.system_logs
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete logs" ON public.system_logs
  FOR DELETE USING (public.is_admin());

-- 2. Coupons Table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  description_ar TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  applicable_to TEXT DEFAULT 'all' CHECK (applicable_to IN ('all', 'category', 'product', 'user')),
  applicable_ids UUID[] DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for coupon lookup
CREATE UNIQUE INDEX idx_coupons_code ON public.coupons(UPPER(code));

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coupons
CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (
    is_active = true 
    AND (valid_from IS NULL OR valid_from <= now()) 
    AND (valid_until IS NULL OR valid_until >= now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  );

-- Trigger for updated_at
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Admin Inbox Messages Table
CREATE TABLE public.admin_inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  html_body TEXT,
  direction TEXT DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'sent', 'failed', 'draft', 'scheduled')),
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  thread_id UUID,
  reply_to_id UUID REFERENCES public.admin_inbox_messages(id) ON DELETE SET NULL,
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  resend_id TEXT,
  scheduled_at TIMESTAMPTZ,
  admin_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_inbox_messages_created_at ON public.admin_inbox_messages(created_at DESC);
CREATE INDEX idx_inbox_messages_thread ON public.admin_inbox_messages(thread_id);
CREATE INDEX idx_inbox_messages_direction ON public.admin_inbox_messages(direction);

-- Enable RLS
ALTER TABLE public.admin_inbox_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage inbox" ON public.admin_inbox_messages
  FOR ALL USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_inbox_messages_updated_at
  BEFORE UPDATE ON public.admin_inbox_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Observability Health Snapshots
CREATE TABLE public.observability_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_health_score INTEGER NOT NULL CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
  edge_functions_health INTEGER CHECK (edge_functions_health >= 0 AND edge_functions_health <= 100),
  database_health INTEGER CHECK (database_health >= 0 AND database_health <= 100),
  token_health INTEGER CHECK (token_health >= 0 AND token_health <= 100),
  storage_health INTEGER CHECK (storage_health >= 0 AND storage_health <= 100),
  active_errors_count INTEGER DEFAULT 0,
  failed_functions_count INTEGER DEFAULT 0,
  slow_queries_count INTEGER DEFAULT 0,
  metrics_breakdown JSONB DEFAULT '{}',
  captured_at TIMESTAMPTZ DEFAULT now()
);

-- Index for time-based queries
CREATE INDEX idx_health_snapshots_captured_at ON public.observability_health_snapshots(captured_at DESC);

-- Enable RLS
ALTER TABLE public.observability_health_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Admins can manage health snapshots" ON public.observability_health_snapshots
  FOR ALL USING (public.is_admin());

-- 5. Observability Alert Configurations
CREATE TABLE public.observability_alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('error_rate', 'response_time', 'health_score', 'token_health', 'storage_usage', 'custom')),
  metric_name TEXT,
  threshold_value NUMERIC NOT NULL,
  threshold_operator TEXT DEFAULT 'gte' CHECK (threshold_operator IN ('gt', 'gte', 'lt', 'lte', 'eq')),
  time_window_minutes INTEGER DEFAULT 5,
  cooldown_minutes INTEGER DEFAULT 30,
  notification_channels TEXT[] DEFAULT ARRAY['email'],
  notification_emails TEXT[],
  webhook_url TEXT,
  last_triggered_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.observability_alert_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Admins can manage alert configs" ON public.observability_alert_configs
  FOR ALL USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_alert_configs_updated_at
  BEFORE UPDATE ON public.observability_alert_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Observability Alert History
CREATE TABLE public.observability_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_config_id UUID REFERENCES public.observability_alert_configs(id) ON DELETE SET NULL,
  alert_name TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  triggered_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  details JSONB DEFAULT '{}',
  notification_sent BOOLEAN DEFAULT false,
  notification_channel TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_alert_history_created_at ON public.observability_alert_history(created_at DESC);
CREATE INDEX idx_alert_history_config ON public.observability_alert_history(alert_config_id);

-- Enable RLS
ALTER TABLE public.observability_alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Admins can manage alert history" ON public.observability_alert_history
  FOR ALL USING (public.is_admin());

-- 7. Observability Metrics
CREATE TABLE public.observability_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL CHECK (metric_type IN ('edge_function', 'database', 'api', 'storage', 'auth')),
  metric_name TEXT NOT NULL,
  metric_category TEXT DEFAULT 'general',
  total_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_duration_ms NUMERIC,
  min_duration_ms NUMERIC,
  max_duration_ms NUMERIC,
  p95_duration_ms NUMERIC,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_metrics_window ON public.observability_metrics(window_start, window_end);
CREATE INDEX idx_metrics_type_name ON public.observability_metrics(metric_type, metric_name);

-- Enable RLS
ALTER TABLE public.observability_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Admins can manage metrics" ON public.observability_metrics
  FOR ALL USING (public.is_admin());

-- 8. Coupon Usage Tracking
CREATE TABLE public.coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_applied NUMERIC NOT NULL,
  used_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX idx_coupon_usages_coupon ON public.coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user ON public.coupon_usages(user_id);

-- Enable RLS
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all coupon usages" ON public.coupon_usages
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Users can view own coupon usages" ON public.coupon_usages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coupon usages" ON public.coupon_usages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to increment coupon usage count
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.coupons 
  SET current_uses = current_uses + 1 
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$;

-- Trigger to auto-increment usage
CREATE TRIGGER increment_coupon_usage_trigger
  AFTER INSERT ON public.coupon_usages
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_coupon_usage();