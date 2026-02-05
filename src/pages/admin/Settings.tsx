import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  CreditCard,
  Store,
  Truck,
  Clock,
  Save,
  Loader2,
  Sparkles,
  Image,
  FileText,
  Key,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ChevronsUpDown,
  Check,
  Shield,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Settings type - API keys now stored securely in database secrets
interface SiteSettings {
  payment_methods: {
    knet: boolean;
    cod: boolean;
    wamad_transfer: boolean;
  };
  store_info: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  shipping_rates: {
    standard: number;
    express: number;
    same_day: number;
  };
  business_hours: Record<string, string>;
  ai_settings?: {
    // Separate providers for each service
    image_provider: 'google' | 'openrouter';
    chat_provider: 'google' | 'openrouter';
    // Google models
    google_image_model: string;
    google_text_model: string;
    // OpenRouter models
    openrouter_text_model?: string;
    openrouter_image_model?: string;
    // Other settings
    auto_generate_description: boolean;
    // Legacy - keep for backwards compatibility
    ai_provider?: 'google' | 'openrouter';
    image_model?: string;
    text_model?: string;
  };
}

// Google AI Image Models with correct endpoint names
const GOOGLE_IMAGE_MODELS = [
  { value: 'gemini-2.5-flash-image', label: 'Nano Banana (Gemini 2.5 Flash Image)', description: 'Fast & efficient image generation' },
  { value: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro (Gemini 3 Pro Image)', description: 'Professional quality with advanced reasoning' },
  { value: 'imagen-3.0-generate-002', label: 'Imagen 3.0', description: 'High quality Imagen model' },
  { value: 'imagen-3.0-fast-generate-001', label: 'Imagen 3.0 Fast', description: 'Faster Imagen generation' },
];

// Google AI Text Models
const GOOGLE_TEXT_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Fast & efficient' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', description: 'Lightweight' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Latest flash model' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', description: 'Most capable' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', description: 'Balanced' },
];

// OpenRouter model interface
interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
  context_length?: number;
  architecture?: {
    modality: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRTL = i18n.language === 'ar';

  // OpenRouter model selection states
  const [openTextModel, setOpenTextModel] = useState(false);
  const [openImageModel, setOpenImageModel] = useState(false);
  const [textModelSearch, setTextModelSearch] = useState('');
  const [imageModelSearch, setImageModelSearch] = useState('');

  // Fetch all settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async (): Promise<Record<string, any>> => {
      const { data, error } = await supabase.from('site_settings').select('key, value');
      if (error) throw error;

      // Convert array to object
      const settingsObj: Record<string, any> = {};
      data?.forEach((item) => {
        settingsObj[item.key] = item.value;
      });
      return settingsObj;
    },
  });

  // Fetch OpenRouter models
  const { data: openRouterModels, isLoading: isLoadingModels, refetch: refetchModels } = useQuery({
    queryKey: ['openrouter-models'],
    queryFn: async (): Promise<OpenRouterModel[]> => {
      try {
        // Fetch from OpenRouter API directly (no auth needed for models list)
        const response = await fetch('https://openrouter.ai/api/v1/models');
        if (!response.ok) throw new Error('Failed to fetch models');
        const data = await response.json();
        return data.data || [];
      } catch (error) {
        console.error('Failed to fetch OpenRouter models:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  // Filter models for text and image generation
  const textModels = openRouterModels?.filter(m => 
    m.architecture?.modality?.includes('text') || 
    m.architecture?.output_modalities?.includes('text')
  ) || [];

  const imageModels = openRouterModels?.filter(m => 
    m.architecture?.output_modalities?.includes('image') ||
    m.id.includes('image') ||
    m.id.includes('dall-e') ||
    m.id.includes('stable-diffusion') ||
    m.id.includes('midjourney') ||
    m.id.includes('flux')
  ) || [];

  // Update setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      // Check if setting exists
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value })
          .eq('key', key);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: t('admin.settingsSaved', 'Settings saved') });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: t('admin.error', 'Error'),
        description: error.message,
      });
    },
  });

  // Local state for forms
  const [paymentMethods, setPaymentMethods] = useState<SiteSettings['payment_methods'] | null>(null);
  const [storeInfo, setStoreInfo] = useState<SiteSettings['store_info'] | null>(null);
  const [shippingRates, setShippingRates] = useState<SiteSettings['shipping_rates'] | null>(null);
  const [aiSettings, setAiSettings] = useState<SiteSettings['ai_settings'] | null>(null);

  // Initialize local state when settings load
  useEffect(() => {
    if (settings) {
      if (!paymentMethods) {
        setPaymentMethods(settings.payment_methods || { knet: false, cod: true, wamad_transfer: true });
      }
      if (!storeInfo) {
        setStoreInfo(settings.store_info || { name: '', phone: '', email: '', address: '' });
      }
      if (!shippingRates) {
        setShippingRates(settings.shipping_rates || { standard: 2, express: 5, same_day: 8 });
      }
      if (!aiSettings) {
        const existingSettings = settings.ai_settings || {};
        // Migrate from old format if needed
        setAiSettings({
          image_provider: existingSettings.image_provider || existingSettings.ai_provider || 'google',
          chat_provider: existingSettings.chat_provider || existingSettings.ai_provider || 'google',
          google_image_model: existingSettings.google_image_model || existingSettings.image_model || 'gemini-2.5-flash-image',
          google_text_model: existingSettings.google_text_model || existingSettings.text_model || 'gemini-2.0-flash',
          openrouter_text_model: existingSettings.openrouter_text_model || '',
          openrouter_image_model: existingSettings.openrouter_image_model || '',
          auto_generate_description: existingSettings.auto_generate_description || false,
        });
      }
    }
  }, [settings]);

  // Save payment methods
  const handleSavePaymentMethods = () => {
    if (paymentMethods) {
      updateSettingMutation.mutate({ key: 'payment_methods', value: paymentMethods });
    }
  };

  // Save store info
  const handleSaveStoreInfo = () => {
    if (storeInfo) {
      updateSettingMutation.mutate({ key: 'store_info', value: storeInfo });
    }
  };

  // Save shipping rates
  const handleSaveShippingRates = () => {
    if (shippingRates) {
      updateSettingMutation.mutate({ key: 'shipping_rates', value: shippingRates });
    }
  };

  // Save AI settings
  const handleSaveAiSettings = () => {
    if (aiSettings) {
      updateSettingMutation.mutate({ key: 'ai_settings', value: aiSettings });
    }
  };

  // Get model display name from OpenRouter model list
  const getModelDisplayName = (modelId: string, models: OpenRouterModel[]) => {
    const model = models.find(m => m.id === modelId);
    return model?.name || modelId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('admin.settings.title', 'Settings')}
        </h1>
        <p className="text-muted-foreground">
          {t('admin.settingsDescription', 'Manage your store settings and configurations')}
        </p>
      </div>

      <Tabs defaultValue="payment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-[500px]">
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.payment', 'Payment')}</span>
          </TabsTrigger>
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.store', 'Store')}</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.shipping', 'Shipping')}</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.hours', 'Hours')}</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.ai', 'AI')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Payment Methods */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t('admin.paymentMethods', 'Payment Methods')}
              </CardTitle>
              <CardDescription>
                {t('admin.paymentMethodsDesc', 'Enable or disable payment methods for checkout')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* K-Net */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">K-Net</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.knetDesc', 'Accept payments via K-Net debit cards')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!paymentMethods?.knet && (
                    <Badge variant="secondary">{t('admin.comingSoon', 'Coming Soon')}</Badge>
                  )}
                  <Switch
                    checked={paymentMethods?.knet || false}
                    onCheckedChange={(checked) =>
                      setPaymentMethods((prev) => prev ? { ...prev, knet: checked } : null)
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Cash on Delivery */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    {t('admin.cod', 'Cash on Delivery')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.codDesc', 'Accept cash payment upon delivery')}
                  </p>
                </div>
                <Switch
                  checked={paymentMethods?.cod || false}
                  onCheckedChange={(checked) =>
                    setPaymentMethods((prev) => prev ? { ...prev, cod: checked } : null)
                  }
                />
              </div>

              <Separator />

              {/* Wamad Transfer */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    {t('admin.wamadTransfer', 'Wamad Transfer')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('admin.wamadDesc', 'Accept bank transfers via Wamad')}
                  </p>
                </div>
                <Switch
                  checked={paymentMethods?.wamad_transfer || false}
                  onCheckedChange={(checked) =>
                    setPaymentMethods((prev) => prev ? { ...prev, wamad_transfer: checked } : null)
                  }
                />
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSavePaymentMethods}
                  disabled={updateSettingMutation.isPending}
                >
                  {updateSettingMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  {t('admin.saveChanges', 'Save Changes')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Store Info */}
        <TabsContent value="store">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                {t('admin.storeInfo', 'Store Information')}
              </CardTitle>
              <CardDescription>
                {t('admin.storeInfoDesc', 'Update your store contact information')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="store-name">{t('admin.storeName', 'Store Name')}</Label>
                  <Input
                    id="store-name"
                    value={storeInfo?.name || ''}
                    onChange={(e) =>
                      setStoreInfo((prev) => prev ? { ...prev, name: e.target.value } : null)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-phone">{t('admin.phone', 'Phone')}</Label>
                  <Input
                    id="store-phone"
                    value={storeInfo?.phone || ''}
                    onChange={(e) =>
                      setStoreInfo((prev) => prev ? { ...prev, phone: e.target.value } : null)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-email">{t('admin.email', 'Email')}</Label>
                  <Input
                    id="store-email"
                    type="email"
                    value={storeInfo?.email || ''}
                    onChange={(e) =>
                      setStoreInfo((prev) => prev ? { ...prev, email: e.target.value } : null)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-address">{t('admin.address', 'Address')}</Label>
                  <Input
                    id="store-address"
                    value={storeInfo?.address || ''}
                    onChange={(e) =>
                      setStoreInfo((prev) => prev ? { ...prev, address: e.target.value } : null)
                    }
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={handleSaveStoreInfo} disabled={updateSettingMutation.isPending}>
                  {updateSettingMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  {t('admin.saveChanges', 'Save Changes')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Rates */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                {t('admin.shippingRates', 'Shipping Rates')}
              </CardTitle>
              <CardDescription>
                {t('admin.shippingRatesDesc', 'Configure shipping rates in KWD')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.method', 'Method')}</TableHead>
                    <TableHead>{t('admin.description', 'Description')}</TableHead>
                    <TableHead>{t('admin.rate', 'Rate (KWD)')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      {t('admin.standard', 'Standard')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t('admin.standardDesc', '3-5 business days')}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        className="w-24"
                        value={shippingRates?.standard || 0}
                        onChange={(e) =>
                          setShippingRates((prev) =>
                            prev ? { ...prev, standard: parseFloat(e.target.value) } : null
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      {t('admin.express', 'Express')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t('admin.expressDesc', '1-2 business days')}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        className="w-24"
                        value={shippingRates?.express || 0}
                        onChange={(e) =>
                          setShippingRates((prev) =>
                            prev ? { ...prev, express: parseFloat(e.target.value) } : null
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      {t('admin.sameDay', 'Same Day')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {t('admin.sameDayDesc', 'Delivery today')}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        className="w-24"
                        value={shippingRates?.same_day || 0}
                        onChange={(e) =>
                          setShippingRates((prev) =>
                            prev ? { ...prev, same_day: parseFloat(e.target.value) } : null
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="pt-4">
                <Button onClick={handleSaveShippingRates} disabled={updateSettingMutation.isPending}>
                  {updateSettingMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  {t('admin.saveChanges', 'Save Changes')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours */}
        <TabsContent value="hours">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('admin.businessHours', 'Business Hours')}
              </CardTitle>
              <CardDescription>
                {t('admin.businessHoursDesc', 'Set your store operating hours')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                {t('admin.comingSoon', 'Coming soon...')}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai">
          <div className="space-y-6">
            {/* Security Notice */}
            <Card className="border-green-500/50 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Shield className="h-5 w-5" />
                  {t('admin.settings.ai.secureStorage', 'Secure API Key Storage')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t('admin.settings.ai.secureStorageDesc', 'API keys are securely stored in the database and are never exposed in the frontend. Configure them through Supabase Edge Function secrets for maximum security.')}
                </p>
              </CardContent>
            </Card>

            {/* Image Generation Provider */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  {t('admin.settings.ai.imageGeneration', 'Image Generation')}
                </CardTitle>
                <CardDescription>
                  {t('admin.settings.ai.imageGenerationDesc', 'Choose AI provider and model for image generation')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Provider Selection */}
                <div className="space-y-2">
                  <Label>{t('admin.settings.ai.provider', 'Provider')}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={aiSettings?.image_provider === 'google' ? 'default' : 'outline'}
                      className="h-auto p-3 flex flex-col items-start gap-1"
                      onClick={() => setAiSettings(prev => prev ? { ...prev, image_provider: 'google' } : null)}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-semibold">{t('admin.settings.ai.googleAI', 'Google AI')}</span>
                      </div>
                      <span className="text-xs opacity-70">{t('admin.settings.ai.googleAIDesc', 'Gemini & Imagen')}</span>
                    </Button>
                    <Button
                      variant={aiSettings?.image_provider === 'openrouter' ? 'default' : 'outline'}
                      className="h-auto p-3 flex flex-col items-start gap-1"
                      onClick={() => setAiSettings(prev => prev ? { ...prev, image_provider: 'openrouter' } : null)}
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span className="font-semibold">{t('admin.settings.ai.openRouter', 'OpenRouter')}</span>
                      </div>
                      <span className="text-xs opacity-70">{t('admin.settings.ai.openRouterImageDesc', 'DALL-E, Flux, SD')}</span>
                    </Button>
                  </div>
                </div>

                {/* Model Selection based on provider */}
                {aiSettings?.image_provider === 'google' ? (
                  <div className="space-y-2">
                    <Label>{t('admin.settings.ai.imageModel', 'Image Model')}</Label>
                    <Select
                      value={aiSettings?.google_image_model || 'gemini-2.5-flash-image'}
                      onValueChange={(value) =>
                        setAiSettings((prev) => prev ? { ...prev, google_image_model: value } : null)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOOGLE_IMAGE_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{model.label}</span>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('admin.settings.ai.imageModel', 'Image Model')}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetchModels()}
                        disabled={isLoadingModels}
                      >
                        <RefreshCw className={cn("h-3 w-3 mr-1", isLoadingModels && "animate-spin")} />
                        <span className="text-xs">{t('admin.settings.ai.refresh', 'Refresh')}</span>
                      </Button>
                    </div>
                    <Popover open={openImageModel} onOpenChange={setOpenImageModel}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openImageModel}
                          className="w-full justify-between"
                        >
                          {aiSettings?.openrouter_image_model
                            ? getModelDisplayName(aiSettings.openrouter_image_model, imageModels)
                            : t('admin.settings.ai.selectImageModel', 'Select image model...')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0 z-50 bg-popover" align="start">
                        <Command>
                          <CommandInput 
                            placeholder={t('admin.settings.ai.searchModels', 'Search models...')}
                            value={imageModelSearch}
                            onValueChange={setImageModelSearch}
                          />
                          <CommandList>
                            <CommandEmpty>{t('admin.settings.ai.noImageModelsFound', 'No image model found.')}</CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className="h-[300px]">
                                {imageModels
                                  .filter(m => 
                                    m.name.toLowerCase().includes(imageModelSearch.toLowerCase()) ||
                                    m.id.toLowerCase().includes(imageModelSearch.toLowerCase())
                                  )
                                  .map((model) => (
                                    <CommandItem
                                      key={model.id}
                                      value={model.id}
                                      onSelect={() => {
                                        setAiSettings(prev => prev ? { ...prev, openrouter_image_model: model.id } : null);
                                        setOpenImageModel(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          aiSettings?.openrouter_image_model === model.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{model.name}</span>
                                        <span className="text-xs text-muted-foreground">{model.id}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                              </ScrollArea>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.settings.ai.imageModelsAvailable', '{{count}} image models available', { count: imageModels.length })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat Model Provider */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('admin.settings.ai.chatTextGeneration', 'Chat / Text Generation')}
                </CardTitle>
                <CardDescription>
                  {t('admin.settings.ai.chatTextGenerationDesc', 'Choose AI provider and model for text and chat')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Provider Selection */}
                <div className="space-y-2">
                  <Label>{t('admin.settings.ai.provider', 'Provider')}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={aiSettings?.chat_provider === 'google' ? 'default' : 'outline'}
                      className="h-auto p-3 flex flex-col items-start gap-1"
                      onClick={() => setAiSettings(prev => prev ? { ...prev, chat_provider: 'google' } : null)}
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-semibold">{t('admin.settings.ai.googleAI', 'Google AI')}</span>
                      </div>
                      <span className="text-xs opacity-70">{t('admin.settings.ai.googleAITextDesc', 'Gemini models')}</span>
                    </Button>
                    <Button
                      variant={aiSettings?.chat_provider === 'openrouter' ? 'default' : 'outline'}
                      className="h-auto p-3 flex flex-col items-start gap-1"
                      onClick={() => setAiSettings(prev => prev ? { ...prev, chat_provider: 'openrouter' } : null)}
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        <span className="font-semibold">{t('admin.settings.ai.openRouter', 'OpenRouter')}</span>
                      </div>
                      <span className="text-xs opacity-70">{t('admin.settings.ai.openRouterTextDesc', '300+ models')}</span>
                    </Button>
                  </div>
                </div>

                {/* Model Selection based on provider */}
                {aiSettings?.chat_provider === 'google' ? (
                  <div className="space-y-2">
                    <Label>{t('admin.settings.ai.textModel', 'Text Model')}</Label>
                    <Select
                      value={aiSettings?.google_text_model || 'gemini-2.0-flash'}
                      onValueChange={(value) =>
                        setAiSettings((prev) => prev ? { ...prev, google_text_model: value } : null)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GOOGLE_TEXT_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{model.label}</span>
                              <span className="text-xs text-muted-foreground">{model.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>{t('admin.settings.ai.textModel', 'Text Model')}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetchModels()}
                        disabled={isLoadingModels}
                      >
                        <RefreshCw className={cn("h-3 w-3 mr-1", isLoadingModels && "animate-spin")} />
                        <span className="text-xs">{t('admin.settings.ai.refresh', 'Refresh')}</span>
                      </Button>
                    </div>
                    <Popover open={openTextModel} onOpenChange={setOpenTextModel}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openTextModel}
                          className="w-full justify-between"
                        >
                          {aiSettings?.openrouter_text_model
                            ? getModelDisplayName(aiSettings.openrouter_text_model, textModels)
                            : t('admin.settings.ai.selectTextModel', 'Select text model...')}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0 z-50 bg-popover" align="start">
                        <Command>
                          <CommandInput 
                            placeholder={t('admin.settings.ai.searchModels', 'Search models...')}
                            value={textModelSearch}
                            onValueChange={setTextModelSearch}
                          />
                          <CommandList>
                            <CommandEmpty>{t('admin.settings.ai.noTextModelsFound', 'No model found.')}</CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className="h-[300px]">
                                {textModels
                                  .filter(m => 
                                    m.name.toLowerCase().includes(textModelSearch.toLowerCase()) ||
                                    m.id.toLowerCase().includes(textModelSearch.toLowerCase())
                                  )
                                  .slice(0, 100)
                                  .map((model) => (
                                    <CommandItem
                                      key={model.id}
                                      value={model.id}
                                      onSelect={() => {
                                        setAiSettings(prev => prev ? { ...prev, openrouter_text_model: model.id } : null);
                                        setOpenTextModel(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          aiSettings?.openrouter_text_model === model.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{model.name}</span>
                                        <span className="text-xs text-muted-foreground">{model.id}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                              </ScrollArea>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      {t('admin.settings.ai.textModelsAvailable', '{{count}} text models available', { count: textModels.length })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auto Generate Toggle */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">
                      {t('admin.settings.ai.autoGenerate', 'Auto-generate descriptions')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('admin.settings.ai.autoGenerateDesc', 'Automatically generate descriptions when adding products')}
                    </p>
                  </div>
                  <Switch
                    checked={aiSettings?.auto_generate_description || false}
                    onCheckedChange={(checked) =>
                      setAiSettings((prev) => prev ? { ...prev, auto_generate_description: checked } : null)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="pt-2">
              <Button onClick={handleSaveAiSettings} disabled={updateSettingMutation.isPending}>
                {updateSettingMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                <Save className="h-4 w-4 mr-2" />
                {t('admin.saveChanges', 'Save Changes')}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
