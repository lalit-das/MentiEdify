// src/pages/MenteeDashboard.tsx

import { useState, useEffect } from "react";
import { Calendar, Clock, BookOpen, MessageSquare, Star, Target, User, Video, Bot, Plus, X, Briefcase, Users, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AIChat } from '@/components/AIChat';
import { RescheduleModal } from '@/components/RescheduleModal';

const MenteeDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [completedSessions, setCompletedSessions] = useState<any[]>([]);
  const [learningGoals, setLearningGoals] = useState<any[]>([]);
  const [stats, setStats] = useState([
    { title: "Sessions Completed", value: "0", icon: BookOpen },
    { title: "Hours of Mentorship", value: "0", icon: Clock },
    { title: "Active Mentors", value: "0", icon: User },
    { title: "Average Rating Given", value: "0", icon: Star }
  ]);
  
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [showInterestInput, setShowInterestInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedSessionForReschedule, setSelectedSessionForReschedule] = useState<any>(null);

  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMentorsModal, setShowMentorsModal] = useState(false);
  
  const [newGoal, setNewGoal] = useState({ goal: '', target: '', progress: 0 });
  const [myMentors, setMyMentors] = useState<any[]>([]);
  const [selectedSessionForReview, setSelectedSessionForReview] = useState<any>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, review_text: '' });

  const suggestedInterests = [
    'Web Development',
    'Data Science',
    'Product Management',
    'UX Design',
    'Mobile Development',
    'Machine Learning',
    'Cloud Computing',
    'Cybersecurity',
    'DevOps',
    'Business Strategy'
  ];

  useEffect(() => {
    if (user) {
      fetchMenteeData();
      fetchLearningGoals();
    }
  }, [user]);

  const handleJoinCall = async (bookingId: string) => {
    try {
      console.log('🔵 MENTEE joining call for booking:', bookingId);
      
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
      } else {
        sessionId = existingSession.id;
      }

      const isInitiator = false;
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

  const handleOpenReschedule = (session: any) => {
    setSelectedSessionForReschedule(session);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSuccess = () => {
    setShowRescheduleModal(false);
    setSelectedSessionForReschedule(null);
    fetchMenteeData(); // Refresh data
  };

  const fetchMenteeData = async () => {
    try {
      setLoading(true);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('interests')
        .eq('id', user?.id)
        .single();

      if (!userError && userData) {
        setInterests(userData.interests || []);
      }

      // ✅ UPDATED: Added reschedule_count to query
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('bookings')
        .select(`
          *,
          mentors(id, name, title),
          reschedule_count
        `)
        .eq('mentee_id', user?.id)
        .in('status', ['pending', 'confirmed'])
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date', { ascending: true })
        .order('session_time', { ascending: true });

      if (upcomingError) throw upcomingError;

      const formattedUpcoming = (upcomingData || []).map((booking: any) => ({
        id: booking.id,
        mentor: booking.mentors?.name || 'Unknown Mentor',
        time: booking.session_time,
        date: new Date(booking.session_date).toLocaleDateString(),
        rawDate: booking.session_date,
        rawTime: booking.session_time,
        topic: booking.notes || 'General Mentoring Session',
        type: booking.session_type === 'video' ? 'Video Call' : 
              booking.session_type === 'audio' ? 'Audio Call' : 'Chat Session',
        rescheduleCount: booking.reschedule_count ?? 0
      }));

      setUpcomingSessions(formattedUpcoming);

      // ✅ Fetch completed sessions with mentor_id
      const { data: completedData, error: completedError } = await supabase
        .from('bookings')
        .select(`
          *,
          mentors(name, title),
          reviews(rating, review_text)
        `)
        .eq('mentee_id', user?.id)
        .eq('status', 'completed')
        .order('session_date', { ascending: false })
        .limit(10);

      if (completedError) throw completedError;

      const formattedCompleted = (completedData || []).map((booking: any) => ({
        id: booking.id,
        mentor: booking.mentors?.name || 'Unknown Mentor',
        date: new Date(booking.session_date).toLocaleDateString(),
        topic: booking.notes || 'General Mentoring Session',
        rating: booking.reviews?.[0]?.rating || 0,
        notes: booking.reviews?.[0]?.review_text || 'No review yet',
        hasReview: booking.reviews && booking.reviews.length > 0
      }));

      console.log('✅ Formatted completed sessions:', formattedCompleted);
      setCompletedSessions(formattedCompleted);

      const completedCount = completedData?.length || 0;
      const totalHours = completedCount * 1;
      const uniqueMentors = new Set(completedData?.map(b => b.mentor_id)).size;
      const ratingsGiven = completedData?.map(b => b.reviews?.[0]?.rating).filter(r => r) || [];
      const averageRating = ratingsGiven.length > 0 
        ? (ratingsGiven.reduce((sum: number, rating: number) => sum + rating, 0) / ratingsGiven.length).toFixed(1)
        : '0';

      setStats([
        { title: "Sessions Completed", value: completedCount.toString(), icon: BookOpen },
        { title: "Hours of Mentorship", value: totalHours.toString(), icon: Clock },
        { title: "Active Mentors", value: uniqueMentors.toString(), icon: User },
        { title: "Average Rating Given", value: averageRating, icon: Star }
      ]);

    } catch (error) {
      console.error('Error fetching mentee data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLearningGoals = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('goals')
        .eq('id', user?.id)
        .single();

      if (userData?.goals) {
        try {
          const parsedGoals = typeof userData.goals === 'string' 
            ? JSON.parse(userData.goals) 
            : userData.goals;
          setLearningGoals(Array.isArray(parsedGoals) ? parsedGoals : []);
        } catch {
          setLearningGoals([]);
        }
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.goal.trim()) {
      toast({
        title: "Error",
        description: "Please enter a goal.",
        variant: "destructive",
      });
      return;
    }

    const goalToAdd = {
      id: Date.now(),
      goal: newGoal.goal,
      target: newGoal.target || '3 months',
      progress: 0
    };

    const updatedGoals = [...learningGoals, goalToAdd];
    setLearningGoals(updatedGoals);

    try {
      const { error } = await supabase
        .from('users')
        .update({ goals: JSON.stringify(updatedGoals) })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Goal added successfully!",
      });

      setNewGoal({ goal: '', target: '', progress: 0 });
      setShowGoalsModal(false);
    } catch (error) {
      console.error('Error saving goal:', error);
      toast({
        title: "Error",
        description: "Failed to save goal.",
        variant: "destructive",
      });
    }
  };

  const fetchMyMentors = async () => {
    try {
      console.log('🔍 Fetching mentors for user:', user?.id);

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          mentor_id,
          mentors!bookings_mentor_id_fkey(
            id,
            name,
            title,
            profile_image_url,
            rating
          )
        `)
        .eq('mentee_id', user?.id)
        .eq('status', 'completed');

      if (error) {
        console.error('❌ Error fetching mentors:', error);
        throw error;
      }

      console.log('📊 Raw mentors data:', data);

      const validMentors = data
        .filter(item => item.mentors && item.mentor_id)
        .map(item => ({
          ...item.mentors,
          mentor_id: item.mentor_id
        }));

      const uniqueMentors = Array.from(
        new Map(validMentors.map(mentor => [mentor.mentor_id, mentor])).values()
      );

      console.log('✅ Unique mentors:', uniqueMentors);

      if (uniqueMentors.length === 0) {
        toast({
          title: "No mentors yet",
          description: "Complete a session to see your mentors here.",
        });
        return;
      }

      setMyMentors(uniqueMentors);
      setShowMentorsModal(true);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      toast({
        title: "Error",
        description: "Failed to load mentors.",
        variant: "destructive",
      });
    }
  };

  const handleOpenReview = () => {
    const sessionsWithoutReview = completedSessions.filter(s => !s.hasReview);
    
    if (sessionsWithoutReview.length === 0) {
      toast({
        title: "No Pending Reviews",
        description: "You've reviewed all your completed sessions!",
      });
      return;
    }

    setSelectedSessionForReview(sessionsWithoutReview[0]);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedSessionForReview || !reviewData.review_text.trim()) {
      toast({
        title: "Error",
        description: "Please provide a review.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: booking } = await supabase
        .from('bookings')
        .select('mentor_id')
        .eq('id', selectedSessionForReview.id)
        .single();

      const { error } = await supabase
        .from('reviews')
        .insert({
          booking_id: selectedSessionForReview.id,
          reviewer_id: user?.id,
          mentor_id: booking?.mentor_id,
          rating: reviewData.rating,
          review_text: reviewData.review_text
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review submitted successfully!",
      });

      setShowReviewModal(false);
      setReviewData({ rating: 5, review_text: '' });
      fetchMenteeData();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review.",
        variant: "destructive",
      });
    }
  };

  const handleAddInterest = async (interest?: string) => {
    const interestToAdd = interest || newInterest.trim();
    
    if (!interestToAdd || interests.includes(interestToAdd)) {
      if (!interestToAdd) {
        toast({
          title: "Error",
          description: "Please enter an interest.",
          variant: "destructive",
        });
      }
      return;
    }

    const updatedInterests = [...interests, interestToAdd];
    setInterests(updatedInterests);
    setNewInterest('');
    setShowInterestInput(false);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ interests: updatedInterests })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `"${interestToAdd}" added to your interests!`,
      });
    } catch (error) {
      console.error('Error saving interest:', error);
      toast({
        title: "Error",
        description: "Failed to save interest.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveInterest = async (interest: string) => {
    const updatedInterests = interests.filter(i => i !== interest);
    setInterests(updatedInterests);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ interests: updatedInterests })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `"${interest}" removed.`,
      });
    } catch (error) {
      console.error('Error removing interest:', error);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Learning Journey</h1>
            <p className="text-muted-foreground">Track your progress and upcoming sessions with mentors.</p>
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
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Sessions
                  </CardTitle>
                  <CardDescription>Your scheduled mentorship sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingSessions.length > 0 ? (
                    <>
                      {upcomingSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                          <div className="space-y-1 flex-1">
                            <h4 className="font-medium">{session.mentor}</h4>
                            <p className="text-sm text-muted-foreground">{session.topic}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4" />
                              {session.date} at {session.time}
                            </div>
                            {session.rescheduleCount > 0 && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Rescheduled {session.rescheduleCount}x
                              </Badge>
                            )}
                          </div>
                          <div className="text-right space-y-2 ml-4">
                            <Badge variant="outline">{session.type}</Badge>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleOpenReschedule(session)}
                                disabled={session.rescheduleCount >= 3}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Reschedule
                              </Button>
                              <Button size="sm" onClick={() => handleJoinCall(session.id)}>
                                <Video className="h-3 w-3 mr-1" />
                                Join
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Upcoming Sessions</h3>
                      <p className="text-muted-foreground mb-4">Book your first mentorship session</p>
                    </div>
                  )}
                  <Button className="w-full" variant="outline" onClick={() => navigate('/explore')}>
                    Book New Session
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your learning journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowAIChat(true)}>
                    <Bot className="mr-2 h-4 w-4" />
                    AI Learning Assistant
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/explore')}>
                    <User className="mr-2 h-4 w-4" />
                    Find New Mentors
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => setShowGoalsModal(true)}>
                    <Target className="mr-2 h-4 w-4" />
                    Set Learning Goals
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={() => {
                    console.log('🔘 My Mentors clicked');
                    fetchMyMentors();
                  }}>
                    <Users className="mr-2 h-4 w-4" />
                    My Mentors
                  </Button>
                  <Button className="w-full justify-start" variant="outline" onClick={handleOpenReview}>
                    <Star className="mr-2 h-4 w-4" />
                    Leave Reviews
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Learning Goals
                </CardTitle>
                <CardDescription>Track your progress towards your learning objectives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {learningGoals.length > 0 ? (
                  learningGoals.map((goal: any) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{goal.goal}</h4>
                        <span className="text-sm text-muted-foreground">Target: {goal.target}</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                      <p className="text-sm text-muted-foreground">{goal.progress}% complete</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No goals set yet</p>
                  </div>
                )}
                <Button className="w-full" variant="outline" onClick={() => setShowGoalsModal(true)}>
                  Add New Goal
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Areas of Interest
                </CardTitle>
                <CardDescription>Topics and fields you're passionate about</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {interests.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Your Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-2 text-sm">
                          {interest}
                          <button
                            onClick={() => handleRemoveInterest(interest)}
                            className="ml-2 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {interests.length === 0 && (
                  <div className="text-center py-8">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No interests added yet.</p>
                  </div>
                )}

                {showInterestInput ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type an interest..."
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                      autoFocus
                    />
                    <Button onClick={() => handleAddInterest()}>Add</Button>
                    <Button variant="outline" onClick={() => {
                      setShowInterestInput(false);
                      setNewInterest('');
                    }}>Cancel</Button>
                  </div>
                ) : (
                  <Button onClick={() => setShowInterestInput(true)} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Interests
                  </Button>
                )}

                {!showInterestInput && (
                  <div>
                    <h4 className="font-medium mb-3">Suggested Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {suggestedInterests.filter(s => !interests.includes(s)).map((interest, index) => (
                        <button
                          key={index}
                          onClick={() => handleAddInterest(interest)}
                          className="px-3 py-1.5 text-sm border border-primary/30 rounded-full hover:bg-primary/10"
                        >
                          <Plus className="h-3 w-3 inline mr-1" />
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </CardTitle>
                <CardDescription>Communicate with your mentors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No New Messages</h3>
                  <p className="text-muted-foreground mb-4">Start a conversation</p>
                  <Button variant="outline">View Conversations</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ✅ UPDATED: Session History Tab with functional "Book Again" */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session History</CardTitle>
                <CardDescription>Review completed sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedSessions.length > 0 ? (
                  <>
                    {completedSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-medium text-lg">{session.mentor}</h4>
                          <p className="text-sm text-muted-foreground">{session.topic}</p>
                          <p className="text-xs text-muted-foreground">{session.date}</p>
                          {session.hasReview && (
                            <div className="flex items-center gap-1 mt-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < session.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          {!session.hasReview && (
                            <Badge variant="outline" className="mb-2 block">No Review</Badge>
                          )}
                          <Button size="sm" variant="outline">Book Again</Button>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Session History</h3>
                    <p className="text-muted-foreground">Complete sessions to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {showAIChat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <AIChat 
            onClose={() => setShowAIChat(false)}
            context="You are assisting a mentee on a learning platform."
          />
        </div>
      )}

      {showRescheduleModal && selectedSessionForReschedule && (
        <RescheduleModal
          session={{
            id: selectedSessionForReschedule.id,
            date: selectedSessionForReschedule.rawDate,
            time: selectedSessionForReschedule.rawTime,
            mentor: selectedSessionForReschedule.mentor,
            topic: selectedSessionForReschedule.topic
          }}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedSessionForReschedule(null);
          }}
          onReschedule={handleRescheduleSuccess}
        />
      )}

      <Dialog open={showGoalsModal} onOpenChange={setShowGoalsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Learning Goal</DialogTitle>
            <DialogDescription>Define a new learning objective</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Input
                id="goal"
                placeholder="e.g., Master React Development"
                value={newGoal.goal}
                onChange={(e) => setNewGoal({ ...newGoal, goal: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target Timeline</Label>
              <Input
                id="target"
                placeholder="e.g., 3 months"
                value={newGoal.target}
                onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalsModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGoal}>Add Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Review your session with {selectedSessionForReview?.mentor}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= reviewData.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="review">Your Review</Label>
              <Textarea
                id="review"
                placeholder="Share your experience..."
                value={reviewData.review_text}
                onChange={(e) => setReviewData({ ...reviewData, review_text: e.target.value })}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMentorsModal} onOpenChange={setShowMentorsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Mentors</DialogTitle>
            <DialogDescription>Mentors you've worked with</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {myMentors.length > 0 ? (
              myMentors.map((mentor: any) => (
                <Card key={mentor.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{mentor.name}</p>
                        <p className="text-sm text-muted-foreground">{mentor.title}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{mentor.rating || 0}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button size="sm">Book Again</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No mentors yet</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Complete a session to see your mentors
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default MenteeDashboard;
