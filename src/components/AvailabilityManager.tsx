// src/components/AvailabilityManager.tsx

import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AvailabilityManagerProps {
  mentorId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const AvailabilityManager = ({ mentorId }: AvailabilityManagerProps) => {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  // Form states
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  useEffect(() => {
    fetchAvailability();
  }, [mentorId]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('mentor_availability')
        .select('*')
        .eq('mentor_id', mentorId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      console.log('✅ Availability fetched:', data?.length || 0);
      setAvailability(data || []);

    } catch (error: any) {
      console.error('Error fetching availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to load availability.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!startTime || !endTime) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('mentor_availability')
        .insert({
          mentor_id: mentorId,
          day_of_week: parseInt(dayOfWeek),
          start_time: startTime + ':00',
          end_time: endTime + ':00',
          is_available: true,
        });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Availability slot created.',
      });

      setShowCreateModal(false);
      resetForm();
      fetchAvailability();

    } catch (error: any) {
      console.error('Error creating slot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create availability slot.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSlot = async () => {
    if (!selectedSlot) return;

    try {
      const { error } = await supabase
        .from('mentor_availability')
        .delete()
        .eq('id', selectedSlot.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Availability slot deleted.',
      });

      setShowDeleteModal(false);
      setSelectedSlot(null);
      fetchAvailability();

    } catch (error: any) {
      console.error('Error deleting slot:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete slot.',
        variant: 'destructive',
      });
    }
  };

  const toggleAvailability = async (slotId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('mentor_availability')
        .update({ is_available: !currentStatus })
        .eq('id', slotId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Availability ${!currentStatus ? 'enabled' : 'disabled'}.`,
      });

      fetchAvailability();

    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update availability.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setDayOfWeek('1');
    setStartTime('09:00');
    setEndTime('17:00');
  };

  const groupByDay = () => {
    const grouped = new Map<number, any[]>();
    
    availability.forEach(slot => {
      const day = slot.day_of_week;
      if (!grouped.has(day)) {
        grouped.set(day, []);
      }
      grouped.get(day)!.push(slot);
    });

    return DAYS_OF_WEEK.map(day => ({
      ...day,
      slots: grouped.get(day.value) || []
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedAvailability = groupByDay();

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Availability
              </CardTitle>
              <CardDescription>
                Set your regular weekly schedule ({availability.length} slots configured)
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedAvailability.map(({ value, label, slots }) => (
            <div key={value} className="space-y-2">
              <h4 className="font-semibold text-sm">{label}</h4>
              {slots.length > 0 ? (
                <div className="space-y-2">
                  {slots.map((slot: any) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                        <Badge variant={slot.is_available ? "default" : "secondary"}>
                          {slot.is_available ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={slot.is_available}
                          onCheckedChange={() => toggleAvailability(slot.id, slot.is_available)}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setShowDeleteModal(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground pl-8">No availability set</p>
              )}
            </div>
          ))}
          
          {availability.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Availability Set</h3>
              <p className="text-muted-foreground mb-4">
                Add your weekly availability to start accepting bookings
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Slot
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
            <DialogDescription>
              Set when you're available to mentor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="day">Day of Week</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateSlot}>
              Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Availability Slot</DialogTitle>
            <DialogDescription>
              Are you sure? This will affect future bookings.
            </DialogDescription>
          </DialogHeader>
          {selectedSlot && (
            <div className="py-4">
              <p className="text-sm">
                <strong>Day:</strong> {DAYS_OF_WEEK.find(d => d.value === selectedSlot.day_of_week)?.label}<br />
                <strong>Time:</strong> {selectedSlot.start_time} - {selectedSlot.end_time}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteModal(false);
              setSelectedSlot(null);
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSlot}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
