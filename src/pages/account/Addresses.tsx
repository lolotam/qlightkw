import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Home,
  Building2,
  Loader2,
  Star,
} from 'lucide-react';

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  label: string;
  name: string;
  phone: string;
  area: string;
  block: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  notes?: string;
  is_default: boolean;
}

const kuwaitAreas = [
  'Kuwait City', 'Salmiya', 'Hawally', 'Farwaniya', 'Ahmadi', 'Jahra',
  'Mangaf', 'Mahboula', 'Fintas', 'Abu Halifa', 'Egaila', 'Mishref',
  'Rumaithiya', 'Salwa', 'Bayan', 'Jabriya', 'Surra', 'Yarmouk',
];

const emptyAddress: Omit<Address, 'id'> = {
  type: 'home',
  label: '',
  name: '',
  phone: '',
  area: '',
  block: '',
  street: '',
  building: '',
  floor: '',
  apartment: '',
  notes: '',
  is_default: false,
};

export default function AccountAddresses() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState<Omit<Address, 'id'>>(emptyAddress);
  const [isSaving, setIsSaving] = useState(false);

  // For demo purposes, we'll use localStorage since we don't have an addresses table
  // In production, this would be a Supabase table
  useEffect(() => {
    if (!user) return;

    const loadAddresses = () => {
      const saved = localStorage.getItem(`addresses_${user.id}`);
      if (saved) {
        setAddresses(JSON.parse(saved));
      }
      setIsLoading(false);
    };

    loadAddresses();
  }, [user]);

  const saveAddresses = (newAddresses: Address[]) => {
    if (!user) return;
    localStorage.setItem(`addresses_${user.id}`, JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData(address);
    } else {
      setEditingAddress(null);
      setFormData({ ...emptyAddress, is_default: addresses.length === 0 });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAddress(null);
    setFormData(emptyAddress);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.area || !formData.block || !formData.street || !formData.building) {
      toast({
        variant: 'destructive',
        title: t('common.error', 'Error'),
        description: t('account.fillRequiredFields', 'Please fill in all required fields.'),
      });
      return;
    }

    setIsSaving(true);

    const label = formData.label || `${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} Address`;

    if (editingAddress) {
      // Update existing address
      const updated = addresses.map((addr) =>
        addr.id === editingAddress.id ? { ...formData, id: editingAddress.id, label } : addr
      );
      
      // Handle default address change
      if (formData.is_default && !editingAddress.is_default) {
        updated.forEach((addr) => {
          if (addr.id !== editingAddress.id) addr.is_default = false;
        });
      }
      
      saveAddresses(updated);
      toast({
        title: t('common.success', 'Success'),
        description: t('account.addressUpdated', 'Address updated successfully.'),
      });
    } else {
      // Add new address
      const newAddress: Address = {
        ...formData,
        id: crypto.randomUUID(),
        label,
      };
      
      // If this is the default, remove default from others
      let updated = [...addresses];
      if (formData.is_default) {
        updated = updated.map((addr) => ({ ...addr, is_default: false }));
      }
      
      saveAddresses([...updated, newAddress]);
      toast({
        title: t('common.success', 'Success'),
        description: t('account.addressAdded', 'Address added successfully.'),
      });
    }

    setIsSaving(false);
    handleCloseDialog();
  };

  const handleDelete = (addressId: string) => {
    const updated = addresses.filter((addr) => addr.id !== addressId);
    
    // If we deleted the default, make the first one default
    if (updated.length > 0 && !updated.some((addr) => addr.is_default)) {
      updated[0].is_default = true;
    }
    
    saveAddresses(updated);
    toast({
      title: t('common.success', 'Success'),
      description: t('account.addressDeleted', 'Address deleted successfully.'),
    });
  };

  const handleSetDefault = (addressId: string) => {
    const updated = addresses.map((addr) => ({
      ...addr,
      is_default: addr.id === addressId,
    }));
    saveAddresses(updated);
    toast({
      title: t('common.success', 'Success'),
      description: t('account.defaultAddressSet', 'Default address updated.'),
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'work':
        return Building2;
      default:
        return Home;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('account.savedAddresses', 'Saved Addresses')}</h1>
          <p className="text-muted-foreground mt-1">
            {t('account.addressesDescription', 'Manage your delivery addresses.')}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('account.addAddress', 'Add Address')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAddress
                  ? t('account.editAddress', 'Edit Address')
                  : t('account.addNewAddress', 'Add New Address')}
              </DialogTitle>
              <DialogDescription>
                {t('account.addressFormDescription', 'Enter your delivery address details.')}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('account.addressType', 'Address Type')}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'home' | 'work' | 'other') =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">{t('account.home', 'Home')}</SelectItem>
                      <SelectItem value="work">{t('account.work', 'Work')}</SelectItem>
                      <SelectItem value="other">{t('account.other', 'Other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('account.labelOptional', 'Label (Optional)')}</Label>
                  <Input
                    placeholder={t('account.labelPlaceholder', 'e.g., My Home')}
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('account.fullName', 'Full Name')} *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('account.phone', 'Phone')} *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('account.area', 'Area')} *</Label>
                <Select
                  value={formData.area}
                  onValueChange={(value) => setFormData({ ...formData, area: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('account.selectArea', 'Select area')} />
                  </SelectTrigger>
                  <SelectContent>
                    {kuwaitAreas.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('account.block', 'Block')} *</Label>
                  <Input
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('account.street', 'Street')} *</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('account.building', 'Building')} *</Label>
                  <Input
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('account.floor', 'Floor')}</Label>
                  <Input
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('account.apartment', 'Apartment')}</Label>
                  <Input
                    value={formData.apartment}
                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('account.deliveryNotes', 'Delivery Notes')}</Label>
                <Textarea
                  placeholder={t('account.notesPlaceholder', 'Any special instructions for delivery...')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="is_default" className="font-normal cursor-pointer">
                  {t('account.setAsDefault', 'Set as default address')}
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('common.save', 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('account.noAddresses', 'No saved addresses')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('account.addAddressMessage', 'Add an address to speed up checkout.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address, index) => {
            const Icon = getTypeIcon(address.type);
            
            return (
              <motion.div
                key={address.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={address.is_default ? 'border-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold flex items-center gap-2">
                            {address.label}
                            {address.is_default && (
                              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                {t('account.default', 'Default')}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">{address.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(address)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(address.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-sm space-y-1">
                      <p className="font-medium">{address.name}</p>
                      <p className="text-muted-foreground">
                        Block {address.block}, Street {address.street}, Building {address.building}
                        {address.floor && `, Floor ${address.floor}`}
                        {address.apartment && `, Apt ${address.apartment}`}
                      </p>
                      <p className="text-muted-foreground">{address.area}</p>
                      <p className="text-muted-foreground">{address.phone}</p>
                    </div>

                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        {t('account.setDefault', 'Set as Default')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
