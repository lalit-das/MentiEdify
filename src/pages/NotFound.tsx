import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-4 animate-fade-in">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-6xl font-bold text-white">404</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Page Not Found</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-gradient-primary hover:opacity-90 transition-opacity">
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button 
            variant="outline" 
            asChild
            className="border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Link to="/explore">
              <Search className="h-4 w-4 mr-2" />
              Find Mentors
            </Link>
          </Button>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Need help? <Link to="/contact" className="text-primary hover:underline">Contact our support team</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
