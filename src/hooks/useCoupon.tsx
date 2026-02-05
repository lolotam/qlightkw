import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface CouponValidation {
  isValid: boolean;
  coupon: {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    min_order_amount: number;
    max_discount_amount: number | null;
    description: string | null;
  } | null;
  discountAmount: number;
  error: string | null;
}

export function useCoupon() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidation['coupon']>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  const validateCoupon = async (code: string, subtotal: number): Promise<CouponValidation> => {
    if (!code.trim()) {
      return { isValid: false, coupon: null, discountAmount: 0, error: t('checkout.enterCouponCode', 'Please enter a coupon code') };
    }

    setIsValidating(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        return { isValid: false, coupon: null, discountAmount: 0, error: t('checkout.invalidCoupon', 'Invalid coupon code') };
      }

      // Check validity dates
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return { isValid: false, coupon: null, discountAmount: 0, error: t('checkout.couponNotYetValid', 'Coupon is not yet valid') };
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return { isValid: false, coupon: null, discountAmount: 0, error: t('checkout.couponExpired', 'Coupon has expired') };
      }

      // Check usage limit
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        return { isValid: false, coupon: null, discountAmount: 0, error: t('checkout.couponMaxedOut', 'Coupon usage limit reached') };
      }

      // Check minimum order
      if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
        return { 
          isValid: false, 
          coupon: null, 
          discountAmount: 0, 
          error: t('checkout.minOrderNotMet', `Minimum order of ${coupon.min_order_amount} KWD required`) 
        };
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === 'percentage') {
        discount = (subtotal * coupon.discount_value) / 100;
        // Apply max discount cap
        if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
          discount = coupon.max_discount_amount;
        }
      } else {
        discount = coupon.discount_value;
      }

      // Ensure discount doesn't exceed subtotal
      discount = Math.min(discount, subtotal);

      return {
        isValid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          discount_type: coupon.discount_type as 'percentage' | 'fixed',
          discount_value: coupon.discount_value,
          min_order_amount: coupon.min_order_amount || 0,
          max_discount_amount: coupon.max_discount_amount,
          description: coupon.description,
        },
        discountAmount: discount,
        error: null,
      };
    } catch (error) {
      console.error('Coupon validation error:', error);
      return { isValid: false, coupon: null, discountAmount: 0, error: t('common.error', 'An error occurred') };
    } finally {
      setIsValidating(false);
    }
  };

  const applyCoupon = async (code: string, subtotal: number) => {
    const result = await validateCoupon(code, subtotal);
    
    if (result.isValid && result.coupon) {
      setAppliedCoupon(result.coupon);
      setDiscountAmount(result.discountAmount);
      toast({
        title: t('checkout.couponApplied', 'Coupon applied'),
        description: result.coupon.discount_type === 'percentage' 
          ? `${result.coupon.discount_value}% ${t('checkout.discount', 'discount')}`
          : `${result.coupon.discount_value} KWD ${t('checkout.discount', 'discount')}`,
      });
    } else {
      toast({
        title: t('checkout.invalidCoupon', 'Invalid coupon'),
        description: result.error,
        variant: 'destructive',
      });
    }
    
    return result;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    toast({
      title: t('checkout.couponRemoved', 'Coupon removed'),
    });
  };

  const recalculateDiscount = (subtotal: number) => {
    if (!appliedCoupon) return;
    
    let discount = 0;
    if (appliedCoupon.discount_type === 'percentage') {
      discount = (subtotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount_amount && discount > appliedCoupon.max_discount_amount) {
        discount = appliedCoupon.max_discount_amount;
      }
    } else {
      discount = appliedCoupon.discount_value;
    }
    
    discount = Math.min(discount, subtotal);
    setDiscountAmount(discount);
  };

  return {
    isValidating,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    recalculateDiscount,
  };
}
