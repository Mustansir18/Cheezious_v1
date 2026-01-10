'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, LocateFixed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

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
  
  const handleUseLocation = () => {
    // In a real app, you would use navigator.geolocation and a reverse geocoding API.
    // For this prototype, we'll simulate the result.
    toast({
        title: "Fetching location...",
        description: "For this prototype, we'll use a sample address."
    });
    setAddress("House #456, Block B, Gulberg III, Lahore, Punjab, Pakistan");
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enter Your Delivery Address</DialogTitle>
            <DialogDescription>Please provide the full address for delivery, or use your current location.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="customer-address" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Home Address
                    </Label>
                     <Button variant="outline" size="sm" onClick={handleUseLocation}>
                        <LocateFixed className="mr-2 h-4 w-4" />
                        Use My Current Location
                    </Button>
                </div>
                <Textarea 
                id="customer-address" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="e.g., House #123, Street 4, Block C, Example Town, Lahore"
                className="min-h-[100px]"
                />
                 <p className="text-xs text-muted-foreground pt-1">
                 Please type your address manually or use your current location. The map is for visual reference only.
                </p>
            </div>
             <div className="rounded-lg overflow-hidden border">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d435518.6817142436!2d74.05414473406693!3d31.48322087524954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39190483e58107d9%3A0xc23abe6ccc7e2462!2sLahore%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2sus!4v1689255877587!5m2!1sen!2sus"
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
            </div>
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
