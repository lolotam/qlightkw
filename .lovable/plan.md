

# Update README.md with Full Project Documentation

## Overview

Replace the current generic README with a comprehensive document covering the full project architecture, directory structure, tech stack, database schema, edge functions, deployment, and all features.

## Content to Include

### 1. Project Title and Description
- **QLight Kuwait** -- a full-stack e-commerce platform for a lighting products store serving the Kuwait market
- Bilingual (English/Arabic) with RTL support
- Features a customer-facing storefront and a full admin dashboard

### 2. Live URLs
- Published: `https://qlightkw.lovable.app`

### 3. Tech Stack Section
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS 3
- **UI Components**: shadcn/ui (Radix UI primitives), Lucide icons, Framer Motion animations
- **State Management**: TanStack React Query, React Context (Theme, Language, Auth, Cart)
- **Rich Text Editor**: TipTap
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router DOM v6 with animated page transitions
- **Internationalization**: i18next (English + Arabic)
- **Charts**: Recharts
- **Carousel**: Embla Carousel
- **Drag & Drop**: dnd-kit
- **Backend**: Supabase (PostgreSQL database, Auth, Storage, Edge Functions)
- **Deployment**: Docker + Nginx, Lovable Cloud

### 4. Directory Structure
A clear tree diagram of the `src/` folder:

```
src/
  assets/           -- Static images (blog, projects)
  components/
    admin/          -- Admin dashboard components (10 files)
    storefront/     -- Customer-facing components (15 files)
    ui/             -- shadcn/ui primitives (~50 files)
  constants/        -- Admin constants
  contexts/         -- ThemeContext, LanguageContext
  hooks/            -- useAuth, useCart, useCoupon, useVisitorTracking, etc.
  i18n/             -- i18next config + en.json, ar.json locale files
  integrations/     -- Supabase client and generated types
  layouts/          -- AccountLayout, AdminLayout, StorefrontLayout
  lib/              -- Utilities (utils.ts, storage.ts, logger.ts)
  pages/
    account/        -- Customer account pages (5 files)
    admin/          -- Admin pages (30 files)
    (root)          -- Public pages (20 files)
supabase/
  functions/        -- 8 Edge Functions
  migrations/       -- Database migrations
public/
  images/           -- Product, category, brand images
```

### 5. Database Tables (25 tables)
List all tables derived from the Supabase types file:
- `products`, `product_images`, `product_variations`, `product_tags`
- `categories`, `brands`, `tags`
- `orders`, `order_items`, `order_status_history`
- `carts`, `cart_items`
- `profiles`, `user_roles`, `wishlist_items`
- `blog_posts`, `newsletter_subscribers`
- `hero_slides`, `promo_banners`, `testimonials`
- `projects`, `project_images`
- `coupons`, `coupon_usages`
- `faqs`, `site_settings`, `site_visits`, `system_logs`
- `observability_metrics`, `observability_alert_configs`, `observability_alert_history`, `observability_health_snapshots`
- `admin_inbox_messages`, `feature_toggles`

### 6. Supabase Edge Functions (8 functions)
- `ai-assistant` -- AI chat assistant for customers
- `generate-ai-content` -- AI product description generation
- `generate-blog-content` -- AI blog post generation
- `publish-scheduled-posts` -- Cron-triggered scheduled blog publishing
- `send-admin-email` -- Transactional emails to admin
- `send-auth-email` -- Authentication-related emails
- `send-order-email` -- Order confirmation/status emails
- `minio-storage` -- Storage migration proxy (MinIO to Supabase)

### 7. Storefront Features
- Animated splash screen and page transitions
- Hero carousel with dynamic slides from database
- Shop by category grid
- Product catalog with filtering/sorting
- Product detail with image gallery and variations
- Shopping cart with coupon support
- Checkout flow
- Wishlist
- Customer account (orders, addresses, settings)
- Blog with detail pages
- Projects/portfolio showcase
- Brand showcase
- Testimonials section
- Newsletter subscription
- AI-powered chat assistant
- Contact page with messages
- Static pages (About, FAQ, Privacy, Terms, Returns)

### 8. Admin Dashboard Features
- Analytics dashboard with charts
- Visitor tracking
- Product CRUD with image gallery, variations, and SEO
- Category, brand, and tag management
- Order management with status workflow
- Coupon/discount management
- User management with role-based access
- Blog post editor with drafts and scheduling
- Hero banner/slide management
- Promo banner management
- Project/portfolio management
- Testimonial management
- Newsletter subscriber management
- Email inbox (send/receive)
- System logs and observability
- Image gallery, validator, and cacher tools
- Storage migration tool
- Theme builder
- Inventory alerts
- API documentation page
- Site settings

### 9. Authentication and Authorization
- Supabase Auth with email/password
- Role-based access: `admin` and `customer` roles via `user_roles` table
- Protected admin routes

### 10. Internationalization
- English and Arabic with full RTL support
- Language context provider with direction switching

### 11. Running Locally
- Prerequisites, clone, install, dev server commands
- Environment variables needed (Supabase URL, Anon Key)

### 12. Docker Deployment
- Production: `docker compose up` (serves on port 3000 via Nginx)
- Development: `docker compose --profile dev up dev` (port 8080 with hot reload)

### 13. Storage Architecture
- Supabase Storage buckets: `hero-section`, `product-images`, `project-images`, `blog-images`
- URL normalization utility in `src/lib/storage.ts`

## File Changed

**`README.md`** -- Complete rewrite with all sections above.

