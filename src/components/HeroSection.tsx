import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, Users, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-mentorship.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    console.log('🔍 Search triggered with query:', searchQuery); // Debug log
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/explore');
    }
  };

  // ✅ FIXED: Changed from onKeyPress to onKeyDown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      handleSearch();
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Professional mentorship environment" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-accent/80"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Find Your Perfect
            <span className="block bg-gradient-to-r from-white to-accent-light bg-clip-text text-transparent">
              Mentor Today
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Connect with industry experts across technology, business, design, and more. 
            Accelerate your career with personalized one-on-one mentorship.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12 animate-slide-up">
            <div className="relative">
              <Input 
                placeholder="Search for mentors by skill, industry, or expertise..."
                className="h-14 pl-14 pr-32 text-lg bg-white/95 backdrop-blur-sm border-0 shadow-xl text-gray-900 placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => {
                  console.log('📝 Search input changed:', e.target.value); // Debug log
                  setSearchQuery(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-500 pointer-events-none" />
              <Button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={handleSearch}
                type="button"
              >
                Search
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-scale-in">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-8 w-8 text-white mr-2" />
                <span className="text-3xl font-bold text-white">10K+</span>
              </div>
              <p className="text-white/80">Expert Mentors</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-8 w-8 text-white mr-2" />
                <span className="text-3xl font-bold text-white">4.9</span>
              </div>
              <p className="text-white/80">Average Rating</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-white mr-2" />
                <span className="text-3xl font-bold text-white">50K+</span>
              </div>
              <p className="text-white/80">Sessions Completed</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90 transition-colors shadow-xl"
              onClick={() => navigate('/explore')}
            >
              Find a Mentor
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 text-lg border-white text-white hover:bg-white hover:text-primary transition-colors"
              onClick={() => navigate('/become-mentor')}
            >
              Become a Mentor
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
