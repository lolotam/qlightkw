import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useCoupon } from '@/hooks/useCoupon';
import { supabase } from '@/integrations/supabase/client';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronRight, 
  CreditCard, 
  Truck, 
  MapPin, 
  CheckCircle,
  ArrowLeft,
  Ticket,
  X,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CheckoutStep = 'shipping' | 'delivery' | 'payment' | 'confirmation';

const Checkout = () => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const { items: cartItems, subtotal: cartSubtotal, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    isValidating,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    recalculateDiscount,
  } = useCoupon();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [couponCode, setCouponCode] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    area: '',
    notes: '',
    deliveryMethod: 'standard',
    paymentMethod: 'cod',
    agreeTerms: false,
  });

  const steps: { key: CheckoutStep; label: string; icon: React.ReactNode }[] = [
    { key: 'shipping', label: t('checkout.steps.shipping', 'Shipping'), icon: <MapPin className="h-5 w-5" /> },
    { key: 'delivery', label: t('checkout.steps.delivery', 'Delivery'), icon: <Truck className="h-5 w-5" /> },
    { key: 'payment', label: t('checkout.steps.payment', 'Payment'), icon: <CreditCard className="h-5 w-5" /> },
    { key: 'confirmation', label: t('checkout.confirm', 'Confirm'), icon: <CheckCircle className="h-5 w-5" /> },
  ];

  // Calculate totals
  const subtotal = cartSubtotal || 0;
  const deliveryCost = formData.deliveryMethod === 'express' ? 5.000 : formData.deliveryMethod === 'sameday' ? 8.000 : 3.000;
  const total = subtotal + deliveryCost - discountAmount;

  // Recalculate discount when subtotal changes
  useEffect(() => {
    recalculateDiscount(subtotal);
  }, [subtotal]);

  // Auto-fill shipping address from user's saved default address
  useEffect(() => {
    if (!user) return;

    const savedAddresses = localStorage.getItem(`addresses_${user.id}`);
    if (savedAddresses) {
      try {
        const addresses = JSON.parse(savedAddresses);
        // Find default address, or use the first one
        const defaultAddress = addresses.find((addr: any) => addr.is_default) || addresses[0];
        
        if (defaultAddress) {
          // Parse name into first and last name
          const nameParts = (defaultAddress.name || '').split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          // Build full address string from address components
          const addressParts = [
            defaultAddress.block ? `Block ${defaultAddress.block}` : '',
            defaultAddress.street ? `Street ${defaultAddress.street}` : '',
            defaultAddress.building ? `Building ${defaultAddress.building}` : '',
            defaultAddress.floor ? `Floor ${defaultAddress.floor}` : '',
            defaultAddress.apartment ? `Apt ${defaultAddress.apartment}` : '',
          ].filter(Boolean).join(', ');
          
          setFormData((prev) => ({
            ...prev,
            firstName,
            lastName,
            phone: defaultAddress.phone || '',
            email: user.email || '',
            address: addressParts,
            city: 'Kuwait',
            area: defaultAddress.area || '',
            notes: defaultAddress.notes || '',
          }));
        }
      } catch (error) {
        console.error('Error parsing saved addresses:', error);
      }
    } else if (user.email) {
      // At least fill in the email from the user's account
      setFormData((prev) => ({
        ...prev,
        email: user.email || '',
      }));
    }
  }, [user]);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    const stepOrder: CheckoutStep[] = ['shipping', 'delivery', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const stepOrder: CheckoutStep[] = ['shipping', 'delivery', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleApplyCoupon = async () => {
    await applyCoupon(couponCode, subtotal);
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: t('auth.required', 'Login Required'),
        description: t('checkout.loginToOrder', 'Please login to place an order'),
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: t('cart.empty', 'Cart is empty'),
        description: t('checkout.addItemsFirst', 'Please add items to your cart first'),
        variant: 'destructive',
      });
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Create shipping address JSON
      const shippingAddress = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        area: formData.area,
      };

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: '', // Generated by trigger
          subtotal: subtotal,
          shipping_cost: deliveryCost,
          discount_amount: discountAmount,
          total_amount: total,
          shipping_address: shippingAddress,
          billing_address: shippingAddress,
          shipping_method: formData.deliveryMethod,
          payment_method: formData.paymentMethod as 'knet' | 'cod' | 'wamad_transfer',
          notes: formData.notes || null,
          status: 'pending',
          payment_status: 'pending',
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        variation_id: item.variation_id || null,
        product_name_en: item.product?.name_en || '',
        product_name_ar: item.product?.name_ar || null,
        variation_name: item.variation?.name_en || null,
        quantity: item.quantity,
        unit_price: item.product?.sale_price || item.product?.base_price || 0,
        total_price: (item.product?.sale_price || item.product?.base_price || 0) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Record coupon usage if applied
      if (appliedCoupon) {
        await supabase
          .from('coupon_usages')
          .insert({
            coupon_id: appliedCoupon.id,
            user_id: user.id,
            order_id: order.id,
            discount_applied: discountAmount,
          });
      }

      // Clear cart after successful order
      await clearCart();
      
      // Send order confirmation email
      try {
        const orderItems = cartItems.map((item) => ({
          name: isRTL && item.product?.name_ar ? item.product.name_ar : item.product?.name_en || '',
          quantity: item.quantity,
          price: (item.product?.sale_price || item.product?.base_price || 0) * item.quantity,
        }));

        await supabase.functions.invoke('send-order-email', {
          body: {
            type: 'confirmation',
            order_id: order.id,
            order_number: order.order_number,
            customer_email: formData.email,
            customer_name: `${formData.firstName} ${formData.lastName}`,
            language: isRTL ? 'ar' : 'en',
            total_amount: total,
            items: orderItems,
            shipping_address: {
              address: formData.address,
              city: formData.city,
              area: formData.area,
            },
          },
        });
        console.log('Order confirmation email sent');
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't block order completion if email fails
      }
      
      setOrderNumber(order.order_number);
      setCurrentStep('confirmation');
    } catch (error: any) {
      console.error('Order placement error:', error);
      toast({
        title: t('common.error', 'Error'),
        description: error.message || t('checkout.orderFailed', 'Failed to place order'),
        variant: 'destructive',
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Redirect if cart is empty (except on confirmation)
  useEffect(() => {
    if (currentStep !== 'confirmation' && cartItems.length === 0 && !orderNumber) {
      // Allow some time for cart to load
      const timer = setTimeout(() => {
        if (cartItems.length === 0) {
          navigate('/cart');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cartItems, currentStep, orderNumber, navigate]);

  return (
    <StorefrontLayout>
      {/* Page Header */}
      <div className="bg-muted/30 py-6">
        <div className="container">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">{t('nav.home', 'Home')}</Link>
            <span className="mx-2">/</span>
            <Link to="/cart" className="hover:text-primary">{t('cart.title', 'Cart')}</Link>
            <span className="mx-2">/</span>
            <span>{t('checkout.title', 'Checkout')}</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-bold">{t('checkout.title', 'Checkout')}</h1>
        </div>
      </div>

      <div className="container py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => index < currentStepIndex && setCurrentStep(step.key)}
                  disabled={index > currentStepIndex}
                  className={`flex flex-col items-center ${
                    index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
                  } ${index < currentStepIndex ? 'cursor-pointer' : ''}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                      index <= currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step.icon}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-24 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Shipping Step */}
                {currentStep === 'shipping' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {t('checkout.shippingAddress', 'Shipping Address')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">{t('checkout.firstName', 'First Name')} *</Label>
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">{t('checkout.lastName', 'Last Name')} *</Label>
                          <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('checkout.email', 'Email')} *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">{t('checkout.phone', 'Phone')} *</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">{t('checkout.address', 'Address')} *</Label>
                        <Textarea
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder={t('checkout.addressPlaceholder', 'Block, Street, Building, Floor, Apartment')}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">{t('checkout.city', 'City')} *</Label>
                          <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="area">{t('checkout.area', 'Area')}</Label>
                          <Input
                            id="area"
                            value={formData.area}
                            onChange={(e) => handleInputChange('area', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">{t('checkout.notes', 'Order Notes')}</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder={t('checkout.notesPlaceholder', 'Any special instructions...')}
                        />
                      </div>

                      <Button onClick={nextStep} className="w-full">
                        {t('checkout.continue', 'Continue')}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Delivery Step */}
                {currentStep === 'delivery' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        {t('checkout.deliveryMethod', 'Delivery Method')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <RadioGroup
                        value={formData.deliveryMethod}
                        onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                        className="space-y-3"
                      >
                        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="standard" id="standard" />
                            <div>
                              <p className="font-medium">{t('checkout.standard', 'Standard Delivery')}</p>
                              <p className="text-sm text-muted-foreground">3-5 {t('checkout.businessDays', 'business days')}</p>
                            </div>
                          </div>
                          <span className="font-semibold">3.000 {t('currency', 'KWD')}</span>
                        </label>

                        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="express" id="express" />
                            <div>
                              <p className="font-medium">{t('checkout.express', 'Express Delivery')}</p>
                              <p className="text-sm text-muted-foreground">1-2 {t('checkout.businessDays', 'business days')}</p>
                            </div>
                          </div>
                          <span className="font-semibold">5.000 {t('currency', 'KWD')}</span>
                        </label>

                        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="sameday" id="sameday" />
                            <div>
                              <p className="font-medium">{t('checkout.sameDay', 'Same Day Delivery')}</p>
                              <p className="text-sm text-muted-foreground">{t('checkout.sameDayNote', 'Order before 2 PM')}</p>
                            </div>
                          </div>
                          <span className="font-semibold">8.000 {t('currency', 'KWD')}</span>
                        </label>
                      </RadioGroup>

                      <div className="flex gap-4">
                        <Button variant="outline" onClick={prevStep} className="flex-1">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          {t('checkout.back', 'Back')}
                        </Button>
                        <Button onClick={nextStep} className="flex-1">
                          {t('checkout.continue', 'Continue')}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Step */}
                {currentStep === 'payment' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        {t('checkout.paymentMethod', 'Payment Method')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={(value) => handleInputChange('paymentMethod', value)}
                        className="space-y-3"
                      >
                        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="cod" id="cod" />
                            <div>
                              <p className="font-medium">{t('checkout.cod', 'Cash on Delivery')}</p>
                              <p className="text-sm text-muted-foreground">{t('checkout.codNote', 'Pay when you receive')}</p>
                            </div>
                          </div>
                        </label>

                        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="wamad_transfer" id="wamad_transfer" />
                            <div>
                              <p className="font-medium">{t('checkout.wamad', 'Wamad Transfer')}</p>
                              <p className="text-sm text-muted-foreground">{t('checkout.wamadNote', 'Bank transfer via Wamad')}</p>
                            </div>
                          </div>
                        </label>

                        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors opacity-50">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value="knet" id="knet" disabled />
                            <div>
                              <p className="font-medium">{t('checkout.knet', 'K-Net')}</p>
                              <p className="text-sm text-muted-foreground">{t('checkout.comingSoon', 'Coming soon')}</p>
                            </div>
                          </div>
                        </label>
                      </RadioGroup>

                      <div className="flex items-start gap-2 pt-4">
                        <Checkbox
                          id="terms"
                          checked={formData.agreeTerms}
                          onCheckedChange={(checked) => handleInputChange('agreeTerms', checked as boolean)}
                        />
                        <label htmlFor="terms" className="text-sm">
                          {t('checkout.agreeTerms', 'I agree to the')}{' '}
                          <Link to="/terms" className="text-primary hover:underline">
                            {t('checkout.termsLink', 'Terms & Conditions')}
                          </Link>
                        </label>
                      </div>

                      <div className="flex gap-4">
                        <Button variant="outline" onClick={prevStep} className="flex-1">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          {t('checkout.back', 'Back')}
                        </Button>
                        <Button 
                          onClick={handlePlaceOrder} 
                          className="flex-1"
                          disabled={!formData.agreeTerms || isPlacingOrder}
                        >
                          {isPlacingOrder ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {t('checkout.placingOrder', 'Placing Order...')}
                            </>
                          ) : (
                            <>
                              {t('checkout.placeOrder', 'Place Order')}
                              <CheckCircle className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Confirmation Step */}
                {currentStep === 'confirmation' && (
                  <Card className="text-center">
                    <CardContent className="py-12">
                      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">{t('checkout.orderPlaced', 'Order Placed!')}</h2>
                      <p className="text-muted-foreground mb-4">
                        {t('checkout.orderNumber', 'Order Number')}: <strong>{orderNumber}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                        {t('checkout.confirmationMessage', 'Thank you for your order. You will receive a confirmation email shortly with your order details and tracking information.')}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild>
                          <Link to="/account/orders">{t('checkout.viewOrders', 'View My Orders')}</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link to="/shop">{t('checkout.continueShopping', 'Continue Shopping')}</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          {currentStep !== 'confirmation' && (
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>{t('checkout.orderSummary', 'Order Summary')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product?.name_en || 'Product'} × {item.quantity}
                      </span>
                      <span>
                        {((item.product?.sale_price || item.product?.base_price || 0) * item.quantity).toFixed(3)} {t('currency', 'KWD')}
                      </span>
                    </div>
                  ))}

                  <Separator />

                  {/* Coupon Section */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      {t('checkout.couponCode', 'Coupon Code')}
                    </Label>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                            {appliedCoupon.code}
                          </Badge>
                          <span className="text-sm text-green-700 dark:text-green-300">
                            {appliedCoupon.discount_type === 'percentage' 
                              ? `${appliedCoupon.discount_value}% ${t('checkout.off', 'off')}`
                              : `${appliedCoupon.discount_value} KWD ${t('checkout.off', 'off')}`}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeCoupon}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder={t('checkout.enterCode', 'Enter code')}
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className="uppercase"
                        />
                        <Button 
                          variant="outline" 
                          onClick={handleApplyCoupon}
                          disabled={isValidating || !couponCode.trim()}
                        >
                          {isValidating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t('checkout.apply', 'Apply')
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('checkout.subtotal', 'Subtotal')}</span>
                    <span>{subtotal.toFixed(3)} {t('currency', 'KWD')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('checkout.delivery', 'Delivery')}</span>
                    <span>{deliveryCost.toFixed(3)} {t('currency', 'KWD')}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>{t('checkout.discount', 'Discount')}</span>
                      <span>-{discountAmount.toFixed(3)} {t('currency', 'KWD')}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>{t('checkout.total', 'Total')}</span>
                    <span className="text-primary">{total.toFixed(3)} {t('currency', 'KWD')}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
};

export default Checkout;
