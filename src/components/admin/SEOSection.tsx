import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SEOData {
  seo_title_en: string;
  seo_title_ar: string;
  seo_description_en: string;
  seo_description_ar: string;
}

interface SEOSectionProps {
  data: SEOData;
  onChange: (field: keyof SEOData, value: string) => void;
  referenceData: {
    name_en: string;
    name_ar: string;
    slug?: string;
    description_en?: string;
    description_ar?: string;
  };
  entityType: 'category' | 'brand' | 'project';
}

export default function SEOSection({
  data,
  onChange,
  referenceData,
  entityType,
}: SEOSectionProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const [generatingSEO, setGeneratingSEO] = useState(false);

  const generateSEO = async () => {
    if (!referenceData.name_en || !referenceData.name_ar) {
      toast({
        title: t('admin.error', 'Error'),
        description: isRTL
          ? 'يرجى إدخال الاسم بالإنجليزية والعربية أولاً'
          : 'Please enter name in English and Arabic first',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingSEO(true);

    try {
      const entityLabel = entityType === 'category' 
        ? 'category for an e-commerce lighting store'
        : entityType === 'brand'
        ? 'brand for a lighting products store'
        : 'lighting installation project';

      const prompt = `Generate SEO optimized titles and meta descriptions for a ${entityLabel}:

Name (English): ${referenceData.name_en}
Name (Arabic): ${referenceData.name_ar}
Slug: ${referenceData.slug || ''}
${referenceData.description_en ? `Description (English): ${referenceData.description_en}` : ''}
${referenceData.description_ar ? `Description (Arabic): ${referenceData.description_ar}` : ''}

Return a JSON object with these exact fields:
{
  "seo_title_en": "SEO title in English (max 60 chars, include main keyword)",
  "seo_title_ar": "SEO title in Arabic (max 60 chars, include main keyword)",
  "seo_description_en": "Meta description in English (max 160 chars, compelling, include call-to-action)",
  "seo_description_ar": "Meta description in Arabic (max 160 chars, compelling, include call-to-action)"
}

Return ONLY the JSON object, no other text.`;

      const { data: result, error } = await supabase.functions.invoke('generate-ai-content', {
        body: {
          type: 'text',
          prompt,
        },
      });

      if (error) throw error;

      // Edge function returns 'text' for text generation, not 'content'
      const responseContent = result?.text || result?.content;
      
      if (result?.success && responseContent) {
        let seoData: SEOData;
        
        if (typeof responseContent === 'string') {
          // Remove markdown code blocks if present
          let cleanedContent = responseContent
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
          
          const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              seoData = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
              console.error('JSON parse error:', parseError, 'Content:', jsonMatch[0]);
              throw new Error('Failed to parse SEO response. Please try again.');
            }
          } else {
            console.error('No JSON found in response:', cleanedContent);
            throw new Error('Invalid response format. Please try again.');
          }
        } else {
          seoData = responseContent;
        }

        if (seoData.seo_title_en) onChange('seo_title_en', seoData.seo_title_en);
        if (seoData.seo_title_ar) onChange('seo_title_ar', seoData.seo_title_ar);
        if (seoData.seo_description_en) onChange('seo_description_en', seoData.seo_description_en);
        if (seoData.seo_description_ar) onChange('seo_description_ar', seoData.seo_description_ar);

        toast({
          title: isRTL ? 'تم إنشاء SEO' : 'SEO Generated',
          description: isRTL
            ? 'تم إنشاء محتوى SEO بنجاح'
            : 'SEO content generated successfully',
        });
      } else {
        throw new Error(result?.error || 'Failed to generate SEO');
      }
    } catch (error) {
      console.error('SEO generation error:', error);
      toast({
        title: t('admin.error', 'Error'),
        description: error instanceof Error ? error.message : 'Failed to generate SEO',
        variant: 'destructive',
      });
    } finally {
      setGeneratingSEO(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              {t('admin.seo', 'SEO Settings')}
            </CardTitle>
            <CardDescription>
              {t('admin.seoDesc', 'Search engine optimization settings')}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateSEO}
            disabled={generatingSEO || !referenceData.name_en || !referenceData.name_ar}
            className="gap-2"
          >
            {generatingSEO ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {t('admin.generateAllSEO', 'Generate All SEO')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* SEO Title English */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo_title_en">
                {t('admin.seoTitleEn', 'SEO Title (English)')}
              </Label>
              <span className={`text-xs ${data.seo_title_en.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {data.seo_title_en.length}/60
              </span>
            </div>
            <Input
              id="seo_title_en"
              value={data.seo_title_en}
              onChange={(e) => onChange('seo_title_en', e.target.value)}
              placeholder={t('admin.seoTitlePlaceholder', 'Enter SEO title...')}
              maxLength={70}
            />
          </div>

          {/* SEO Title Arabic */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo_title_ar">
                {t('admin.seoTitleAr', 'SEO Title (Arabic)')}
              </Label>
              <span className={`text-xs ${data.seo_title_ar.length > 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {data.seo_title_ar.length}/60
              </span>
            </div>
            <Input
              id="seo_title_ar"
              value={data.seo_title_ar}
              onChange={(e) => onChange('seo_title_ar', e.target.value)}
              placeholder={isRTL ? 'أدخل عنوان SEO...' : 'Enter SEO title in Arabic...'}
              dir="rtl"
              maxLength={70}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* SEO Description English */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo_description_en">
                {t('admin.seoDescriptionEn', 'Meta Description (English)')}
              </Label>
              <span className={`text-xs ${data.seo_description_en.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {data.seo_description_en.length}/160
              </span>
            </div>
            <Textarea
              id="seo_description_en"
              value={data.seo_description_en}
              onChange={(e) => onChange('seo_description_en', e.target.value)}
              placeholder={t('admin.seoDescPlaceholder', 'Enter meta description...')}
              rows={3}
              maxLength={170}
            />
          </div>

          {/* SEO Description Arabic */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="seo_description_ar">
                {t('admin.seoDescriptionAr', 'Meta Description (Arabic)')}
              </Label>
              <span className={`text-xs ${data.seo_description_ar.length > 160 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {data.seo_description_ar.length}/160
              </span>
            </div>
            <Textarea
              id="seo_description_ar"
              value={data.seo_description_ar}
              onChange={(e) => onChange('seo_description_ar', e.target.value)}
              placeholder={isRTL ? 'أدخل وصف الميتا...' : 'Enter meta description in Arabic...'}
              dir="rtl"
              rows={3}
              maxLength={170}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
