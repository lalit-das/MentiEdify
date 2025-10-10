import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, User, Bell, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserType = async () => {
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('user_type')
          .eq('id', user.id)
          .single();
        setUserType(data?.user_type || null);
      } else {
        setUserType(null);
      }
    };
    fetchUserType();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-foreground">MentiEdify</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/explore" className="text-muted-foreground hover:text-primary transition-colors">
              Find Mentors
            </Link>
            <Link to="/categories" className="text-muted-foreground hover:text-primary transition-colors">
              Categories
            </Link>
            <Link to="/become-mentor" className="text-muted-foreground hover:text-primary transition-colors">
              Become a Mentor
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
              <Search className="h-4 w-4" />
            </Button>
            
            {user ? (
              <>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                  <Bell className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="hidden lg:inline">{user.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={userType === 'mentor' ? '/mentor-dashboard' : '/mentee-dashboard'}>
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/messages">Messages</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Log In</Link>
                </Button>
                <Button className="bg-gradient-primary hover:opacity-90 transition-opacity" asChild>
                  <Link to="/auth">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col space-y-4">
              <Link 
                to="/explore" 
                className="text-muted-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Mentors
              </Link>
              <Link 
                to="/categories" 
                className="text-muted-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Categories
              </Link>
              <Link 
                to="/become-mentor" 
                className="text-muted-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Become a Mentor
              </Link>
              <Link 
                to="/about" 
                className="text-muted-foreground hover:text-primary transition-colors px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                {user ? (
                  <>
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/profile" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to={userType === 'mentor' ? '/mentor-dashboard' : '/mentee-dashboard'} onClick={() => setIsMenuOpen(false)}>
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/messages" onClick={() => setIsMenuOpen(false)}>Messages</Link>
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="justify-start text-red-600"
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Log In</Link>
                    </Button>
                    <Button className="bg-gradient-primary hover:opacity-90 transition-opacity" asChild>
                      <Link to="/auth" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;