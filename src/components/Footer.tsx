import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Twitter, 
  Linkedin, 
  Instagram, 
  Youtube,
  Mail,
  Phone,
  MapPin
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-white">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-white">MentiEdify</span>
            </Link>
            <p className="text-white/80 leading-relaxed">
              Connecting ambitious professionals with industry experts for personalized mentorship 
              and accelerated career growth.
            </p>
            <div className="flex space-x-4">
              <Button size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* For Mentees */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">For Mentees</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/explore" className="text-white/80 hover:text-white transition-colors">
                  Find Mentors
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-white/80 hover:text-white transition-colors">
                  Browse Categories
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-white/80 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/success-stories" className="text-white/80 hover:text-white transition-colors">
                  Success Stories
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-white/80 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* For Mentors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">For Mentors</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/become-mentor" className="text-white/80 hover:text-white transition-colors">
                  Become a Mentor
                </Link>
              </li>
              <li>
                <Link to="/mentor-guidelines" className="text-white/80 hover:text-white transition-colors">
                  Mentor Guidelines
                </Link>
              </li>
              <li>
                <Link to="/mentor-resources" className="text-white/80 hover:text-white transition-colors">
                  Resources
                </Link>
              </li>
              <li>
                <Link to="/mentor-dashboard" className="text-white/80 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/earnings" className="text-white/80 hover:text-white transition-colors">
                  Earnings
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Stay Updated</h3>
            <p className="text-white/80 text-sm">
              Get the latest mentorship tips and platform updates delivered to your inbox.
            </p>
            <div className="space-y-2">
              <Input 
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
              <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 pt-8 border-t border-white/10">
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-white/80 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-white/80 hover:text-white transition-colors text-sm">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/press" className="text-white/80 hover:text-white transition-colors text-sm">
                  Press
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-white/80 hover:text-white transition-colors text-sm">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-white/80 hover:text-white transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-white/80 hover:text-white transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/safety" className="text-white/80 hover:text-white transition-colors text-sm">
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-white/80 hover:text-white transition-colors text-sm">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-white/80">
                <Mail className="h-4 w-4" />
                <span className="text-sm">hello@mentiedify.com</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <Phone className="h-4 w-4" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 text-white/80">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap justify-center md:justify-start space-x-6">
              <Link to="/privacy" className="text-white/80 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-white/80 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-white/80 hover:text-white transition-colors text-sm">
                Cookie Policy
              </Link>
              <Link to="/accessibility" className="text-white/80 hover:text-white transition-colors text-sm">
                Accessibility
              </Link>
            </div>
            
            <div className="text-white/80 text-sm">
              © 2024 MentiEdify. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;