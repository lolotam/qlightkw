import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  BookOpen,
  Webhook,
  Database,
  Shield,
  Key,
  ExternalLink,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function DocumentationPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    toast({ title: t('admin.copied', 'Copied to clipboard') });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          {t('admin.documentation', 'Documentation')}
        </h1>
        <p className="text-muted-foreground">
          {t('admin.documentationDescription', 'API reference, webhooks, and integration guides')}
        </p>
      </div>

      <Tabs defaultValue="webhooks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="webhooks">
            <Webhook className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="auth">
            <Shield className="h-4 w-4 mr-2" />
            Auth
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="h-4 w-4 mr-2" />
            API
          </TabsTrigger>
        </TabsList>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.webhookDocs', 'Webhook Documentation')}</CardTitle>
              <CardDescription>
                {t('admin.webhookDocsDesc', 'Configure webhooks to receive real-time notifications for store events')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="order-webhooks">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      Order Webhooks
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Triggered when an order is created, updated, or status changes.
                    </p>
                    <h4 className="font-medium">Events:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                      <li><code>order.created</code> - New order placed</li>
                      <li><code>order.updated</code> - Order details modified</li>
                      <li><code>order.status_changed</code> - Status transition</li>
                      <li><code>order.cancelled</code> - Order cancelled</li>
                    </ul>
                    <h4 className="font-medium mt-4">Payload Example:</h4>
                    <CodeBlock
                      id="order-webhook"
                      code={`{
  "event": "order.status_changed",
  "timestamp": "2024-01-29T12:00:00Z",
  "data": {
    "order_id": "uuid",
    "order_number": "QL-20240129-0001",
    "old_status": "pending",
    "new_status": "confirmed",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+965XXXXXXXX"
    },
    "total_amount": 25.500,
    "currency": "KWD"
  }
}`}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="product-webhooks">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      Product Webhooks
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Triggered when products are created, updated, or inventory changes.
                    </p>
                    <h4 className="font-medium">Events:</h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                      <li><code>product.created</code> - New product added</li>
                      <li><code>product.updated</code> - Product modified</li>
                      <li><code>product.deleted</code> - Product removed</li>
                      <li><code>product.low_stock</code> - Stock below threshold</li>
                    </ul>
                    <CodeBlock
                      id="product-webhook"
                      code={`{
  "event": "product.low_stock",
  "timestamp": "2024-01-29T12:00:00Z",
  "data": {
    "product_id": "uuid",
    "sku": "PROD-001",
    "name": "Gaming Mouse",
    "current_stock": 3,
    "threshold": 5
  }
}`}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="inventory-webhooks">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      Inventory Alerts
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Automated alerts when inventory levels require attention.
                    </p>
                    <CodeBlock
                      id="inventory-webhook"
                      code={`{
  "event": "inventory.alert",
  "timestamp": "2024-01-29T12:00:00Z",
  "data": {
    "alert_type": "critical",
    "products": [
      { "id": "uuid", "name": "Product A", "stock": 0 },
      { "id": "uuid", "name": "Product B", "stock": 2 }
    ],
    "total_critical": 5,
    "total_low": 12
  }
}`}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.webhookSetup', 'Webhook Setup')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">n8n Integration</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect to n8n for workflow automation
                  </p>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View n8n Docs
                  </Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Custom Webhooks</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Send events to your own endpoints
                  </p>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.databaseSchema', 'Database Schema')}</CardTitle>
              <CardDescription>
                Overview of the main database tables and relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: 'products', desc: 'Product catalog', count: '1000+' },
                  { name: 'orders', desc: 'Customer orders', count: '500+' },
                  { name: 'categories', desc: 'Product categories', count: '50+' },
                  { name: 'brands', desc: 'Product brands', count: '30+' },
                  { name: 'profiles', desc: 'User profiles', count: '2000+' },
                  { name: 'coupons', desc: 'Discount codes', count: '20+' },
                ].map((table) => (
                  <div key={table.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {table.name}
                      </code>
                      <Badge variant="secondary">{table.count}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{table.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auth Tab */}
        <TabsContent value="auth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.authentication', 'Authentication')}</CardTitle>
              <CardDescription>
                Role-based access control and authentication setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">User Roles</h4>
                <div className="flex gap-2 mb-4">
                  <Badge>admin</Badge>
                  <Badge variant="secondary">customer</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Admins have full access to the dashboard. Customers can view and manage their orders.
                </p>
              </div>
              <CodeBlock
                id="auth-check"
                code={`// Check admin role
const { data } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .eq('role', 'admin')
  .single();

const isAdmin = !!data;`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.apiReference', 'API Reference')}</CardTitle>
              <CardDescription>
                Edge Functions and API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { method: 'POST', path: '/functions/v1/ai-assistant', desc: 'AI chat assistant' },
                  { method: 'POST', path: '/functions/v1/generate-ai-content', desc: 'Generate product descriptions' },
                ].map((endpoint) => (
                  <div key={endpoint.path} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono flex-1">{endpoint.path}</code>
                    <span className="text-sm text-muted-foreground">{endpoint.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
