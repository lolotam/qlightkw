# Quality Light Admin Dashboard - Complete Implementation Plan

## Overview
Complete implementation of the 21-section admin dashboard with bilingual support, glassmorphism UI, and advanced features.

---

## ✅ COMPLETED PHASES

### Phase 0: Core Foundation (DONE)
- [x] User Management, AI Content, Coupons, System Logs, Stock Triggers, RTL, Theme, AI Assistant

### Phase 1: Analytics & Visitor Tracking (DONE)
- [x] site_visits table, Enhanced Analytics, Visitors page, Auto-tracking hook

### Phase 2: Image Management Suite (DONE)
- [x] Image Gallery page (upload/delete/copy URLs)
- [x] Inventory Alerts page (low/critical/out of stock)

### Phase 3: Product & Content Features (DONE)
- [x] CSV Export for products
- [x] Promo Banners management (CRUD with scheduling)

### Remaining:
- Phase 4: Bulk price adjuster, Tags page, Scraped Products
- Phase 5: Webhook docs, Enhanced Settings

*Last updated: 2026-01-29*
- [x] AI Content Generation (Gemini API)
- [x] Coupons & Checkout integration
- [x] System Logs with filtering
- [x] Stock Management triggers (auto-reduce/restore)
- [x] Admin RTL support (sidebar flips for Arabic)
- [x] Theme toggle (dark/light mode)
- [x] AI Assistant chatbot (3D animated, Gemini, WhatsApp, Voice)
- [x] Basic Analytics page
- [x] Products, Orders, Categories, Brands management
- [x] Email Inbox (pending Resend API key)
- [x] CTA button animations

---

## 🚀 REMAINING PHASES

### Phase 1: Analytics & Visitor Tracking ✅ COMPLETED
**Goal**: Comprehensive analytics with visitor tracking

- [x] Create `site_visits` table for visitor tracking
- [x] Enhanced Analytics dashboard with Recharts
  - Revenue chart (line chart, 30 days)
  - Orders by status (pie chart)
  - Top products (bar chart)
  - Category performance (bar chart)
- [x] Visitor Analytics page
  - Daily visitors trend
  - Top pages visited
  - Traffic sources
  - Device breakdown
- [x] Auto-tracking hook for page visits

### Phase 2: Image Management Suite ⬅️ NEXT
**Goal**: Complete image lifecycle management

- [ ] Image Gallery page
  - Browse Supabase Storage
  - Upload/delete images
  - Copy public URLs
  - Filter by product/date
- [ ] Image Analytics page
  - Total images count
  - Broken image detection
  - Load time metrics
- [ ] Image Validator
  - Scan product images for broken URLs
  - Bulk fix options
  - Replace with placeholders
- [ ] Bulk Image Cacher
  - Download external images
  - Upload to Supabase Storage
  - Update product records

### Phase 3: Advanced Product Features
**Goal**: Bulk operations and inventory management

- [ ] Bulk Price Adjuster
  - Add/subtract fixed or percentage
  - Undo history (last 10)
- [ ] Bulk Tag Assignment
  - Add/remove/replace tags
  - Multi-select products
- [ ] Bulk Category Assignment
- [ ] CSV Import/Export
- [ ] Tags Management page (dedicated CRUD)
- [ ] Inventory Alerts page
  - Critical (0 stock)
  - Low (<5 stock)
  - Warning (<10 stock)
  - Quick restock action

### Phase 4: Content & Marketing
**Goal**: Promotional content management

- [ ] Promo Banners Management
  - Create/edit banners
  - Title (EN/AR)
  - Image URL, Link URL
  - Active toggle, display order
- [ ] Scraped Products page
  - View scraped data
  - Edit before importing
  - Push to main products
- [ ] Cloudinary Sync (if Cloudinary configured)
  - Sync storage to CDN
  - WebP conversion
  - Optimization settings

### Phase 5: Documentation & Settings Enhancement
**Goal**: Complete admin experience

- [ ] Webhook Documentation page
  - Order webhooks
  - Product webhooks
  - Example payloads
  - Testing tools
- [ ] Enhanced Settings (Site Builder)
  - Header settings
  - Footer settings
  - Color theme customization
  - Homepage settings
  - Backup management
- [ ] Customers page enhancement
  - View orders history
  - Total spent
  - Registration date

---

## Technical Notes

### Database Tables Needed
- `site_visits` - visitor tracking (Phase 1)
- `promo_banners` - promotional banners (Phase 4)
- `tags` - product tags (Phase 3)

### Edge Functions Needed
- `track-visit` - log page visits (Phase 1)
- `cloudinary-sync` - CDN sync (Phase 4)

### UI Components
- All new pages use glassmorphism design
- Recharts for all analytics
- Framer Motion animations
- Full RTL support
- Bilingual (EN/AR)

---

## Progress Tracking

| Phase | Status | Est. Effort |
|-------|--------|-------------|
| Phase 0 | ✅ Done | - |
| Phase 1 | 🔄 In Progress | Medium |
| Phase 2 | ⏳ Pending | High |
| Phase 3 | ⏳ Pending | High |
| Phase 4 | ⏳ Pending | Medium |
| Phase 5 | ⏳ Pending | Medium |

---

*Last updated: 2026-01-29*
