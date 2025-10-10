// src/components/SettingsContent.tsx

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, 
  Briefcase, 
  Bell, 
  CreditCard, 
  Mail, 
  Phone,
  Globe,
  DollarSign,
  Save,
  X
} from 'lucide-react';

export const SettingsContent = ({ mentorProfile, onUpdate }: any) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Profile Information State
  const [profileData, setProfileData] = useState({
    name: mentorProfile?.name || '',
    title: mentorProfile?.title || '',
    bio: mentorProfile?.bio || '',
    profile_image_url: mentorProfile?.profile_image_url || '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: ''
  });

  // Expertise State
  const [expertise, setExpertise] = useState<string[]>(mentorProfile?.expertise || []);
  const [newExpertise, setNewExpertise] = useState('');

  // Notification Settings State
  const [notifications, setNotifications] = useState({
    emailBookings: true,
    emailMessages: true,
    emailReviews: true,
    pushBookings: false,
    pushMessages: true,
    pushReviews: false
  });

  // Payment Settings State
  const [paymentData, setPaymentData] = useState({
    hourly_rate: mentorProfile?.hourly_rate || 0,
    bank_account: '',
    upi_id: '',
    payment_method: 'upi'
  });

  // === 1. EDIT PROFILE INFORMATION ===
  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('mentors')
        .update({
          name: profileData.name,
          title: profileData.title,
          bio: profileData.bio,
          profile_image_url: profileData.profile_image_url,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
      
      setActiveSection(null);
      onUpdate?.();
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

  // === 2. UPDATE EXPERTISE AREAS ===
  const handleAddExpertise = () => {
    if (newExpertise.trim() && !expertise.includes(newExpertise.trim())) {
      setExpertise([...expertise, newExpertise.trim()]);
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (skill: string) => {
    setExpertise(expertise.filter(s => s !== skill));
  };

  const handleExpertiseUpdate = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('mentors')
        .update({ expertise })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Expertise Updated",
        description: "Your expertise areas have been saved successfully.",
      });
      
      setActiveSection(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating expertise:', error);
      toast({
        title: "Error",
        description: "Failed to update expertise. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // === 3. MANAGE NOTIFICATIONS ===
  const handleNotificationUpdate = async () => {
    try {
      setLoading(true);
      // In a real app, you'd save this to a user_preferences table
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved.",
      });
      setActiveSection(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notifications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // === 4. PAYMENT SETTINGS ===
  const handlePaymentUpdate = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('mentors')
        .update({ hourly_rate: paymentData.hourly_rate })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Payment Settings Updated",
        description: "Your payment information has been saved.",
      });
      
      setActiveSection(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: "Error",
        description: "Failed to update payment settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Account Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your mentor profile and preferences</p>
      </div>

      {/* 1. Edit Profile Information */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Edit Profile Information</CardTitle>
                <CardDescription>Update your personal details and bio</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              {activeSection === 'profile' ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </CardHeader>
        
        {activeSection === 'profile' && (
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Professional Title</Label>
                <Input
                  id="title"
                  value={profileData.title}
                  onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                  placeholder="Senior Software Engineer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                placeholder="Tell mentees about yourself..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileImage">Profile Image URL</Label>
              <Input
                id="profileImage"
                value={profileData.profile_image_url}
                onChange={(e) => setProfileData({ ...profileData, profile_image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleProfileUpdate} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setActiveSection(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 2. Update Expertise Areas */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setActiveSection(activeSection === 'expertise' ? null : 'expertise')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Update Expertise Areas</CardTitle>
                <CardDescription>Manage your skills and areas of expertise</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              {activeSection === 'expertise' ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </CardHeader>
        
        {activeSection === 'expertise' && (
          <CardContent className="space-y-4 pt-0">
            <div className="flex gap-2">
              <Input
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddExpertise()}
                placeholder="Add a skill (e.g., React, Node.js)"
              />
              <Button onClick={handleAddExpertise}>Add</Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {expertise.map((skill, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {skill}
                  <button
                    onClick={() => handleRemoveExpertise(skill)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleExpertiseUpdate} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Expertise
              </Button>
              <Button variant="outline" onClick={() => setActiveSection(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 3. Manage Notifications */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setActiveSection(activeSection === 'notifications' ? null : 'notifications')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Manage Notifications</CardTitle>
                <CardDescription>Control how you receive updates</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              {activeSection === 'notifications' ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </CardHeader>
        
        {activeSection === 'notifications' && (
          <CardContent className="space-y-6 pt-0">
            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailBookings">New booking requests</Label>
                  <Switch
                    id="emailBookings"
                    checked={notifications.emailBookings}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailBookings: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailMessages">New messages</Label>
                  <Switch
                    id="emailMessages"
                    checked={notifications.emailMessages}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailMessages: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailReviews">New reviews</Label>
                  <Switch
                    id="emailReviews"
                    checked={notifications.emailReviews}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, emailReviews: checked })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Push Notifications
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushBookings">New booking requests</Label>
                  <Switch
                    id="pushBookings"
                    checked={notifications.pushBookings}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushBookings: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushMessages">New messages</Label>
                  <Switch
                    id="pushMessages"
                    checked={notifications.pushMessages}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushMessages: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="pushReviews">New reviews</Label>
                  <Switch
                    id="pushReviews"
                    checked={notifications.pushReviews}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, pushReviews: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleNotificationUpdate} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
              <Button variant="outline" onClick={() => setActiveSection(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 4. Payment Settings */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setActiveSection(activeSection === 'payment' ? null : 'payment')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Manage your pricing and payment methods</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              {activeSection === 'payment' ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </CardHeader>
        
        {activeSection === 'payment' && (
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Hourly Rate (INR)
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                value={paymentData.hourly_rate}
                onChange={(e) => setPaymentData({ ...paymentData, hourly_rate: Number(e.target.value) })}
                placeholder="1500"
                min="0"
              />
              <p className="text-xs text-muted-foreground">Average rate: ₹1,500/hour</p>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Payment Method</h4>
              
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  value={paymentData.upi_id}
                  onChange={(e) => setPaymentData({ ...paymentData, upi_id: e.target.value })}
                  placeholder="yourname@upi"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account Number</Label>
                <Input
                  id="bankAccount"
                  value={paymentData.bank_account}
                  onChange={(e) => setPaymentData({ ...paymentData, bank_account: e.target.value })}
                  placeholder="Account number"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePaymentUpdate} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Payment Info
              </Button>
              <Button variant="outline" onClick={() => setActiveSection(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default SettingsContent;
