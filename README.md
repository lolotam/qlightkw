# QLight Kuwait

A full-stack bilingual (English / Arabic) e-commerce platform for a lighting products store serving the Kuwait market. Features a customer-facing storefront with RTL support and a comprehensive admin dashboard.

**Live URL:** <https://qlightkw.lovable.app>

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 5, Tailwind CSS |
| **UI Components** | shadcn/ui (Radix UI primitives), Lucide icons, Framer Motion |
| **State Management** | TanStack React Query, React Context (Theme, Language, Auth, Cart) |
| **Rich Text Editor** | TipTap |
| **Forms** | React Hook Form + Zod validation |
| **Routing** | React Router DOM v6 with animated page transitions |
| **Internationalization** | i18next (English + Arabic with full RTL) |
| **Charts** | Recharts |
| **Carousel** | Embla Carousel |
| **Drag & Drop** | dnd-kit |
| **Backend** | Supabase — PostgreSQL, Auth, Storage, Edge Functions |
| **Deployment** | Docker + Nginx, Lovable Cloud |

---

## Directory Structure

```
src/
  assets/               Static images (blog, projects)
  components/
    admin/              Admin dashboard components (10 files)
    storefront/         Customer-facing components (15 files)
    ui/                 shadcn/ui primitives (~50 files)
  constants/            Admin constants
  contexts/             ThemeContext, LanguageContext
  hooks/                useAuth, useCart, useCoupon, useVisitorTracking, etc.
  i18n/                 i18next config + en.json, ar.json locale files
  integrations/         Supabase client and generated types
  layouts/              AccountLayout, AdminLayout, StorefrontLayout
  lib/                  Utilities (utils.ts, storage.ts, logger.ts)
  pages/
    account/            Customer account pages (5 files)
    admin/              Admin pages (30 files)
    (root)              Public pages (20 files)

supabase/
  functions/            8 Edge Functions
  migrations/           Database migrations

public/
  images/               Product, category, brand images
```

---

## Database Schema (31 tables)

### Products & Catalog

| Table | Purpose |
|---|---|
| `products` | Product listings with bilingual names, pricing, SEO fields |
| `product_images` | Gallery images per product with sort order |
| `product_variations` | Color / size / wattage variants with stock & SKU |
| `product_tags` | Many-to-many join between products and tags |
| `categories` | Hierarchical product categories (self-referencing `parent_id`) |
| `brands` | Brand entities with logos and SEO |
| `tags` | Reusable product tags |

### Orders & Cart

| Table | Purpose |
|---|---|
| `orders` | Customer orders with status, shipping, payment info |
| `order_items` | Line items per order |
| `order_status_history` | Audit trail of status changes |
| `carts` | Per-user shopping carts |
| `cart_items` | Items in a cart with quantity and variation |

### Users & Auth

| Table | Purpose |
|---|---|
| `profiles` | Extended user profiles (name, phone, language preference) |
| `user_roles` | Role assignments — `admin` or `customer` |
| `wishlists` | Per-user wishlists |
| `wishlist_items` | Products saved to a wishlist |

### Content Management

| Table | Purpose |
|---|---|
| `blog_posts` | Blog articles with bilingual content, scheduling, SEO |
| `hero_slides` | Homepage hero carousel slides (image/video, desktop/mobile) |
| `promo_banners` | Promotional banners with scheduling |
| `testimonials` | Customer testimonials with ratings |
| `projects` | Portfolio / installation showcase projects |
| `project_images` | Gallery images per project |
| `faqs` | Frequently asked questions |
| `newsletter_subscribers` | Email subscribers |

### Coupons

| Table | Purpose |
|---|---|
| `coupons` | Discount codes with rules (percentage/fixed, min order, expiry) |
| `coupon_usages` | Usage tracking per user per coupon |

### System & Observability

| Table | Purpose |
|---|---|
| `site_settings` | Key-value site configuration |
| `site_visits` | Visitor analytics (page, device, referrer, geo) |
| `system_logs` | Application logs with level and category |
| `observability_metrics` | Performance metrics (duration, error rate) |
| `observability_alert_configs` | Alert rules and thresholds |
| `observability_alert_history` | Triggered alert records |
| `observability_health_snapshots` | Periodic health score snapshots |
| `admin_inbox_messages` | Admin email inbox (sent/received) |
| `feature_toggles` | Feature flags |

### Enums

- **`app_role`**: `admin`, `customer`
- **`order_status`**: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`
- **`payment_method`**: `knet`, `cod`, `wamad_transfer`

---

## Supabase Edge Functions

| Function | Description |
|---|---|
| `ai-assistant` | AI chat assistant for storefront customers |
| `generate-ai-content` | AI-powered product description generation |
| `generate-blog-content` | AI-powered blog post generation |
| `publish-scheduled-posts` | Cron-triggered scheduled blog publishing |
| `send-admin-email` | Transactional emails to admin |
| `send-auth-email` | Authentication-related emails |
| `send-order-email` | Order confirmation and status update emails |
| `minio-storage` | Storage migration proxy (MinIO → Supabase) |

> All functions have `verify_jwt = false` in `supabase/config.toml`.

---

## Storefront Features

- Animated splash screen and page transitions (Framer Motion)
- Hero carousel with dynamic slides from database
- Shop-by-category grid
- Product catalog with filtering and sorting
- Product detail page with image gallery and variations
- Shopping cart with coupon/discount support
- Multi-step checkout flow
- Wishlist
- Customer account portal (orders, addresses, settings)
- Blog with detail pages
- Projects / portfolio showcase
- Brand showcase (infinite slider)
- Testimonials section
- Newsletter subscription
- AI-powered chat assistant
- Contact page with message form
- Static pages: About, FAQ, Privacy Policy, Terms & Conditions, Returns

---

## Admin Dashboard Features

- Analytics dashboard with Recharts
- Real-time visitor tracking
- Product CRUD with image gallery, variations, and SEO fields
- Category, brand, and tag management
- Order management with status workflow and history
- Coupon / discount management
- User management with role-based access control
- Blog post editor (TipTap) with drafts and scheduling
- Hero banner / slide management
- Promo banner management
- Project / portfolio management
- Testimonial management
- Newsletter subscriber management
- Email inbox (compose and receive)
- System logs viewer
- Observability dashboard with alerts
- Image gallery, validator, and cacher tools
- Storage migration tool (MinIO → Supabase)
- Theme builder
- Inventory alerts
- API documentation page
- Site settings

---

## Authentication & Authorization

- **Supabase Auth** with email/password and Google OAuth
- Role-based access via `user_roles` table (`admin` / `customer`)
- `is_admin()` PostgreSQL function for RLS policies
- Protected admin routes in React Router

---

## Internationalization

- **Languages**: English (LTR) and Arabic (RTL)
- i18next with `en.json` and `ar.json` locale files
- `LanguageContext` provider handles direction switching on `<html>` element
- All database content tables have bilingual columns (`*_en` / `*_ar`)

---

## Storage Architecture

Four Supabase Storage buckets:

| Bucket | Content |
|---|---|
| `hero-section` | Hero carousel images and videos |
| `product-images` | Product, category, and brand images |
| `project-images` | Portfolio project images |
| `blog-images` | Blog post featured images |

`src/lib/storage.ts` provides URL normalization — converts legacy MinIO URLs (`minio.walidmohamed.com`) to Supabase Storage URLs automatically.

---

## Running Locally

### Prerequisites

- Node.js 18+ and npm

### Setup

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Environment Variables

The Supabase URL and anon key are configured in `src/integrations/supabase/client.ts`. For edge functions, set secrets via the Supabase dashboard or CLI.

---

## Docker Deployment

### Production

Builds the React app and serves via Nginx on port 3000:

```sh
docker compose up -d
```

### Development

Hot-reload dev server on port 8080:

```sh
docker compose --profile dev up dev
```

---

## License

Private — all rights reserved.
