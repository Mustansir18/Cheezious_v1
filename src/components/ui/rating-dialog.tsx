
'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function RatingDialog() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [comments, setComments] = useState('');
  const { toast } = useToast();

  const handleRatingClick = (newRating: number) => {
    setRating(newRating);
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    console.log('Feedback submitted:', { rating, comments });
    toast({
      title: 'Feedback Submitted!',
      description: 'Thank you for helping us improve.',
    });
    // Reset state
    setIsDialogOpen(false);
    setRating(0);
    setComments('');
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Button className="rounded-full h-14 w-auto px-6 shadow-lg animate-pulse">
            <Star className="mr-2 h-5 w-5" /> Rate Us
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thank you for your rating!</DialogTitle>
            <DialogDescription>
              You gave us {rating} out of 5 stars. Please leave any comments or suggestions below.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Tell us how we can improve..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-background/80 backdrop-blur-sm border rounded-full p-2 flex items-center gap-1 shadow-lg">
            {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={cn(
                'h-8 w-8 cursor-pointer transition-colors',
                (hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'
                )}
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
            />
            ))}
        </div>
      </div>
    </>
  );
}
