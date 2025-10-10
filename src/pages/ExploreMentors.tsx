// @ts-nocheck
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import MentorCard from "@/components/MentorCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Users } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ExploreMentors = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const searchQuery = searchParams.get('search'); // ✅ Get search from URL
  
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'technology', label: 'Technology' },
    { id: 'business', label: 'Business' },
    { id: 'design', label: 'Design' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'health', label: 'Health & Wellness' },
    { id: 'education', label: 'Education' }
  ];

  // ✅ Set search term from URL when component mounts
  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery);
      console.log('🔍 Search query from URL:', searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchMentors();
  }, [selectedCategory]);

  const fetchMentors = async () => {
    setLoading(true);
    
    let query = supabase
      .from('mentors')
      .select('*')
      .eq('availability_status', 'available');
    
    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }
    
    const { data, error } = await query.order('rating', { ascending: false });
    
    if (!error && data) {
      setMentors(data);
      console.log('✅ Fetched mentors:', data.length);
    } else {
      console.error('❌ Error fetching mentors:', error);
    }
    
    setLoading(false);
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.expertise?.some(skill => 
      skill.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      {/* Header Component - Sticky at top */}
      <Header />
      
      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Explore Mentors
            </h1>
            <p className="text-muted-foreground">
              Connect with {mentors.length} expert mentors across various industries
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search by name, skills, or expertise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white shadow-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
            {/* Show active search indicator */}
            {searchTerm && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Searching for: <span className="font-semibold text-primary">"{searchTerm}"</span>
              </p>
            )}
          </div>

          {/* Category Filters */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Filter by Category
            </h2>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 text-sm transition-all ${
                    selectedCategory === category.id 
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-md scale-105' 
                      : 'hover:bg-primary/10 hover:border-primary'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.label}
                  {selectedCategory === category.id && (
                    <span className="ml-2 bg-white/20 rounded-full px-2 py-0.5 text-xs">
                      {filteredMentors.length}
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Results Count */}
          {!loading && filteredMentors.length > 0 && (
            <div className="mb-6">
              <p className="text-muted-foreground">
                Showing <span className="font-semibold text-primary">{filteredMentors.length}</span> mentor{filteredMentors.length !== 1 ? 's' : ''}
                {selectedCategory !== 'all' && (
                  <span> in <span className="font-semibold capitalize">{selectedCategory}</span></span>
                )}
                {searchTerm && (
                  <span> matching <span className="font-semibold">"{searchTerm}"</span></span>
                )}
              </p>
            </div>
          )}

          {/* Mentors Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">Loading mentors...</p>
              </div>
            </div>
          ) : filteredMentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map(mentor => (
                <MentorCard key={mentor.id} mentor={mentor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-8">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">No mentors found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm 
                    ? `No results for "${searchTerm}". Try adjusting your search.`
                    : 'No mentors available in this category yet.'}
                </p>
                <Badge 
                  variant="outline" 
                  className="cursor-pointer px-4 py-2 hover:bg-primary/10 transition-colors"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchTerm('');
                  }}
                >
                  Reset Filters
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Component */}
      <Footer />
    </>
  );
};

export default ExploreMentors;
