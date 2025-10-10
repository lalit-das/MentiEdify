// src/components/RescheduleModal.tsx
import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RescheduleModalProps {
  session: {
    id: string;
    date: string;
    time: string;
    mentee?: string;
    mentor?: string;
    topic: string;
  };
  onClose: () => void;
  onReschedule: () => void;
}

export const RescheduleModal = ({
  session,
  onClose,
  onReschedule,
}: RescheduleModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rescheduleCount, setRescheduleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reschedule count on mount
  useEffect(() => {
    const fetchRescheduleCount = async () => {
      try {
        // ✅ FIX: Add type assertion for reschedule_count
        const { data, error } = await supabase
          .from('bookings')
          .select('reschedule_count')
          .eq('id', session.id)
          .single() as any;
        
        if (error) {
          console.error('Error fetching reschedule count:', error);
          toast({
            title: 'Warning',
            description: 'Could not load reschedule count. Assuming 0.',
            variant: 'default',
          });
        } else if (data) {
          setRescheduleCount(data.reschedule_count || 0);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRescheduleCount();
  }, [session.id, toast]);

  const maxReschedules = 3;
  const canReschedule = rescheduleCount < maxReschedules;

  // Get minimum date (tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async () => {
    // Validation
    if (!newDate || !newTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select both date and time.',
        variant: 'destructive',
      });
      return;
    }

    // Check if new date/time is different from current
    if (newDate === session.date && newTime === session.time) {
      toast({
        title: 'Same Date/Time',
        description: 'Please select a different date or time.',
        variant: 'destructive',
      });
      return;
    }

    // Check 24-hour notice
    const now = new Date();
    const currentSessionDateTime = new Date(`${session.date}T${session.time}`);
    const timeDiff = currentSessionDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 24) {
      toast({
        title: 'Cannot Reschedule',
        description: 'You must provide at least 24 hours notice to reschedule.',
        variant: 'destructive',
      });
      return;
    }

    // Validate new date is in the future
    const newSessionDateTime = new Date(`${newDate}T${newTime}`);
    if (newSessionDateTime <= now) {
      toast({
        title: 'Invalid Date/Time',
        description: 'The new session must be scheduled in the future.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ FIX: Use type assertion for reschedule_history table
      const { error: historyError } = await (supabase as any)
        .from('reschedule_history')
        .insert({
          booking_id: session.id,
          rescheduled_by: user?.id,
          old_session_date: session.date,
          old_session_time: session.time,
          new_session_date: newDate,
          new_session_time: newTime,
          reason: reason.trim() || undefined,
        });

      if (historyError) {
        console.error('History insert error:', historyError);
        throw new Error('Failed to record reschedule history');
      }

      // ✅ FIX: Use type assertion for new columns in bookings
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          session_date: newDate,
          session_time: newTime,
          reschedule_count: rescheduleCount + 1,
          last_rescheduled_at: new Date().toISOString(),
          last_rescheduled_by: user?.id,
          reschedule_reason: reason.trim() || undefined,
        } as any)
        .eq('id', session.id);

      if (updateError) {
        console.error('Booking update error:', updateError);
        throw new Error('Failed to update booking');
      }

      toast({
        title: 'Success',
        description: 'Session rescheduled successfully!',
      });

      onReschedule();
      onClose();
    } catch (error: any) {
      console.error('Reschedule error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reschedule session. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Session</DialogTitle>
          <DialogDescription>
            {isLoading ? (
              'Loading...'
            ) : (
              `Change your session date and time. You have ${maxReschedules - rescheduleCount} reschedule(s) remaining.`
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Current Session Info */}
            <div className="p-3 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Current Session</p>
              {session.mentee && (
                <p className="text-sm text-muted-foreground">With: {session.mentee}</p>
              )}
              <p className="text-xs text-muted-foreground">{session.topic}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(session.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {session.time}
              </div>
            </div>

            {/* Reschedule Limit Warning */}
            {!canReschedule && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Reschedule Limit Reached</p>
                  <p className="text-muted-foreground">
                    You've reached the maximum of {maxReschedules} reschedules for this session.
                  </p>
                </div>
              </div>
            )}

            {/* New Date/Time Selection */}
            {canReschedule && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newDate">New Date</Label>
                  <Input
                    id="newDate"
                    type="date"
                    min={minDate}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newTime">New Time</Label>
                  <Input
                    id="newTime"
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Why are you rescheduling?"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {reason.length}/500 characters
                  </p>
                </div>

                {/* 24-hour notice warning */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> You must provide at least 24 hours notice to reschedule.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          {canReschedule && !isLoading && (
            <Button onClick={handleSubmit} disabled={isSubmitting || !newDate || !newTime}>
              {isSubmitting ? 'Rescheduling...' : 'Confirm Reschedule'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
