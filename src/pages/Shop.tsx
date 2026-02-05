import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import ProductCard from '@/components/storefront/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { SlidersHorizontal, Grid3X3, List, Search, X } from 'lucide-react';
import { normalizeStorageUrl } from '@/lib/storage';

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
  base_price: number;
  sale_price: number | null;
  is_new: boolean | null;
  is_bestseller: boolean | null;
  is_featured: boolean | null;
  image_url?: string | null;
  secondary_image_url?: string | null;
}

interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
  name_ar: string | null;
}

const PRODUCTS_PER_PAGE = 12;

const Shop = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchFilters = async () => {
      const [categoriesRes, brandsRes] = await Promise.all([
        supabase.from('categories').select('id, name_en, name_ar, slug').eq('is_active', true),
        supabase.from('brands').select('id, name, name_ar').eq('is_active', true),
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (brandsRes.data) setBrands(brandsRes.data);
    };

    fetchFilters();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBrands, priceRange, sortBy]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      // First, get the count of all matching products
      let countQuery = supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true);

      // Apply the same filters for count
      if (searchQuery) {
        countQuery = countQuery.or(`name_en.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%`);
      }
      if (selectedCategory) {
        const category = categories.find(c => c.slug === selectedCategory);
        if (category) {
          countQuery = countQuery.eq('category_id', category.id);
        }
      }
      if (selectedBrands.length > 0) {
        countQuery = countQuery.in('brand_id', selectedBrands);
      }
      countQuery = countQuery.gte('base_price', priceRange[0]).lte('base_price', priceRange[1]);

      const { count } = await countQuery;
      setTotalProducts(count || 0);

      // Now fetch paginated products
      let query = supabase
        .from('products')
        .select('id, name_en, name_ar, slug, base_price, sale_price, is_new, is_bestseller, is_featured, category_id, brand_id')
        .eq('is_active', true);

      // Apply search filter
      if (searchQuery) {
        query = query.or(`name_en.ilike.%${searchQuery}%,name_ar.ilike.%${searchQuery}%`);
      }

      // Apply category filter
      if (selectedCategory) {
        const category = categories.find(c => c.slug === selectedCategory);
        if (category) {
          query = query.eq('category_id', category.id);
        }
      }

      // Apply brand filter
      if (selectedBrands.length > 0) {
        query = query.in('brand_id', selectedBrands);
      }

      // Apply price filter
      query = query.gte('base_price', priceRange[0]).lte('base_price', priceRange[1]);

      // Apply sorting
      switch (sortBy) {
        case 'price-low':
          query = query.order('base_price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('base_price', { ascending: false });
          break;
        case 'name':
          query = query.order(language === 'ar' ? 'name_ar' : 'name_en', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const from = (currentPage - 1) * PRODUCTS_PER_PAGE;
      const to = from + PRODUCTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (!error && data) {
        // Fetch product images for all products
        const productIds = data.map(p => p.id);
        if (productIds.length > 0) {
          const { data: images } = await supabase
            .from('product_images')
            .select('product_id, url, is_primary, sort_order')
            .in('product_id', productIds)
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true });

          // Map images to products - get primary and secondary image
          const productsWithImages: Product[] = data.map(product => {
            const productImages = images?.filter(img => img.product_id === product.id) || [];
            const primaryImage = productImages.find(img => img.is_primary) || productImages[0];
            const secondaryImage = productImages.find(img => !img.is_primary && img.url !== primaryImage?.url) || productImages[1];
            
            return {
              ...product,
              image_url: normalizeStorageUrl(primaryImage?.url),
              secondary_image_url: normalizeStorageUrl(secondaryImage?.url)
            };
          });

          setProducts(productsWithImages);
        } else {
          setProducts([]);
        }
      }
      setLoading(false);
    };

    fetchProducts();
  }, [searchQuery, selectedCategory, selectedBrands, priceRange, sortBy, categories, language, currentPage]);

  const handleBrandToggle = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrands([]);
    setPriceRange([0, 500]);
    setSortBy('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <h3 className="font-semibold mb-3">{t('shop.search', 'Search')}</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t('shop.searchPlaceholder', 'Search products...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">{t('shop.categories', 'Categories')}</h3>
        <div className="space-y-2">
          <Button
            variant={selectedCategory === '' ? 'secondary' : 'ghost'}
            size="sm"
            className="w-full justify-start"
            onClick={() => setSelectedCategory('')}
          >
            {t('shop.allCategories', 'All Categories')}
          </Button>
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.slug ? 'secondary' : 'ghost'}
              size="sm"
              className="w-full justify-start"
              onClick={() => setSelectedCategory(category.slug)}
            >
              {language === 'ar' ? category.name_ar : category.name_en}
            </Button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">{t('shop.priceRange', 'Price Range')}</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={500}
            step={10}
            className="mb-4"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{priceRange[0]} KWD</span>
            <span>{priceRange[1]} KWD</span>
          </div>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold mb-3">{t('shop.brands', 'Brands')}</h3>
        <div className="space-y-2">
          {brands.map(brand => (
            <label key={brand.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedBrands.includes(brand.id)}
                onCheckedChange={() => handleBrandToggle(brand.id)}
              />
              <span className="text-sm">
                {language === 'ar' && brand.name_ar ? brand.name_ar : brand.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <Button variant="outline" className="w-full" onClick={clearFilters}>
        <X className="h-4 w-4 mr-2" />
        {t('shop.clearFilters', 'Clear Filters')}
      </Button>
    </div>
  );

  return (
    <StorefrontLayout>
      {/* Page Header */}
      <div className="bg-muted/30 py-8">
        <div className="container">
          <nav className="text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">{t('nav.home', 'Home')}</Link>
            <span className="mx-2">/</span>
            <span>{t('nav.products', 'Products')}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold">
            {t('shop.title', 'Shop All Products')}
          </h1>
        </div>
      </div>

      <div className="container py-8">
        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <FiltersContent />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                {/* Mobile Filter Toggle */}
                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      {t('shop.filters', 'Filters')}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto">
                    <div className="py-4">
                      <FiltersContent />
                    </div>
                  </SheetContent>
                </Sheet>

                <p className="text-sm text-muted-foreground">
                  {t('shop.showingResults', '{{count}} products found', { count: totalProducts })}
                  {totalPages > 1 && (
                    <span className="ml-2">
                      ({t('shop.page', 'Page')} {currentPage} / {totalPages})
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t('shop.sortBy', 'Sort by')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('shop.sort.newest', 'Newest')}</SelectItem>
                    <SelectItem value="price-low">{t('shop.sort.priceLow', 'Price: Low to High')}</SelectItem>
                    <SelectItem value="price-high">{t('shop.sort.priceHigh', 'Price: High to Low')}</SelectItem>
                    <SelectItem value="name">{t('shop.sort.name', 'Name')}</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="hidden sm:flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(PRODUCTS_PER_PAGE)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-1'}`}>
                  {products.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                        
                        {getPageNumbers().map((page, index) => (
                          <PaginationItem key={index}>
                            {page === 'ellipsis' ? (
                              <PaginationEllipsis />
                            ) : (
                              <PaginationLink
                                onClick={() => handlePageChange(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            )}
                          </PaginationItem>
                        ))}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground mb-4">{t('shop.noProducts', 'No products found')}</p>
                <Button onClick={clearFilters}>{t('shop.clearFilters', 'Clear Filters')}</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
};

export default Shop;
