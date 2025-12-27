
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRating } from '@/context/RatingContext';

const ratingDescriptions: { [key: number]: string } = {
  1: "Poor",
  2: "Fair",
  3: "Average",
  4: "Good",
  5: "Excellent!",
};

export function RatingDialog() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [comments, setComments] = useState('');
  const { toast } = useToast();
  const { addRating } = useRating();

  const handleRatingClick = (newRating: number) => {
    setRating(newRating);
    setHoverRating(0); // Clear hover state when a rating is clicked
  };

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        variant: "destructive",
        title: "No Rating Selected",
        description: "Please select a star rating before submitting.",
      });
      return;
    }
    addRating({ rating, comment: comments });
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
        <DialogTrigger asChild>
            <Button variant="secondary" size="lg" className="font-semibold shadow-md transition-transform hover:scale-105">
                <Star className="mr-2 h-5 w-5" /> Rate Your Experience
            </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How was your experience?</DialogTitle>
            <DialogDescription>
              Your feedback helps us improve.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
              <div 
                className="flex items-center justify-center gap-2"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-10 w-10 cursor-pointer transition-all',
                      (hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400 scale-110' : 'text-muted-foreground/30'
                    )}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                  />
                ))}
              </div>
              <p className="text-center text-sm font-medium text-muted-foreground mt-2 min-h-[20px]">
                {ratingDescriptions[hoverRating] || ratingDescriptions[rating] || 'Select a rating'}
              </p>
          </div>

          <Textarea
            placeholder="Tell us more about your experience (optional)..."
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
    </>
  );
}
