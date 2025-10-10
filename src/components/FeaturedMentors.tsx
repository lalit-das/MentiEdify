import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Calendar, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface Mentor {
  id: string;
  name: string;
  title: string;
  bio?: string;
  hourly_rate: number;
  rating: number;
  total_reviews: number;
  expertise: string[];
  profile_image_url?: string;
  is_verified: boolean;
  years_experience: number;
}

const FeaturedMentors = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedMentors();
  }, []);

  const fetchFeaturedMentors = async () => {
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('is_verified', true)
        .order('rating', { ascending: false })
        .limit(4);

      if (error) throw error;
      setMentors(data || []);
    } catch (error) {
      console.error('Error fetching featured mentors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = (mentorId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to book a session.",
      });
      navigate('/auth');
      return;
    }
    navigate(`/booking?mentor=${mentorId}`);
  };
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Featured Mentors
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with industry leaders who have been where you want to go. 
            Learn from their experience and accelerate your growth.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading featured mentors...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {mentors.map((mentor, index) => (
            <Card 
              key={mentor.id}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer bg-gradient-card border-0 overflow-hidden animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="relative pb-4">
                <div className="relative mx-auto">
                  <img 
                    src={mentor.profile_image_url || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`} 
                    alt={mentor.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-4 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300"
                  />
                  {mentor.is_verified && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                      <Award className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                    {mentor.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-1">{mentor.title}</p>
                  <p className="text-sm font-medium text-primary">{mentor.years_experience}+ years experience</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-medium">{mentor.rating?.toFixed(1) || '0.0'}</span>
                    <span className="text-muted-foreground">({mentor.total_reviews || 0})</span>
                  </div>
                  <span className="font-semibold text-primary">${mentor.hourly_rate || 0}/hr</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {mentor.expertise?.slice(0, 2).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  )) || []}
                  {mentor.expertise && mentor.expertise.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{mentor.expertise.length - 2}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3">
                  {mentor.bio || 'Professional mentor ready to help you achieve your goals.'}
                </p>

                <Button 
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  size="sm"
                  onClick={() => handleBookSession(mentor.id)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Session
                </Button>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        <div className="text-center animate-fade-in">
          <Button 
            size="lg" 
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-white transition-colors"
            onClick={() => navigate('/explore-mentors')}
          >
            View All Mentors
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedMentors;