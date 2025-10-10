import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Alex Thompson",
    role: "Software Developer",
    company: "Microsoft",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=60&h=60&fit=crop&crop=face",
    rating: 5,
    text: "My mentor helped me transition from junior to senior developer in just 8 months. The personalized guidance and industry insights were invaluable.",
    category: "Technology"
  },
  {
    id: 2,
    name: "Jessica Chen",
    role: "Product Manager",
    company: "Shopify",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&h=60&fit=crop&crop=face",
    rating: 5,
    text: "Thanks to my business mentor, I successfully launched my startup and secured Series A funding. The strategic advice was game-changing.",
    category: "Business"
  },
  {
    id: 3,
    name: "Michael Rodriguez",
    role: "UX Designer",
    company: "Adobe",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=60&h=60&fit=crop&crop=face",
    rating: 5,
    text: "The design mentorship transformed my portfolio and helped me land my dream job at Adobe. Amazing experience and worth every penny.",
    category: "Design"
  },
  {
    id: 4,
    name: "Sarah Wilson",
    role: "Marketing Director",
    company: "HubSpot",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b526?w=60&h=60&fit=crop&crop=face",
    rating: 5,
    text: "My mentor's expertise in digital marketing helped me 3x our conversion rates and advance to a director role. Highly recommend!",
    category: "Marketing"
  },
  {
    id: 5,
    name: "David Kim",
    role: "Data Scientist",
    company: "Netflix",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face",
    rating: 5,
    text: "The technical guidance and career advice from my mentor were crucial in my transition to data science. Now working at my dream company!",
    category: "Technology"
  },
  {
    id: 6,
    name: "Emma Davis",
    role: "Healthcare Administrator",
    company: "Mayo Clinic",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face",
    rating: 5,
    text: "My health sector mentor provided invaluable insights that helped me navigate complex healthcare challenges and advance my career.",
    category: "Health"
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Success Stories
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Hear from professionals who transformed their careers through mentorship. 
            Join thousands who have accelerated their growth with MentiEdify.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={testimonial.id}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-gradient-card border-0 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="mb-4">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    "{testimonial.text}"
                  </p>
                  
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/10"
                  />
                  <div>
                    <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-sm font-medium text-primary">{testimonial.company}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                    {testimonial.category}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center space-x-4 p-4 bg-success-light rounded-2xl animate-fade-in">
            <div className="flex items-center space-x-1">
              <Star className="h-5 w-5 text-success fill-current" />
              <span className="text-xl font-bold text-success">4.9/5</span>
            </div>
            <div className="text-success-foreground">
              <span className="font-semibold">Trusted by 50,000+ professionals</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;