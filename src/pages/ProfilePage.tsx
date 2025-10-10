import { useState, useEffect } from "react";
import { Camera, Edit3, MapPin, Calendar, Award, BookOpen, Users, Star, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EditMentorProfileDialog } from "@/components/EditMentorProfileDialog";

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    sessionsCompleted: 0,
    hoursOfMentorship: 0,
    rating: 0,
    totalReviews: 0
  });

  useEffect(() => {
    if (authUser) {
      fetchUserProfile();
      fetchUserStats();
    }
  }, [authUser]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser?.id)
        .single();

      if (userError) throw userError;

      // Check if user is a mentor to get additional data
      const { data: mentorData } = await supabase
        .from('mentors')
        .select('*')
        .eq('user_id', authUser?.id)
        .single();

      setUserProfile({
        ...userData,
        mentorData,
        joinDate: new Date(userData.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        })
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get booking stats
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .or(`mentor_id.eq.${authUser?.id},mentee_id.eq.${authUser?.id}`)
        .eq('status', 'completed');

      if (bookingsError) throw bookingsError;

      // Get review stats if user is a mentor
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('mentor_id', authUser?.id);

      if (reviewsError) throw reviewsError;

      const sessionsCompleted = bookings?.length || 0;
      const averageRating = reviews?.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0;

      setStats({
        sessionsCompleted,
        hoursOfMentorship: sessionsCompleted, // Assuming 1 hour per session
        rating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews?.length || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const achievements = [
    { 
      id: 1, 
      title: "First Session Complete", 
      description: "Completed your first mentoring session", 
      date: userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : "Recently", 
      icon: BookOpen,
      earned: stats.sessionsCompleted > 0
    },
    { 
      id: 2, 
      title: "Rising Star", 
      description: "Received 10+ five-star reviews", 
      date: "Achievement in progress", 
      icon: Star,
      earned: stats.totalReviews >= 10 && stats.rating >= 4.5
    },
    { 
      id: 3, 
      title: "Active Mentor", 
      description: "Completed 5+ mentoring sessions", 
      date: "Achievement in progress", 
      icon: Award,
      earned: stats.sessionsCompleted >= 5
    },
    { 
      id: 4, 
      title: "Community Builder", 
      description: "Helped 25+ mentees achieve their goals", 
      date: "Achievement in progress", 
      icon: Users,
      earned: stats.sessionsCompleted >= 25
    }
  ];

  const recentActivity = [
    { 
      id: 1, 
      type: "profile", 
      description: "Profile last updated", 
      date: userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : "Recently"
    },
    { 
      id: 2, 
      type: "stats", 
      description: `Completed ${stats.sessionsCompleted} total sessions`, 
      date: "Current stats"
    },
    { 
      id: 3, 
      type: "rating", 
      description: stats.rating > 0 ? `Maintaining ${stats.rating} average rating` : "No ratings yet", 
      date: "Current performance"
    }
  ];

  if (!authUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to view your profile</h1>
            <p className="text-muted-foreground">You need to be logged in to access your profile.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <img
                  src="/placeholder.svg"
                  alt={userProfile?.first_name || 'Profile'}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 rounded-full p-2"
                  onClick={() => setIsEditing(true)}
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold mb-1">
                      {userProfile?.first_name} {userProfile?.last_name}
                    </h1>
                    <p className="text-lg text-muted-foreground mb-2">
                      {userProfile?.mentorData ? (
                        userProfile.mentorData.expertise?.[0] || 'Mentor'
                      ) : (
                        userProfile?.user_type === 'mentor' ? 'Mentor' : 'Mentee'
                      )}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined {userProfile?.joinDate}
                    </div>
                    <p className="text-sm max-w-2xl">
                      {userProfile?.mentorData?.bio || 
                       `Welcome to your mentorship journey! ${userProfile?.user_type === 'mentor' ? 'Share your expertise with aspiring professionals.' : 'Connect with experienced mentors to grow your career.'}`}
                    </p>
                  </div>
                  {userProfile?.user_type === 'mentor' && (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {userProfile?.mentorData?.expertise?.map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  )) || (
                    <Badge variant="outline">
                      {userProfile?.user_type === 'mentor' ? 'Add your expertise' : 'Exploring opportunities'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.sessionsCompleted}</div>
              <p className="text-sm text-muted-foreground">Sessions Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.hoursOfMentorship}</div>
              <p className="text-sm text-muted-foreground">Hours of Mentorship</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.rating || 'N/A'}</div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Tabs defaultValue="goals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
          </TabsList>

          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle>Learning Goals</CardTitle>
                <CardDescription>Track your progress towards your professional objectives</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <h4 className="font-medium mb-2">Goal tracking coming soon!</h4>
                  <p className="text-sm text-muted-foreground">
                    Set and track your professional development goals.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
                <CardDescription>Milestones you've reached in your mentorship journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className={`flex items-start space-x-4 p-4 border rounded-lg ${
                        achievement.earned ? 'border-primary/50 bg-primary/5' : 'opacity-60'
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        achievement.earned ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <achievement.icon className={`h-5 w-5 ${
                          achievement.earned ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{achievement.date}</p>
                        {achievement.earned && (
                          <Badge variant="secondary" className="mt-2 text-xs">Earned</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interests">
            <Card>
              <CardHeader>
                <CardTitle>Areas of Interest</CardTitle>
                <CardDescription>Topics and fields you're passionate about</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {userProfile?.mentorData?.expertise?.map((interest: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {interest}
                    </Badge>
                  )) || (
                    <p className="text-muted-foreground">No interests added yet.</p>
                  )}
                </div>
                <Button variant="outline" className="mt-4" onClick={() => setIsEditing(true)}>
                  {userProfile?.mentorData?.expertise?.length > 0 ? 'Edit Interests' : 'Add Interests'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
      
      {userProfile?.user_type === 'mentor' && (
        <EditMentorProfileDialog
          open={isEditing}
          onOpenChange={setIsEditing}
          onProfileUpdated={() => {
            fetchUserProfile();
            fetchUserStats();
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;