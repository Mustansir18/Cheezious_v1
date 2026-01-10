
'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin } from 'lucide-react';

interface CustomerInfoDialogsProps {
  isOpen: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export function CustomerInfoDialogs({ isOpen, onComplete, onCancel }: CustomerInfoDialogsProps) {
  const { setCustomerDetails } = useCart();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleNameSubmit = () => {
    if (name.trim()) {
      setStep(2);
    }
  };

  const handlePhoneSubmit = () => {
    if (phone.trim()) {
      setStep(3);
    }
  };

  const handleAddressSubmit = () => {
    if (address.trim()) {
      setCustomerDetails({ name, phone, address });
      onComplete();
    }
  };
  
  const handleClose = () => {
    setStep(1);
    setName('');
    setPhone('');
    setAddress('');
    onCancel();
  };

  return (
    <>
      {/* Name Dialog */}
      <Dialog open={isOpen && step === 1} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Name</DialogTitle>
            <DialogDescription>Please provide your full name for the delivery.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="customer-name">Full Name</Label>
            <Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., John Doe" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button onClick={handleNameSubmit} disabled={!name.trim()}>Next</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Dialog */}
      <Dialog open={isOpen && step === 2} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Phone Number</DialogTitle>
            <DialogDescription>We'll use this to contact you about your order.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="customer-phone">Phone Number</Label>
            <Input id="customer-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 03001234567" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={handlePhoneSubmit} disabled={!phone.trim()}>Next</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Dialog */}
      <Dialog open={isOpen && step === 3} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Your Delivery Address</DialogTitle>
            <DialogDescription>Please provide the full address for delivery.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="customer-address" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Home Address
            </Label>
            <Textarea 
              id="customer-address" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              placeholder="e.g., House #123, Street 4, Block C, Example Town, Lahore"
              className="min-h-[100px]"
            />
             <p className="text-xs text-muted-foreground pt-1">
              A full map integration can be added here in the future. For now, please type your address manually.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={handleAddressSubmit} disabled={!address.trim()}>Confirm and Proceed to Menu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
