import { Users, Target, Award, Heart, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const AboutPage = () => {
  const stats = [
    { value: "10,000+", label: "Active Users", icon: Users },
    { value: "50,000+", label: "Sessions Completed", icon: Target },
    { value: "4.9/5", label: "Average Rating", icon: Award },
    { value: "98%", label: "Success Rate", icon: Heart }
  ];

  const values = [
    {
      title: "Accessibility",
      description: "We believe everyone deserves access to quality mentorship, regardless of their background or location.",
      icon: Users
    },
    {
      title: "Quality",
      description: "Our rigorous vetting process ensures you connect with experienced, passionate mentors.",
      icon: Award
    },
    {
      title: "Growth",
      description: "We're committed to fostering continuous learning and development for both mentors and mentees.",
      icon: Target
    },
    {
      title: "Community",
      description: "Building a supportive ecosystem where knowledge sharing and collaboration thrive.",
      icon: Heart
    }
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "CEO & Co-Founder",
      bio: "Former Google PM with 10+ years building products that scale.",
      image: "/placeholder.svg"
    },
    {
      name: "Michael Rodriguez",
      role: "CTO & Co-Founder",
      bio: "Ex-Netflix engineer passionate about connecting people through technology.",
      image: "/placeholder.svg"
    },
    {
      name: "Emily Watson",
      role: "Head of Community",
      bio: "Former LinkedIn community lead with expertise in building engaged networks.",
      image: "/placeholder.svg"
    },
    {
      name: "David Kim",
      role: "Head of Product",
      bio: "Product leader from Airbnb focused on creating meaningful user experiences.",
      image: "/placeholder.svg"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Connecting Minds,
              <br />
              <span className="text-primary">Transforming Lives</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              MentiEdify is more than a platform—it's a movement to democratize access to mentorship 
              and accelerate personal and professional growth worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/explore">
                  Find Your Mentor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/become-mentor">Become a Mentor</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <stat.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                    <div className="text-3xl font-bold mb-2">{stat.value}</div>
                    <p className="text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground">
                We're on a mission to break down barriers to mentorship and create meaningful 
                connections that drive personal and professional growth. Through our platform, 
                we enable experienced professionals to share their knowledge while empowering 
                the next generation to achieve their goals.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Why MentiEdify Exists</h3>
                <p className="text-muted-foreground mb-6">
                  Traditional mentorship often relies on chance encounters or existing networks, 
                  leaving many talented individuals without access to guidance. We believe this 
                  is fundamentally unfair and limits human potential.
                </p>
                <p className="text-muted-foreground">
                  MentiEdify leverages technology to create a global marketplace for mentorship, 
                  making it easier than ever to find the right mentor for your unique goals and 
                  circumstances.
                </p>
              </div>
              <div className="relative">
                <img
                  src="/placeholder.svg"
                  alt="Team collaboration"
                  className="rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Values</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                These core principles guide everything we do and shape the community we're building.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => (
                <Card key={index}>
                  <CardHeader>
                    <value.icon className="h-8 w-8 text-primary mb-4" />
                    <CardTitle>{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Meet Our Team</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We're a diverse group of builders, dreamers, and mentorship enthusiasts 
                committed to creating positive change.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                    <h3 className="font-semibold mb-1">{member.name}</h3>
                    <Badge variant="secondary" className="mb-3">
                      {member.role}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Whether you're looking for guidance or ready to share your expertise, 
              join our community and be part of something bigger.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/explore">Find a Mentor</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link to="/become-mentor">Share Your Expertise</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;