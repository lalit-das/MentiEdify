import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Code, 
  Briefcase, 
  Palette, 
  TrendingUp, 
  Heart, 
  GraduationCap,
  Users,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const categories = [
  {
    id: "technology",
    name: "Technology",
    icon: Code,
    mentorCount: 2500,
    color: "bg-blue-500",
    description: "Software Development, AI/ML, DevOps, Cybersecurity"
  },
  {
    id: "business",
    name: "Business",
    icon: Briefcase,
    mentorCount: 1800,
    color: "bg-green-500",
    description: "Entrepreneurship, Marketing, Finance, Strategy"
  },
  {
    id: "design",
    name: "Design",
    icon: Palette,
    mentorCount: 1200,
    color: "bg-purple-500",
    description: "UI/UX, Graphic Design, Product Design, Branding"
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: TrendingUp,
    mentorCount: 1500,
    color: "bg-orange-500",
    description: "Digital Marketing, Content, SEO, Social Media"
  },
  {
    id: "health",
    name: "Health & Wellness",
    icon: Heart,
    mentorCount: 900,
    color: "bg-red-500",
    description: "Fitness, Nutrition, Mental Health, Coaching"
  },
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    mentorCount: 1100,
    color: "bg-yellow-500",
    description: "Teaching, Career Counseling, Academic Guidance"
  }
];

const CategoriesPage = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Browse by Category
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find expert mentors across various industries and domains
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link 
                  key={category.id} 
                  to={`/explore?category=${category.id}`}
                  className="transform hover:scale-105 transition-transform"
                >
                  <Card className="h-full hover:shadow-xl transition-shadow cursor-pointer bg-white">
                    <CardHeader>
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`${category.color} p-4 rounded-lg shadow-md`}>
                          <IconComponent className="h-8 w-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl">{category.name}</CardTitle>
                      </div>
                      <p className="text-muted-foreground">
                        {category.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {category.mentorCount} Mentors
                        </Badge>
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CategoriesPage;
