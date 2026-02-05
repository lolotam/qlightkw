import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderEmailRequest {
  type: "confirmation" | "status_update";
  order_id: string;
  order_number: string;
  customer_email: string;
  customer_name: string;
  language: "en" | "ar";
  total_amount: number;
  status?: string;
  previous_status?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shipping_address?: {
    address: string;
    city: string;
    area?: string;
  };
}

// Status translations
const statusTranslations: Record<string, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "قيد الانتظار" },
  confirmed: { en: "Confirmed", ar: "تم التأكيد" },
  processing: { en: "Processing", ar: "قيد المعالجة" },
  shipped: { en: "Shipped", ar: "تم الشحن" },
  delivered: { en: "Delivered", ar: "تم التوصيل" },
  cancelled: { en: "Cancelled", ar: "ملغي" },
  refunded: { en: "Refunded", ar: "تم الاسترداد" },
};

// Generate order confirmation email HTML
function generateConfirmationEmail(data: OrderEmailRequest): string {
  const isArabic = data.language === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const align = isArabic ? "right" : "left";

  const content = isArabic
    ? {
        title: "شكراً لطلبك!",
        greeting: `مرحباً ${data.customer_name}،`,
        message: "لقد استلمنا طلبك بنجاح وسنبدأ في معالجته قريباً.",
        orderNumber: "رقم الطلب",
        orderTotal: "إجمالي الطلب",
        items: "المنتجات",
        shippingTo: "الشحن إلى",
        trackOrder: "تتبع طلبك",
        thankYou: "شكراً لتسوقك معنا!",
        team: "فريق Quality Light",
        currency: "د.ك",
        qty: "الكمية",
      }
    : {
        title: "Thank You for Your Order!",
        greeting: `Hello ${data.customer_name},`,
        message: "We have received your order and will start processing it soon.",
        orderNumber: "Order Number",
        orderTotal: "Order Total",
        items: "Items",
        shippingTo: "Shipping To",
        trackOrder: "Track Your Order",
        thankYou: "Thank you for shopping with us!",
        team: "Quality Light Team",
        currency: "KWD",
        qty: "Qty",
      };

  const itemsHtml = data.items
    ?.map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: ${align};">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: ${isArabic ? "left" : "right"};">${item.price.toFixed(3)} ${content.currency}</td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="${data.language}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; direction: ${dir};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Quality Light</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">✨ ${content.title}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 16px; font-size: 18px; color: #1f2937; font-weight: 600;">${content.greeting}</p>
              <p style="margin: 0 0 24px; color: #6b7280; line-height: 1.6;">${content.message}</p>
              
              <!-- Order Info Card -->
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <table style="width: 100%;">
                  <tr>
                    <td style="text-align: ${align};">
                      <p style="margin: 0 0 4px; color: #92400e; font-size: 12px; text-transform: uppercase; font-weight: 600;">${content.orderNumber}</p>
                      <p style="margin: 0; color: #78350f; font-size: 24px; font-weight: 700;">${data.order_number}</p>
                    </td>
                    <td style="text-align: ${isArabic ? "left" : "right"};">
                      <p style="margin: 0 0 4px; color: #92400e; font-size: 12px; text-transform: uppercase; font-weight: 600;">${content.orderTotal}</p>
                      <p style="margin: 0; color: #78350f; font-size: 24px; font-weight: 700;">${data.total_amount.toFixed(3)} ${content.currency}</p>
                    </td>
                  </tr>
                </table>
              </div>
              
              ${
                data.items && data.items.length > 0
                  ? `
              <!-- Items Table -->
              <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 16px; font-weight: 600;">${content.items}</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: ${align}; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isArabic ? "المنتج" : "Product"}</th>
                    <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${content.qty}</th>
                    <th style="padding: 12px; text-align: ${isArabic ? "left" : "right"}; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">${isArabic ? "السعر" : "Price"}</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              `
                  : ""
              }
              
              ${
                data.shipping_address
                  ? `
              <!-- Shipping Address -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 14px; font-weight: 600;">${content.shippingTo}</h3>
                <p style="margin: 0; color: #6b7280; line-height: 1.6;">
                  ${data.shipping_address.address}<br>
                  ${data.shipping_address.city}${data.shipping_address.area ? `, ${data.shipping_address.area}` : ""}
                </p>
              </div>
              `
                  : ""
              }
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://qlightkw.lovable.app/account/orders" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">${content.trackOrder}</a>
              </div>
              
              <p style="margin: 24px 0 0; color: #6b7280; text-align: center; line-height: 1.6;">${content.thankYou}</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 24px 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">${content.team}</p>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} Quality Light. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Generate status update email HTML
function generateStatusUpdateEmail(data: OrderEmailRequest): string {
  const isArabic = data.language === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const status = data.status || "pending";
  const statusText = statusTranslations[status]?.[data.language] || status;

  const statusEmoji: Record<string, string> = {
    pending: "⏳",
    confirmed: "✅",
    processing: "📦",
    shipped: "🚚",
    delivered: "🎉",
    cancelled: "❌",
    refunded: "💰",
  };

  const statusColor: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#3b82f6",
    processing: "#8b5cf6",
    shipped: "#6366f1",
    delivered: "#10b981",
    cancelled: "#ef4444",
    refunded: "#6b7280",
  };

  const content = isArabic
    ? {
        title: "تحديث حالة الطلب",
        greeting: `مرحباً ${data.customer_name}،`,
        message: `تم تحديث حالة طلبك رقم <strong>${data.order_number}</strong> إلى:`,
        statusLabel: "الحالة الجديدة",
        viewOrder: "عرض تفاصيل الطلب",
        team: "فريق Quality Light",
        statusMessages: {
          confirmed: "تم تأكيد طلبك وسيتم البدء في تجهيزه قريباً.",
          processing: "طلبك قيد التجهيز الآن.",
          shipped: "تم شحن طلبك! سيصلك قريباً.",
          delivered: "تم توصيل طلبك بنجاح! نأمل أن تكون راضياً عن مشترياتك.",
          cancelled: "تم إلغاء طلبك. إذا كان لديك أي استفسار، يرجى التواصل معنا.",
          refunded: "تم استرداد المبلغ. سيظهر في حسابك خلال 5-7 أيام عمل.",
        },
      }
    : {
        title: "Order Status Update",
        greeting: `Hello ${data.customer_name},`,
        message: `Your order <strong>${data.order_number}</strong> has been updated to:`,
        statusLabel: "New Status",
        viewOrder: "View Order Details",
        team: "Quality Light Team",
        statusMessages: {
          confirmed: "Your order has been confirmed and will be prepared soon.",
          processing: "Your order is now being prepared.",
          shipped: "Your order has been shipped! It's on its way to you.",
          delivered: "Your order has been delivered! We hope you enjoy your purchase.",
          cancelled: "Your order has been cancelled. Please contact us if you have any questions.",
          refunded: "Your refund has been processed. It should appear in your account within 5-7 business days.",
        },
      };

  const statusMessage = content.statusMessages[status as keyof typeof content.statusMessages] || "";

  return `
<!DOCTYPE html>
<html lang="${data.language}" dir="${dir}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; direction: ${dir};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Quality Light</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">📦 ${content.title}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 16px; font-size: 18px; color: #1f2937; font-weight: 600;">${content.greeting}</p>
              <p style="margin: 0 0 24px; color: #6b7280; line-height: 1.6;">${content.message}</p>
              
              <!-- Status Badge -->
              <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; background-color: ${statusColor[status] || "#6b7280"}20; border: 2px solid ${statusColor[status] || "#6b7280"}; border-radius: 50px; padding: 16px 32px;">
                  <span style="font-size: 32px;">${statusEmoji[status] || "📦"}</span>
                  <p style="margin: 8px 0 0; color: ${statusColor[status] || "#6b7280"}; font-size: 20px; font-weight: 700;">${statusText}</p>
                </div>
              </div>
              
              ${statusMessage ? `<p style="margin: 0 0 24px; color: #6b7280; line-height: 1.6; text-align: center; font-size: 16px;">${statusMessage}</p>` : ""}
              
              <!-- Order Number Card -->
              <div style="background: #f9fafb; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 4px; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600;">${isArabic ? "رقم الطلب" : "Order Number"}</p>
                <p style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 700;">${data.order_number}</p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://qlightkw.lovable.app/account/orders" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">${content.viewOrder}</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1f2937; padding: 24px 30px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 14px;">${content.team}</p>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 12px;">© ${new Date().getFullYear()} Quality Light. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderEmailRequest = await req.json();
    console.log("Received order email request:", { type: data.type, order_number: data.order_number, language: data.language });

    // Validate required fields
    if (!data.customer_email || !data.order_number || !data.type) {
      throw new Error("Missing required fields: customer_email, order_number, or type");
    }

    let html: string;
    let subject: string;

    if (data.type === "confirmation") {
      html = generateConfirmationEmail(data);
      subject = data.language === "ar" 
        ? `تأكيد الطلب - ${data.order_number}` 
        : `Order Confirmation - ${data.order_number}`;
    } else {
      html = generateStatusUpdateEmail(data);
      const statusText = statusTranslations[data.status || "pending"]?.[data.language] || data.status;
      subject = data.language === "ar"
        ? `تحديث حالة الطلب ${data.order_number} - ${statusText}`
        : `Order ${data.order_number} Status Update - ${statusText}`;
    }

    const emailResponse = await resend.emails.send({
      from: "Quality Light <info@qlightkw.com>",
      to: [data.customer_email],
      subject,
      html,
    });

    console.log("Order email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
