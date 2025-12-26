
'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  triggerButton?: React.ReactNode;
}

export function DeleteConfirmationDialog({
  title,
  description,
  onConfirm,
  triggerButton,
}: DeleteConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const CONFIRM_WORD = 'DELETE';

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
    setConfirmationText('');
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmationText(''); // Reset on close
    }
    setIsOpen(open);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {triggerButton || (
          <Button variant="ghost" size="icon">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
                {description}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirm-input" className="text-destructive">
                To confirm, type "<strong>{CONFIRM_WORD}</strong>" in the box below.
            </Label>
            <Input
                id="delete-confirm-input"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                autoComplete="off"
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => handleOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={confirmationText !== CONFIRM_WORD}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    