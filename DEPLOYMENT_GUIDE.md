# Deployment Guide - BITE ME MORE PLS

Complete instructions for deploying the static website to production.

## Pre-Deployment Checklist

Before deploying, verify the following:

- All HTML files are valid and semantic
- CSS files are optimized and minified (optional)
- JavaScript has no console errors
- All images are optimized and properly referenced
- Links are correct and working
- Mobile responsiveness is tested
- Performance metrics meet targets
- Accessibility standards are met

## Deployment Options

### Option 1: Netlify (Recommended)

Netlify offers free hosting with automatic deployments from Git.

**Steps:**

1. Create a Netlify account at https://netlify.com
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: (leave empty)
   - Publish directory: `.` or `bite-me-static`
4. Deploy by pushing to main branch
5. Configure custom domain in Netlify settings

**Benefits:**
- Free SSL certificate
- Automatic deployments
- CDN included
- Analytics available

### Option 2: Vercel

Vercel specializes in static site hosting with excellent performance.

**Steps:**

1. Create a Vercel account at https://vercel.com
2. Import your Git repository
3. Configure project:
   - Framework: Other
   - Build command: (leave empty)
   - Output directory: `.`
4. Deploy
5. Add custom domain in project settings

**Benefits:**
- Fast global CDN
- Automatic HTTPS
- Environment variables support
- Analytics and monitoring

### Option 3: GitHub Pages

Free hosting directly from GitHub repository.

**Steps:**

1. Push code to GitHub repository
2. Go to repository Settings → Pages
3. Select branch: `main` or `gh-pages`
4. Select folder: `/ (root)`
5. Click Save
6. Add custom domain (optional)

**Benefits:**
- Free hosting
- Integrated with Git workflow
- No build process needed
- Custom domain support

### Option 4: Traditional Web Hosting

Deploy to any standard web hosting provider.

**Steps:**

1. Connect via FTP/SFTP using credentials from hosting provider
2. Upload all files to public_html directory:
   ```
   public_html/
   ├── index.html
   ├── css/
   ├── js/
   └── assets/
   ```
3. Verify files are uploaded correctly
4. Test website in browser
5. Configure DNS records for custom domain

**Popular Providers:**
- Bluehost
- GoDaddy
- HostGator
- SiteGround
- Dreamhost

## Production Optimization

### 1. Minify Assets

**CSS Minification:**
```bash
# Using csso-cli
npm install -g csso-cli
csso css/styles.css css/responsive.css -o css/styles.min.css
```

**JavaScript Minification:**
```bash
# Using terser
npm install -g terser
terser js/scripts.js -o js/scripts.min.js
```

**Update HTML references:**
```html
<link rel="stylesheet" href="css/styles.min.css">
<script src="js/scripts.min.js" defer></script>
```

### 2. Image Optimization

**Reduce file sizes:**
```bash
# Using ImageMagick
convert image.jpg -quality 85 image-optimized.jpg

# Using ImageOptim (macOS)
imageoptim assets/images/*.jpg

# Using TinyPNG API
# Visit https://tinypng.com for batch optimization
```

**Convert to WebP format:**
```bash
# Using cwebp
cwebp image.jpg -o image.webp

# Update HTML with fallback:
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description">
</picture>
```

### 3. Enable Gzip Compression

**For Netlify/Vercel:**
- Automatically enabled (no action needed)

**For traditional hosting (.htaccess):**
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### 4. Set Cache Headers

**For Netlify (netlify.toml):**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "/assets/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**For traditional hosting (.htaccess):**
```apache
<FilesMatch "\.(jpg|jpeg|png|gif|ico|css|js)$">
  Header set Cache-Control "max-age=31536000, public"
</FilesMatch>
```

### 5. Add Security Headers

**For Netlify (netlify.toml):**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "SAMEORIGIN"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**For traditional hosting (.htaccess):**
```apache
Header set X-Content-Type-Options "nosniff"
Header set X-Frame-Options "SAMEORIGIN"
Header set X-XSS-Protection "1; mode=block"
Header set Referrer-Policy "strict-origin-when-cross-origin"
```

## Domain Configuration

### Using Custom Domain

**For Netlify:**
1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain name
4. Follow DNS configuration instructions
5. Wait for DNS propagation (up to 48 hours)

**For Vercel:**
1. Go to Project settings → Domains
2. Enter your domain name
3. Add DNS records as shown
4. Verify domain ownership

**For GitHub Pages:**
1. Create CNAME file in repository root:
   ```
   yourdomain.com
   ```
2. Push to repository
3. Update DNS records at domain registrar
4. Point to GitHub Pages servers

### DNS Records

Update these records at your domain registrar:

**For Netlify:**
```
A Record: 75.2.60.5
```

**For Vercel:**
```
A Record: 76.76.19.165
AAAA Record: 2610:7d7:4054::1:0:0:0
```

**For GitHub Pages:**
```
A Records:
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153

AAAA Records:
  2606:50c0:8000::153
  2606:50c0:8001::153
  2606:50c0:8002::153
  2606:50c0:8003::153
```

## SSL/HTTPS

All modern hosting providers automatically provide SSL certificates:

- **Netlify**: Automatic Let's Encrypt certificate
- **Vercel**: Automatic certificate
- **GitHub Pages**: Automatic certificate
- **Traditional hosting**: Use Let's Encrypt (free) or purchase certificate

### Verify SSL

Visit your deployed site and check:
1. URL shows `https://` (not `http://`)
2. Lock icon appears in address bar
3. Certificate is valid (click lock icon to verify)

## Monitoring & Analytics

### Enable Analytics

**Google Analytics:**
1. Create account at https://analytics.google.com
2. Add tracking code to HTML:
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```
3. Replace `GA_MEASUREMENT_ID` with your ID
4. Verify tracking in Analytics dashboard

**Netlify Analytics:**
1. Enable in Site settings → Analytics
2. View analytics in Netlify dashboard
3. No code changes needed

### Performance Monitoring

**Use Lighthouse:**
```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse https://yourdomain.com --view
```

**Use PageSpeed Insights:**
- Visit https://pagespeed.web.dev
- Enter your domain
- Review recommendations

## Troubleshooting Deployment

### Site Not Loading

**Check:**
1. Verify files are uploaded correctly
2. Check file permissions (644 for files, 755 for directories)
3. Verify DNS records are correct
4. Wait for DNS propagation (up to 48 hours)
5. Clear browser cache

### CSS/JS Not Loading

**Check:**
1. Verify file paths in HTML
2. Check file permissions
3. Ensure files are in correct directories
4. Verify MIME types are correct

### Images Not Showing

**Check:**
1. Verify image paths in HTML
2. Check image file names match exactly
3. Verify image files are uploaded
4. Check file permissions

### Slow Performance

**Optimize:**
1. Minify CSS and JavaScript
2. Optimize and compress images
3. Enable gzip compression
4. Set proper cache headers
5. Use CDN for static assets

## Rollback Procedure

If deployment has issues:

**For Netlify:**
1. Go to Deploys tab
2. Click on previous successful deploy
3. Click "Publish deploy"

**For Vercel:**
1. Go to Deployments tab
2. Find previous successful deployment
3. Click three dots → Promote to Production

**For GitHub Pages:**
1. Revert commits in Git
2. Push to repository
3. GitHub Pages automatically redeploys

**For Traditional Hosting:**
1. Keep backup of previous version
2. Upload previous files via FTP
3. Verify website is restored

## Maintenance

### Regular Tasks

**Weekly:**
- Monitor analytics
- Check for broken links
- Review error logs

**Monthly:**
- Update content as needed
- Review performance metrics
- Check security headers

**Quarterly:**
- Audit accessibility
- Test on new browser versions
- Review SEO metrics

### Backup Strategy

1. **Automated backups:**
   - GitHub: Automatic version control
   - Netlify: Automatic deployment history
   - Vercel: Automatic deployment history

2. **Manual backups:**
   - Download all files regularly
   - Store in cloud storage (Google Drive, Dropbox)
   - Keep local backup on computer

## Support & Resources

### Documentation
- Netlify Docs: https://docs.netlify.com
- Vercel Docs: https://vercel.com/docs
- GitHub Pages: https://pages.github.com
- MDN Web Docs: https://developer.mozilla.org

### Tools
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- PageSpeed Insights: https://pagespeed.web.dev
- WebPageTest: https://www.webpagetest.org
- GTmetrix: https://gtmetrix.com

### Community
- Stack Overflow: https://stackoverflow.com
- Dev.to: https://dev.to
- CSS-Tricks: https://css-tricks.com
- Web.dev: https://web.dev

---

**Last Updated**: January 2025
**Version**: 1.0.0
