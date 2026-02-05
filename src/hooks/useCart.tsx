import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  id: string;
  product_id: string;
  variation_id: string | null;
  quantity: number;
  product?: {
    name_en: string;
    name_ar: string | null;
    slug: string;
    base_price: number;
    sale_price: number | null;
    image_url?: string;
  };
  variation?: {
    name_en: string | null;
    name_ar: string | null;
    price_modifier: number;
  } | null;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  cartId: string | null;
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, quantity: number, variationId?: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate totals
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const basePrice = item.product?.sale_price || item.product?.base_price || 0;
    const modifier = item.variation?.price_modifier || 0;
    return sum + (basePrice + modifier) * item.quantity;
  }, 0);

  // Fetch cart on user change
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // Load from localStorage for guests
      loadGuestCart();
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get user's cart
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cart) {
        setCartId(cart.id);

        // Get cart items with product details
        const { data: cartItems } = await supabase
          .from('cart_items')
          .select(`
            id,
            product_id,
            variation_id,
            quantity,
            products (
              name_en,
              name_ar,
              slug,
              base_price,
              sale_price
            ),
            product_variations (
              name_en,
              name_ar,
              price_modifier
            )
          `)
          .eq('cart_id', cart.id);

        if (cartItems) {
          // Fetch images for each product
          const itemsWithImages = await Promise.all(
            cartItems.map(async (item: any) => {
              const { data: image } = await supabase
                .from('product_images')
                .select('url')
                .eq('product_id', item.product_id)
                .eq('is_primary', true)
                .maybeSingle();

              return {
                id: item.id,
                product_id: item.product_id,
                variation_id: item.variation_id,
                quantity: item.quantity,
                product: item.products ? {
                  ...item.products,
                  image_url: image?.url,
                } : undefined,
                variation: item.product_variations || null,
              };
            })
          );

          setItems(itemsWithImages);
        }
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
    setIsLoading(false);
  };

  const loadGuestCart = () => {
    const saved = localStorage.getItem('guest_cart');
    if (saved) {
      setItems(JSON.parse(saved));
    }
    setIsLoading(false);
  };

  const saveGuestCart = (newItems: CartItem[]) => {
    localStorage.setItem('guest_cart', JSON.stringify(newItems));
    setItems(newItems);
  };

  const addItem = async (productId: string, quantity: number, variationId?: string) => {
    if (user && cartId) {
      // Check if item already exists
      const existingItem = items.find(
        (item) => item.product_id === productId && item.variation_id === (variationId || null)
      );

      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      } else {
        const { error } = await supabase.from('cart_items').insert({
          cart_id: cartId,
          product_id: productId,
          variation_id: variationId || null,
          quantity,
        });

        if (!error) {
          await fetchCart();
        }
      }
    } else {
      // Guest cart - fetch product info first
      const { data: product } = await supabase
        .from('products')
        .select('name_en, name_ar, slug, base_price, sale_price')
        .eq('id', productId)
        .single();

      const { data: image } = await supabase
        .from('product_images')
        .select('url')
        .eq('product_id', productId)
        .eq('is_primary', true)
        .maybeSingle();

      let variation = null;
      if (variationId) {
        const { data: varData } = await supabase
          .from('product_variations')
          .select('name_en, name_ar, price_modifier')
          .eq('id', variationId)
          .single();
        variation = varData;
      }

      const existingIndex = items.findIndex(
        (item) => item.product_id === productId && item.variation_id === (variationId || null)
      );

      if (existingIndex >= 0) {
        const newItems = [...items];
        newItems[existingIndex].quantity += quantity;
        saveGuestCart(newItems);
      } else {
        const newItem: CartItem = {
          id: crypto.randomUUID(),
          product_id: productId,
          variation_id: variationId || null,
          quantity,
          product: product ? { ...product, image_url: image?.url } : undefined,
          variation,
        };
        saveGuestCart([...items, newItem]);
      }
    }
  };

  const removeItem = async (itemId: string) => {
    if (user && cartId) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (!error) {
        setItems(items.filter((item) => item.id !== itemId));
      }
    } else {
      saveGuestCart(items.filter((item) => item.id !== itemId));
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }

    if (user && cartId) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (!error) {
        setItems(items.map((item) => (item.id === itemId ? { ...item, quantity } : item)));
      }
    } else {
      saveGuestCart(items.map((item) => (item.id === itemId ? { ...item, quantity } : item)));
    }
  };

  const clearCart = async () => {
    if (user && cartId) {
      await supabase.from('cart_items').delete().eq('cart_id', cartId);
    }
    setItems([]);
    localStorage.removeItem('guest_cart');
  };

  const refreshCart = async () => {
    if (user) {
      await fetchCart();
    } else {
      loadGuestCart();
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        cartId,
        itemCount,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
