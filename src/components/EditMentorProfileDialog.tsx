import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EditMentorProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated?: () => void;
}

export const EditMentorProfileDialog = ({ open, onOpenChange, onProfileUpdated }: EditMentorProfileDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    title: "",
    hourly_rate: "",
    expertise: "",
    languages: "",
  });

  useEffect(() => {
    const fetchMentorData = async () => {
      if (!user || !open) return;

      const { data: mentorData } = await supabase
        .from('mentors')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (mentorData) {
        setFormData({
          name: mentorData.name || "",
          bio: mentorData.bio || "",
          title: mentorData.title || "",
          hourly_rate: mentorData.hourly_rate?.toString() || "",
          expertise: mentorData.expertise?.join(", ") || "",
          languages: mentorData.languages?.join(", ") || "",
        });
      }
    };

    fetchMentorData();
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const expertiseArray = formData.expertise.split(",").map(s => s.trim()).filter(Boolean);
      const languagesArray = formData.languages.split(",").map(s => s.trim()).filter(Boolean);

      const { error } = await supabase
        .from('mentors')
        .update({
          name: formData.name,
          bio: formData.bio,
          title: formData.title,
          hourly_rate: parseFloat(formData.hourly_rate) || null,
          expertise: expertiseArray,
          languages: languagesArray,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your mentor profile has been successfully updated.",
      });

      onProfileUpdated?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Mentor Profile</DialogTitle>
          <DialogDescription>
            Update your mentor profile information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Professional Title</Label>
            <Input
              id="title"
              placeholder="e.g., Senior Software Engineer"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
            <Input
              id="hourly_rate"
              type="number"
              placeholder="50"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expertise">Expertise (comma-separated)</Label>
            <Input
              id="expertise"
              placeholder="React, TypeScript, Node.js"
              value={formData.expertise}
              onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="languages">Languages (comma-separated)</Label>
            <Input
              id="languages"
              placeholder="English, Spanish, French"
              value={formData.languages}
              onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
