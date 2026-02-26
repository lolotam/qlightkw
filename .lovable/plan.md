

# Allow Embedding in iFrames

## Problem
The `nginx.conf` file currently sets `X-Frame-Options` to `SAMEORIGIN`, which prevents the site from being displayed inside an iframe on any other domain. You need to embed the site in another website's iframe.

## Solution
Remove the `X-Frame-Options` header from `nginx.conf` so the site can be loaded in iframes on any domain.

## Changes

**File: `nginx.conf`**
- Remove the line: `add_header X-Frame-Options "SAMEORIGIN" always;`
- All other security headers (`X-Content-Type-Options`, `X-XSS-Protection`) remain unchanged.

## Note
Removing `X-Frame-Options` means any website will be able to embed your site in an iframe. If you only want a specific domain to embed it, we can use `Content-Security-Policy: frame-ancestors` instead, which allows you to whitelist specific domains.

