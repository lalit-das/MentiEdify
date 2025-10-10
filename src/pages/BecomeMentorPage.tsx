import { useState, useEffect } from "react";
import { Check, ArrowRight, Star, Users, DollarSign, Clock, User, Mail, Briefcase, GraduationCap, Globe, Award, ChevronRight, AlertCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FormData {
  name: string;
  title: string;
  bio: string;
  expertise: string[];
  hourlyRate: string;
  yearsExperience: string;
  languages: string[];
  videoIntroUrl: string;
}

const expertiseOptions = [
  "Software Development", "Web Development", "Mobile Development",
  "Data Science", "Machine Learning", "AI",
  "Cloud Computing", "DevOps", "Cybersecurity",
  "Product Management", "UI/UX Design", "Business Strategy",
  "Marketing", "Sales", "Leadership", "Finance", "HR"
];

const languageOptions = [
  "English", "Spanish", "French", "German", "Chinese",
  "Japanese", "Korean", "Portuguese", "Italian", "Russian"
];

const BecomeMentorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    title: "",
    bio: "",
    expertise: [],
    hourlyRate: "",
    yearsExperience: "",
    languages: ["English"],
    videoIntroUrl: ""
  });

  const benefits = [
    {
      title: "Flexible Schedule",
      description: "Set your own availability and work when it suits you",
      icon: Clock
    },
    {
      title: "Competitive Earnings",
      description: "Earn $50-300+ per hour based on your expertise",
      icon: DollarSign
    },
    {
      title: "Global Reach",
      description: "Connect with mentees from around the world",
      icon: Users
    },
    {
      title: "Build Your Brand",
      description: "Establish yourself as a thought leader in your field",
      icon: Star
    }
  ];

  const requirements = [
    "5+ years of professional experience in your field",
    "Strong communication and interpersonal skills",
    "Passion for helping others grow and succeed",
    "Reliable internet connection for video calls",
    "Commitment to maintaining professional standards"
  ];

  const process = [
    { step: "1", title: "Apply", description: "Submit your application with your background" },
    { step: "2", title: "Review", description: "Our team reviews within 48 hours" },
    { step: "3", title: "Interview", description: "Complete a brief video interview" },
    { step: "4", title: "Onboard", description: "Start accepting mentees" }
  ];

  const steps = [
    { number: 1, title: "Basic Info", icon: User },
    { number: 2, title: "Expertise", icon: Award },
    { number: 3, title: "Profile", icon: Globe }
  ];

  // Auto-populate name from user profile
  useEffect(() => {
    const loadUserData = async () => {
      if (user && showApplicationForm) {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();

          if (!error && userData) {
            const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
            if (fullName) {
              setFormData(prev => ({ ...prev, name: fullName }));
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };

    loadUserData();
  }, [user, showApplicationForm]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleExpertise = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.includes(skill)
        ? prev.expertise.filter(s => s !== skill)
        : [...prev.expertise, skill]
    }));
  };

  const toggleLanguage = (lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const handleSubmit = async () => {
    // Check if user is logged in
    if (!user) {
      toast.error("Please log in to submit your application");
      navigate("/auth");
      return;
    }

    // Validation
    if (!formData.name || !formData.title || !formData.bio) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.expertise.length < 3) {
      toast.error("Please select at least 3 areas of expertise");
      return;
    }

    if (formData.languages.length < 1) {
      toast.error("Please select at least 1 language");
      return;
    }

    if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
      toast.error("Please enter a valid hourly rate");
      return;
    }

    if (!formData.yearsExperience || parseInt(formData.yearsExperience) < 0) {
      toast.error("Please enter valid years of experience");
      return;
    }

    setLoading(true);
    
    try {
      // ⭐ CRITICAL: Verify user exists and get their current name
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (userCheckError || !existingUser) {
        // User doesn't exist in users table, create it first
        const nameParts = formData.name.split(' ');
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            user_type: 'mentor'
          });

        if (createUserError) {
          console.error('Error creating user:', createUserError);
          throw new Error('Failed to create user profile');
        }
      }

      // Use the name from users table, not form input
      const fullName = existingUser 
        ? `${existingUser.first_name} ${existingUser.last_name}`.trim()
        : formData.name.trim();

      // Check if user already has a mentor profile
      const { data: existingMentor, error: checkError } = await supabase
        .from('mentors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingMentor) {
        toast.error("You already have a mentor profile");
        setLoading(false);
        return;
      }

      // ⭐ Insert new mentor profile with synced name from users table
      const { data, error } = await supabase
        .from('mentors')
        .insert({
          user_id: user.id,
          name: fullName,  // Use name from users table to keep them in sync
          title: formData.title.trim(),
          bio: formData.bio.trim(),
          expertise: formData.expertise,
          hourly_rate: parseFloat(formData.hourlyRate),
          years_experience: parseInt(formData.yearsExperience),
          languages: formData.languages,
          video_intro_url: formData.videoIntroUrl.trim() || null,
          availability_status: 'available',
          is_verified: false,
          rating: 0,
          total_reviews: 0,
          session_types: ['video', 'audio', 'chat'],
          response_time_hours: 24,
          cancellation_policy: 'flexible'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating mentor profile:', error);
        throw error;
      }

      console.log('Mentor profile created successfully:', data);

      setShowSuccess(true);
      toast.success("Application submitted successfully!");
      
      // Reset form and redirect after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setShowApplicationForm(false);
        setCurrentStep(1);
        setFormData({
          name: "",
          title: "",
          bio: "",
          expertise: [],
          hourlyRate: "",
          yearsExperience: "",
          languages: ["English"],
          videoIntroUrl: ""
        });
        
        // Redirect to mentor dashboard
        navigate('/mentor-dashboard');
      }, 3000);
      
    } catch (error: any) {
      console.error('Error creating mentor profile:', error);
      toast.error(error.message || "Failed to submit application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToApplication = () => {
    if (!user) {
      toast.error("Please log in to apply as a mentor");
      navigate("/auth");
      return;
    }
    setShowApplicationForm(true);
    setTimeout(() => {
      document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  if (showApplicationForm) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
          <div className="container mx-auto max-w-4xl">
            <Button
              variant="ghost"
              onClick={() => setShowApplicationForm(false)}
              className="mb-4"
            >
              ← Back to Overview
            </Button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Become a Mentor</span>
              </div>
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Share Your Expertise, Shape the Future
              </h1>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.number;
                  const isCompleted = currentStep > step.number;
                  
                  return (
                    <div key={step.number} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            isCompleted ? "bg-green-600 text-white" : isActive ? "bg-blue-600 text-white shadow-lg" : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                        </div>
                        <span className={`text-xs mt-2 font-medium ${isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-slate-400"}`}>
                          {step.title}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${currentStep > step.number ? "bg-green-600" : "bg-slate-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {showSuccess && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Application submitted successfully! Redirecting to your mentor dashboard...
                </AlertDescription>
              </Alert>
            )}

            <Card className="shadow-xl border-0" id="application-form">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Step {currentStep} of 3</CardTitle>
                <CardDescription className="text-blue-100">
                  {currentStep === 1 && "Tell us about yourself"}
                  {currentStep === 2 && "Share your areas of expertise"}
                  {currentStep === 3 && "Complete your profile"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <ScrollArea className="h-[500px] pr-4">
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="John Doe"
                          required
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Name is synced from your profile. To change it, update your profile first.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="title" className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                          Professional Title *
                        </Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          placeholder="Senior Software Engineer"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="experience" className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          Years of Experience *
                        </Label>
                        <Input
                          id="experience"
                          type="number"
                          value={formData.yearsExperience}
                          onChange={(e) => handleInputChange("yearsExperience", e.target.value)}
                          placeholder="5"
                          min="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate" className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-blue-600" />
                          Hourly Rate (USD) *
                        </Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          value={formData.hourlyRate}
                          onChange={(e) => handleInputChange("hourlyRate", e.target.value)}
                          placeholder="150"
                          min="0"
                          step="0.01"
                          required
                        />
                        <p className="text-xs text-slate-500">Average: $150/hour</p>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                          Areas of Expertise * (Select at least 3)
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {expertiseOptions.map((skill) => (
                            <Badge
                              key={skill}
                              variant={formData.expertise.includes(skill) ? "default" : "outline"}
                              className={`cursor-pointer px-4 py-2 transition-all ${
                                formData.expertise.includes(skill) ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-slate-100"
                              }`}
                              onClick={() => toggleExpertise(skill)}
                            >
                              {formData.expertise.includes(skill) && <Check className="w-3 h-3 mr-1" />}
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-slate-500">
                          Selected: {formData.expertise.length} area{formData.expertise.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-600" />
                          Languages * (Select at least 1)
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {languageOptions.map((lang) => (
                            <Badge
                              key={lang}
                              variant={formData.languages.includes(lang) ? "default" : "outline"}
                              className={`cursor-pointer px-4 py-2 transition-all ${
                                formData.languages.includes(lang) ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-slate-100"
                              }`}
                              onClick={() => toggleLanguage(lang)}
                            >
                              {formData.languages.includes(lang) && <Check className="w-3 h-3 mr-1" />}
                              {lang}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-slate-500">
                          Selected: {formData.languages.length} language{formData.languages.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="bio">Professional Bio *</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => handleInputChange("bio", e.target.value)}
                          placeholder="Tell us about yourself, your experience, and what you're passionate about mentoring..."
                          className="min-h-[200px]"
                          required
                        />
                        <p className="text-xs text-slate-500">{formData.bio.length} characters</p>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label htmlFor="videoIntro" className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-600" />
                          Video Introduction URL (Optional)
                        </Label>
                        <Input
                          id="videoIntro"
                          value={formData.videoIntroUrl}
                          onChange={(e) => handleInputChange("videoIntroUrl", e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                        />
                        <p className="text-xs text-slate-500">
                          Add a YouTube or Vimeo link to introduce yourself (recommended)
                        </p>
                      </div>

                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          By submitting, you agree to our terms and conditions. Your profile will be reviewed within 2-3 business days.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </ScrollArea>

                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1 || loading}
                    className="gap-2"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Previous
                  </Button>

                  <div className="text-sm text-slate-500">
                    Step {currentStep} of 3
                  </div>

                  {currentStep < 3 ? (
                    <Button
                      onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {loading ? "Submitting..." : "Submit Application"}
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-700">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
            Share Your Expertise,
            <br />
            Shape the Future
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Join thousands of professionals making a difference by mentoring the next generation
          </p>
          <Button 
            size="lg" 
            className="mb-8 bg-white text-blue-600 hover:bg-blue-50"
            onClick={scrollToApplication}
          >
            Start Your Application
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <div className="flex flex-wrap justify-center gap-12 text-center text-white">
            <div>
              <div className="text-3xl font-bold">$150</div>
              <div className="text-sm text-blue-200">Average hourly rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold">2,500+</div>
              <div className="text-sm text-blue-200">Active mentors</div>
            </div>
            <div>
              <div className="text-3xl font-bold">4.9/5</div>
              <div className="text-sm text-blue-200">Mentor satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Why Mentor with MentiEdify?</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <benefit.icon className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-slate-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {process.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="font-semibold mb-2 text-lg">{step.title}</h3>
                <p className="text-sm text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Requirements</h2>
          </div>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="space-y-4">
                {requirements.map((requirement, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{requirement}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-20 px-4 bg-blue-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Make an Impact?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join our community of expert mentors today
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={scrollToApplication}
          >
            Start Your Application
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default BecomeMentorPage;
