-- Create function to reduce stock when order items are inserted
CREATE OR REPLACE FUNCTION public.reduce_stock_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reduce product stock if no variation
  IF NEW.variation_id IS NULL THEN
    UPDATE public.products
    SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - NEW.quantity)
    WHERE id = NEW.product_id;
  ELSE
    -- Reduce variation stock if variation exists
    UPDATE public.product_variations
    SET stock_quantity = GREATEST(0, COALESCE(stock_quantity, 0) - NEW.quantity)
    WHERE id = NEW.variation_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to reduce stock when order items are created
CREATE TRIGGER reduce_stock_on_order_item_insert
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.reduce_stock_on_order();

-- Create function to restore stock when order is cancelled/refunded
CREATE OR REPLACE FUNCTION public.restore_stock_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only restore stock when status changes to cancelled or refunded
  IF (NEW.status IN ('cancelled', 'refunded')) AND (OLD.status NOT IN ('cancelled', 'refunded')) THEN
    -- Restore stock for each order item
    UPDATE public.products p
    SET stock_quantity = COALESCE(p.stock_quantity, 0) + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id
      AND oi.variation_id IS NULL;
    
    UPDATE public.product_variations pv
    SET stock_quantity = COALESCE(pv.stock_quantity, 0) + oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.variation_id = pv.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to restore stock when order is cancelled/refunded
CREATE TRIGGER restore_stock_on_order_cancel
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.restore_stock_on_cancel();