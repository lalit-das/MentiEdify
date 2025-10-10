// src/components/MentorCard.tsx

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, Calendar, Clock, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Mentor {
  id: string;
  name: string;
  title: string;
  category: string;
  expertise: string[];
  bio: string;
  hourly_rate: number;
  rating: number;
  profile_image_url: string;
  total_sessions: number;
  availability_status: string;
  total_reviews: number;
  years_experience: number;
  is_verified?: boolean;
  response_time_hours?: number;
}

interface MentorCardProps {
  mentor: Mentor;
}

const MentorCard = ({ mentor }: MentorCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBookSession = () => {
    if (mentor.availability_status !== 'available') {
      toast({
        title: "Mentor Unavailable",
        description: `${mentor.name} is currently not available for bookings.`,
        variant: "destructive",
      });
      return;
    }

    console.log('📅 Navigating to booking page for:', mentor.name, 'ID:', mentor.id);
    navigate(`/booking?mentorId=${mentor.id}`);
  };

  const handleViewProfile = () => {
    console.log('👁️ Viewing profile for:', mentor.name);
    navigate(`/mentor/${mentor.id}`);
  };

  // Helper to get availability status color
  const getAvailabilityColor = () => {
    switch (mentor.availability_status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  // Helper to format response time
  const getResponseTime = () => {
    const hours = mentor.response_time_hours || 24;
    if (hours < 1) return 'within 30 mins';
    if (hours === 1) return 'within 1 hour';
    if (hours < 24) return `within ${hours} hours`;
    return 'within 1 day';
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-white border-border/50 hover:border-primary/30 relative overflow-hidden">
      {/* Hover gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start gap-4">
          {/* Profile Image */}
          <div className="relative">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md group-hover:border-primary/40 transition-colors">
              <img
                src={mentor.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor.name}`}
                alt={mentor.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            
            {/* Availability Badge */}
            {mentor.availability_status === 'available' && (
              <div className={`absolute -bottom-1 -right-1 ${getAvailabilityColor()} rounded-full p-1 shadow-md ring-2 ring-white`}>
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
            )}
            
            {/* Verified Badge */}
            {mentor.is_verified && (
              <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-1 shadow-md ring-2 ring-white">
                <Award className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          {/* Name and Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg truncate text-gray-900 group-hover:text-primary transition-colors">
                {mentor.name}
              </h3>
              {mentor.is_verified && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-blue-500/10 text-blue-700 border-0">
                  ✓
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {mentor.title}
            </p>
            {mentor.years_experience > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <TrendingUp className="h-3 w-3" />
                {mentor.years_experience}+ years experience
              </p>
            )}
          </div>
        </div>

        {/* Category & Response Time */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="capitalize">
            {mentor.category}
          </Badge>
          {mentor.response_time_hours && (
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getResponseTime()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3 relative z-10">
        {/* Bio */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {mentor.bio || 'Experienced mentor ready to help you achieve your goals.'}
        </p>

        {/* Expertise Tags */}
        <div className="flex flex-wrap gap-1.5">
          {mentor.expertise?.slice(0, 3).map((skill, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="text-xs px-2 py-0.5 hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-default"
            >
              {skill}
            </Badge>
          ))}
          {mentor.expertise?.length > 3 && (
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-muted/50">
              +{mentor.expertise.length - 3} more
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm pt-2 border-t">
          <div className="flex items-center gap-1 text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-semibold text-gray-900">
              {mentor.rating?.toFixed(1) || '0.0'}
            </span>
            <span className="text-muted-foreground text-xs">
              ({mentor.total_reviews || 0})
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">
              {mentor.total_sessions || 0}
            </span>
            <span className="text-xs">session{mentor.total_sessions !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 border-t bg-gradient-to-b from-transparent to-muted/20 relative z-10">
        {/* Hourly Rate */}
        <div className="flex flex-col"> 
          <p className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ₹{mentor.hourly_rate}
          </p>
          <span className="text-xs text-muted-foreground">per hour</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewProfile}
            className="hover:bg-primary/10 hover:border-primary/30 transition-colors"
          >
            View Profile
          </Button>
          <Button 
            size="sm"
            onClick={handleBookSession}
            disabled={mentor.availability_status !== 'available'}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {mentor.availability_status === 'available' ? 'Book Session' : 'Unavailable'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MentorCard;
