import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, HelpCircle, Briefcase } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: ""
  });

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      contact: "support@mentiedify.com",
      availability: "24/7 response within 4 hours"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with our team",
      contact: "+1 (555) 123-4567",
      availability: "Mon-Fri 9AM-6PM PST"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with us instantly",
      contact: "Available on website",
      availability: "Mon-Fri 9AM-9PM PST"
    },
    {
      icon: MapPin,
      title: "Office Location",
      description: "Visit us in person",
      contact: "123 Innovation Drive, San Francisco, CA 94105",
      availability: "By appointment only"
    }
  ];

  const faqCategories = [
    {
      icon: HelpCircle,
      title: "General Questions",
      description: "How MentiEdify works, pricing, and basic information"
    },
    {
      icon: Briefcase,
      title: "Mentor Support",
      description: "Help for mentors with profile setup and session management"
    },
    {
      icon: MessageSquare,
      title: "Technical Issues",
      description: "Platform bugs, payment issues, and technical support"
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Get in Touch</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Have questions, need support, or want to share feedback? We're here to help 
              and would love to hear from you.
            </p>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">How Can We Help?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the method that works best for you. Our support team is standing by 
                to provide assistance.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {contactInfo.map((info, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <info.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">{info.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{info.description}</p>
                    <p className="font-medium mb-2">{info.contact}</p>
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {info.availability}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form and FAQ */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select onValueChange={(value) => handleSelectChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="billing">Billing & Payments</SelectItem>
                          <SelectItem value="mentor">Mentor Support</SelectItem>
                          <SelectItem value="mentee">Mentee Support</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Please provide as much detail as possible..."
                        value={formData.message}
                        onChange={handleInputChange}
                        className="min-h-[120px]"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" size="lg">
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* FAQ and Quick Help */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Help Categories</CardTitle>
                    <CardDescription>
                      Browse common questions and find answers instantly.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {faqCategories.map((category, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                        <category.icon className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <h4 className="font-medium mb-1">{category.title}</h4>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Need Immediate Help?</CardTitle>
                    <CardDescription>
                      Check out our most common solutions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        How to book a session
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Payment and billing issues
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Setting up your mentor profile
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        Technical troubleshooting
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Response Times</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Email Support:</span>
                        <span className="font-medium">Within 4 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Live Chat:</span>
                        <span className="font-medium">Immediate</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phone Support:</span>
                        <span className="font-medium">Immediate</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Complex Issues:</span>
                        <span className="font-medium">Within 24 hours</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Office Info */}
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Visit Our Office</h2>
                <p className="text-muted-foreground mb-8">
                  Located in the heart of San Francisco's innovation district, our office 
                  is open for scheduled visits and meetings. We'd love to show you around 
                  and discuss how MentiEdify can help you achieve your goals.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">Address</h4>
                      <p className="text-sm text-muted-foreground">
                        123 Innovation Drive<br />
                        San Francisco, CA 94105
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h4 className="font-medium">Office Hours</h4>
                      <p className="text-sm text-muted-foreground">
                        Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                        Saturday - Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div>
                <Button className="mt-6">Schedule a Visit</Button>
              </div>
              <div className="relative">
                <img
                  src="/placeholder.svg"
                  alt="Office location"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;