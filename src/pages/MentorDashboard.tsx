import { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, Star, Users, Video, MessageSquare, Bot, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AIChat } from '@/components/AIChat';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { RescheduleModal } from '@/components/RescheduleModal';
import { AvailabilityManager } from '@/components/AvailabilityManager'; 

const MentorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mentorProfile, setMentorProfile] = useState<any>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState<any>(null);
  
  const [stats, setStats] = useState([
    { title: "Total Sessions", value: "0", icon: Video, change: "+0%" },
    { title: "Average Rating", value: "0", icon: Star, change: "+0" },
    { title: "Active Mentees", value: "0", icon: Users, change: "+0" },
    { title: "Monthly Earnings", value: "₹0", icon: DollarSign, change: "+0%" }
  ]);
  const [loading, setLoading] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showMenteesModal, setShowMenteesModal] = useState(false);

  const [hourlyRate, setHourlyRate] = useState('');
  const [reviews, setReviews] = useState<any[]>([]);
  const [mentees, setMentees] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchMentorData();
    }
  }, [user]);

  const handleJoinCall = async (bookingId: string) => {
    try {
      console.log('🟢 MENTOR joining call for booking:', bookingId);
      
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          mentor_id,
          mentee_id,
          mentors!inner(
            id,
            user_id
          )
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        throw new Error('Booking not found');
      }

      const mentorUserId = booking.mentors.user_id;
      const menteeUserId = booking.mentee_id;

      const { data: existingSession } = await supabase
        .from('call_sessions')
        .select('id, caller_id, callee_id')
        .eq('booking_id', bookingId)
        .single();

      let sessionId: string;
      let isInitiator: boolean;

      if (!existingSession) {
        const { data: newSession, error: sessionError } = await supabase
          .from('call_sessions')
          .insert({
            booking_id: bookingId,
            caller_id: mentorUserId,
            callee_id: menteeUserId,
            call_type: 'video',
            status: 'initiated'
          })
          .select('id')
          .single();

        if (sessionError) throw sessionError;
        sessionId = newSession.id;
        isInitiator = true;
      } else {
        sessionId = existingSession.id;
        isInitiator = existingSession.caller_id === user?.id;
      }

      window.location.href = `/call/${sessionId}?initiator=${isInitiator}`;
    } catch (error) {
      console.error('❌ Error joining call:', error);
      toast({
        title: "Error",
        description: "Failed to join call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchMentorData = async () => {
    try {
      setLoading(true);

      const { data: mentorData, error: mentorError } = await supabase
        .from('mentors')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (mentorError && mentorError.code !== 'PGRST116') {
        throw mentorError;
      }

      if (!mentorData) {
        toast({
          title: "Mentor Profile Not Found",
          description: "Please complete your mentor application first.",
          variant: "destructive",
        });
        return;
      }

      setMentorProfile(mentorData);
      setHourlyRate(mentorData.hourly_rate?.toString() || '');

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          session_date,
          session_time,
          session_type,
          status,
          notes,
          price,
          reschedule_count,
          mentee_id,
          mentees:users!bookings_mentee_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('mentor_id', mentorData.id)
        .in('status', ['pending', 'confirmed'])
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true })
        .order('session_time', { ascending: true })
        .limit(5);

      if (bookingsError) throw bookingsError;

      const formattedBookings = (bookingsData || []).map((booking: any) => ({
        id: booking.id,
        mentee: booking.mentees 
          ? `${booking.mentees.first_name || 'Unknown'} ${booking.mentees.last_name || 'User'}` 
          : 'Unknown Mentee',
        menteeEmail: booking.mentees?.email || '',
        time: booking.session_time,
        date: new Date(booking.session_date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }),
        rawDate: booking.session_date,
        rawTime: booking.session_time,
        topic: booking.notes || 'General Mentoring Session',
        type: booking.session_type === 'video' ? 'Video Call' : 'Audio Call',
        status: booking.status,
        rescheduleCount: booking.reschedule_count || 0
      }));

      setUpcomingSessions(formattedBookings);

      const { data: totalBookings, count: totalCount } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: false })
        .eq('mentor_id', mentorData.id)
        .eq('status', 'completed');

      const totalSessions = totalCount || 0;
      const rating = mentorData.rating || 0;
      
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: monthlyBookings } = await supabase
        .from('bookings')
        .select('price')
        .eq('mentor_id', mentorData.id)
        .eq('status', 'completed')
        .gte('session_date', currentMonth + '-01');

      const monthlyEarnings = (monthlyBookings || []).reduce((sum: number, booking: any) => 
        sum + (booking.price || 0), 0
      );

      const { data: uniqueMentees } = await supabase
        .from('bookings')
        .select('mentee_id')
        .eq('mentor_id', mentorData.id)
        .eq('status', 'completed');

      const activeMentees = new Set(uniqueMentees?.map(b => b.mentee_id)).size;

      setStats([
        { title: "Total Sessions", value: totalSessions.toString(), icon: Video, change: "+12%" },
        { title: "Average Rating", value: rating.toFixed(1), icon: Star, change: "+0.1" },
        { title: "Active Mentees", value: activeMentees.toString(), icon: Users, change: "+3" },
        { title: "Monthly Earnings", value: `₹${monthlyEarnings}`, icon: DollarSign, change: "+18%" }
      ]);

    } catch (error) {
      console.error('Error fetching mentor data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking confirmed successfully!",
      });

      fetchMentorData();
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast({
        title: "Error",
        description: "Failed to confirm booking.",
        variant: "destructive",
      });
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking declined.",
      });

      fetchMentorData();
    } catch (error) {
      console.error('Error declining booking:', error);
      toast({
        title: "Error",
        description: "Failed to decline booking.",
        variant: "destructive",
      });
    }
  };

  const handleOpenReschedule = (session: any) => {
    setSelectedSessionForReschedule(session);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSuccess = () => {
    setShowRescheduleModal(false);
    setSelectedSessionForReschedule(null);
    fetchMentorData();
  };

  const handleSetPricing = async () => {
    try {
      const { error } = await supabase
        .from('mentors')
        .update({ 
          hourly_rate: parseFloat(hourlyRate),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing updated successfully!",
      });

      setShowPricingModal(false);
      fetchMentorData();
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast({
        title: "Error",
        description: "Failed to update pricing.",
        variant: "destructive",
      });
    }
  };

  const fetchReviews = async () => {
    try {
      console.log('📋 Fetching reviews for mentor:', mentorProfile?.id);
      
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('id, rating, review_text, created_at, reviewer_id, booking_id')
        .eq('mentor_id', mentorProfile?.id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('❌ Reviews fetch error:', reviewsError);
        throw reviewsError;
      }

      console.log('✅ Reviews fetched:', reviewsData?.length || 0);

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        setShowReviewsModal(true);
        return;
      }

      const reviewerIds = [...new Set(reviewsData.map(r => r.reviewer_id))];
      console.log('👥 Fetching reviewers:', reviewerIds);

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, profile_image_url')
        .in('id', reviewerIds);

      if (usersError) {
        console.warn('⚠️ Could not fetch reviewers:', usersError);
      }

      console.log('✅ Users fetched:', usersData?.length || 0);

      const usersMap = new Map(
        (usersData || []).map(user => [user.id, user])
      );

      const formattedReviews = reviewsData.map(review => ({
        id: review.id,
        rating: review.rating,
        review_text: review.review_text,
        created_at: review.created_at,
        booking_id: review.booking_id,
        reviewer_id: review.reviewer_id,
        reviewer: usersMap.get(review.reviewer_id) || {
          id: review.reviewer_id,
          first_name: 'Anonymous',
          last_name: 'User',
          profile_image_url: null
        }
      }));

      console.log('✅ Formatted reviews:', formattedReviews.length);

      setReviews(formattedReviews);
      setShowReviewsModal(true);

    } catch (error: any) {
      console.error('❌ Failed to load reviews:', error);
      
      setReviews([]);
      
      toast({
        title: "Error",
        description: error.message || "Failed to load reviews.",
        variant: "destructive",
      });
      
      setShowReviewsModal(true);
    }
  };

  const fetchMentees = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          mentee_id,
          mentees:users!bookings_mentee_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('mentor_id', mentorProfile?.id)
        .eq('status', 'completed');

      if (error) throw error;

      const uniqueMentees = Array.from(
        new Map(data.map(item => [item.mentee_id, item.mentees])).values()
      );

      setMentees(uniqueMentees);
      setShowMenteesModal(true);
    } catch (error) {
      console.error('Error fetching mentees:', error);
      toast({
        title: "Error",
        description: "Failed to load mentees.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!mentorProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-2">Complete Your Mentor Profile</h2>
            <p className="text-muted-foreground mb-4">You need to complete your mentor application to access the dashboard.</p>
            <Button onClick={() => window.location.href = '/become-mentor'}>
              Complete Application
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mentor Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {mentorProfile.name}! Here's what's happening with your mentorship.</p>
          </div>
          <Button onClick={() => setShowAIChat(true)} className="gap-2">
            <Bot className="h-4 w-4" />
            AI Assistant
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-primary">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Sessions
                  </CardTitle>
                  <CardDescription>Your scheduled mentorship sessions with mentees</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{session.mentee}</h4>
                            <Badge variant={session.status === 'confirmed' ? 'default' : 'secondary'}>
                              {session.status}
                            </Badge>
                            {session.rescheduleCount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Rescheduled {session.rescheduleCount}x
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{session.topic}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {session.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.time}
                            </div>
                            <Badge variant="outline" className="text-xs">{session.type}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {session.status === 'pending' ? (
                            <>
                              <Button size="sm" onClick={() => handleAcceptBooking(session.id)}>
                                Accept
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeclineBooking(session.id)}>
                                Decline
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" onClick={() => handleJoinCall(session.id)}>
                                <Video className="h-3 w-3 mr-1" />
                                Join Call
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleOpenReschedule(session)}
                                disabled={session.rescheduleCount >= 3}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Reschedule
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Upcoming Sessions</h3>
                      <p className="text-muted-foreground">You don't have any scheduled sessions at the moment.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your mentorship activities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowAIChat(true)}>
                    <Bot className="mr-2 h-4 w-4" />
                    AI Mentor Assistant
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowPricingModal(true)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Set Pricing
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={fetchReviews}>
                    <Star className="mr-2 h-4 w-4" />
                    View Reviews
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={fetchMentees}>
                    <Users className="mr-2 h-4 w-4" />
                    Manage Mentees
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ✅ NEW: Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <AvailabilityManager mentorId={mentorProfile.id} />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Recent Messages
                </CardTitle>
                <CardDescription>Latest messages from your mentees</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Messages</h3>
                  <p className="text-muted-foreground">You don't have any messages yet.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your mentor profile and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline">
                  Edit Profile Information
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  Update Expertise Areas
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  Manage Notifications
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  Payment Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {showAIChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <AIChat 
            onClose={() => setShowAIChat(false)}
            context="You are assisting a mentor on a mentorship platform."
          />
        </div>
      )}

      {showRescheduleModal && selectedSessionForReschedule && (
        <RescheduleModal
          session={{
            id: selectedSessionForReschedule.id,
            date: selectedSessionForReschedule.rawDate,
            time: selectedSessionForReschedule.rawTime,
            mentee: selectedSessionForReschedule.mentee,
            topic: selectedSessionForReschedule.topic
          }}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedSessionForReschedule(null);
          }}
          onReschedule={handleRescheduleSuccess}
        />
      )}

      <Dialog open={showPricingModal} onOpenChange={setShowPricingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Pricing</DialogTitle>
            <DialogDescription>Configure your hourly rate</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate (₹)</Label>
              <Input
                id="hourlyRate"
                type="number"
                placeholder="Enter amount"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPricingModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetPricing}>
              <Save className="h-4 w-4 mr-2" />
              Save Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReviewsModal} onOpenChange={setShowReviewsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Reviews</DialogTitle>
            <DialogDescription>Feedback from your mentees ({reviews.length} reviews)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-medium">
                          {review.reviewer?.first_name} {review.reviewer?.last_name}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-sm text-muted-foreground ml-2">
                            {review.rating}/5
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {new Date(review.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {review.review_text || 'No written review provided'}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No reviews yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete sessions with mentees to receive reviews
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showMenteesModal} onOpenChange={setShowMenteesModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Mentees</DialogTitle>
            <DialogDescription>Students you've mentored</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {mentees.length > 0 ? (
              mentees.map((mentee: any) => (
                <Card key={mentee.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {mentee.first_name} {mentee.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{mentee.email}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No mentees yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MentorDashboard;
