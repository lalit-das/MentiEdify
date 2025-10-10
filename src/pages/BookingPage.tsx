import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Phone, MessageSquare, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  // ✅ FIXED: Changed from "mentor" to "mentorId" to match MentorCard
  const mentorId = searchParams.get("mentorId");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedPackage, setSelectedPackage] = useState("session");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [sessionType, setSessionType] = useState("video");
  const [notes, setNotes] = useState("");
  const [mentor, setMentor] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    console.log('📝 BookingPage received mentorId:', mentorId); // Debug log
    
    if (!mentorId) {
      toast({
        title: "No mentor selected",
        description: "Please select a mentor from the explore page.",
        variant: "destructive",
      });
      navigate("/explore");
      return;
    }
    fetchMentorData();
  }, [mentorId, navigate]);

  const fetchMentorData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching mentor data for ID:', mentorId);

      const { data: mentorData, error: mentorError } = await supabase
        .from("mentors")
        .select("*")
        .eq("id", mentorId)
        .single();

      if (mentorError) {
        console.error('❌ Mentor fetch error:', mentorError);
        throw mentorError;
      }
      
      if (!mentorData) {
        toast({
          title: "Mentor not found",
          description: "This mentor doesn't exist.",
          variant: "destructive",
        });
        navigate("/explore");
        return;
      }
      
      console.log('✅ Mentor data loaded:', mentorData.name);
      setMentor(mentorData);

      const { data: availabilityData, error: availabilityError } = await supabase
        .from("mentor_availability")
        .select("*")
        .eq("mentor_id", mentorId)
        .eq("is_available", true);

      if (availabilityError) {
        console.warn('⚠️ Availability fetch error:', availabilityError);
      }
      setAvailability(availabilityData || []);
      
      console.log('📅 Available slots:', availabilityData?.length || 0);
    } catch (error) {
      console.error("Error fetching mentor data:", error);
      toast({
        title: "Error",
        description: "Failed to load mentor information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const packages = [
    {
      id: "session",
      name: "Single Session",
      duration: "60 minutes",
      price: Math.round(mentor?.hourly_rate || 150),
      description: "One-time mentoring session",
    },
    {
      id: "monthly",
      name: "Monthly Package",
      duration: "4 sessions (60 min each)",
      price: Math.round((mentor?.hourly_rate || 150) * 4 * 0.9),
      originalPrice: Math.round((mentor?.hourly_rate || 150) * 4),
      description: "Save 10% with monthly commitment",
    },
    {
      id: "package",
      name: "Intensive Package",
      duration: "8 sessions (60 min each)",
      price: Math.round((mentor?.hourly_rate || 150) * 8 * 0.85),
      originalPrice: Math.round((mentor?.hourly_rate || 150) * 8),
      description: "Save 15% with intensive mentoring",
    },
  ];

  const generateAvailableSlots = () => {
    const slots = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();

      const dayAvailability = availability.filter((avail) => avail.day_of_week === dayOfWeek);

      if (dayAvailability.length > 0) {
        const daySlots: string[] = [];
        dayAvailability.forEach((avail) => {
          const startHour = parseInt(avail.start_time.split(":")[0]);
          const endHour = parseInt(avail.end_time.split(":")[0]);

          for (let hour = startHour; hour < endHour; hour++) {
            daySlots.push(`${hour.toString().padStart(2, "0")}:00`);
          }
        });

        if (daySlots.length > 0) {
          slots.push({
            date: date.toISOString().split("T")[0],
            slots: daySlots.sort(),
          });
        }
      }
    }

    return slots;
  };

  const availableSlots = generateAvailableSlots();

  const handleBooking = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book a session.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please select a date and time for your session.",
        variant: "destructive",
      });
      return;
    }

    try {
      setBooking(true);
      console.log('📅 Creating booking...', { mentorId, userId: user.id, date: selectedDate, time: selectedTime });

      // Ensure user exists in users table
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('id', user.id)
        .single();

      if (userCheckError || !existingUser) {
        console.log('Creating user record for booking...');
        
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || 'User',
            last_name: user.user_metadata?.last_name || '',
            user_type: 'mentee'
          });

        if (createUserError) {
          console.error('Error creating user:', createUserError);
          throw new Error('Failed to create user profile. Please try again.');
        }
      }

      const selectedPkg = packages.find((p) => p.id === selectedPackage);

      // Format time properly
      const timeFormatted = selectedTime.includes(':')
        ? (selectedTime.split(':').length === 2 ? `${selectedTime}:00` : selectedTime)
        : `${selectedTime}:00:00`;

      // Create booking
      const { error } = await supabase.from("bookings").insert({
        mentor_id: mentorId,
        mentee_id: user.id,
        session_date: selectedDate,
        session_time: timeFormatted,
        duration: 60,
        session_type: sessionType,
        package_type: selectedPackage,
        price: Math.round(selectedPkg?.price || 0),
        notes: notes || null,
        status: "pending",
        payment_status: "pending",
      });

      if (error) {
        console.error('❌ Booking error:', error);
        throw error;
      }

      console.log('✅ Booking created successfully');
      
      toast({
        title: "Booking confirmed!",
        description: `Your session with ${mentor.name} has been booked successfully.`,
      });

      navigate("/mentee-dashboard", { replace: true });

    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast({
        title: "Booking failed",
        description: error.message || "There was an error creating your booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading mentor details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 text-center min-h-[60vh] flex items-center justify-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Mentor Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The mentor you're looking for doesn't exist.
            </p>
            <Link to="/explore">
              <Button>Browse Mentors</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Link to="/explore" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Mentors
        </Link>

        <h1 className="text-3xl font-bold mb-2">Book a Session</h1>
        <p className="text-muted-foreground mb-6">Schedule your mentoring session with {mentor.name}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mentor Info Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <img
                    src={mentor.profile_image_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=default"}
                    alt={mentor.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{mentor.name}</h3>
                    <p className="text-sm text-muted-foreground">{mentor.title}</p>
                    <p className="text-lg font-bold text-primary mt-2">
                      ₹{mentor.hourly_rate}/hr
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {mentor.expertise?.map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form - REST OF YOUR CODE REMAINS THE SAME */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Choose a Package</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage} className="space-y-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                      <RadioGroupItem value={pkg.id} id={pkg.id} />
                      <Label htmlFor={pkg.id} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{pkg.name}</h4>
                            <p className="text-sm text-muted-foreground">{pkg.duration}</p>
                            <p className="text-sm text-muted-foreground">{pkg.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-lg">₹{pkg.price}</div>
                            {pkg.originalPrice && (
                              <div className="text-sm text-muted-foreground line-through">
                                ₹{pkg.originalPrice}
                              </div>
                            )}
                          </div>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Session Type */}
            <Card>
              <CardHeader>
                <CardTitle>Session Type</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={sessionType} onValueChange={setSessionType} className="grid grid-cols-3 gap-4">
                  <Label 
                    htmlFor="video" 
                    className={`flex items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      sessionType === 'video' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                    }`}
                  >
                    <RadioGroupItem value="video" id="video" />
                    <Video className="h-4 w-4" /> Video
                  </Label>
                  <Label 
                    htmlFor="audio" 
                    className={`flex items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      sessionType === 'audio' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                    }`}
                  >
                    <RadioGroupItem value="audio" id="audio" />
                    <Phone className="h-4 w-4" /> Audio
                  </Label>
                  <Label 
                    htmlFor="chat" 
                    className={`flex items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                      sessionType === 'chat' ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                    }`}
                  >
                    <RadioGroupItem value="chat" id="chat" />
                    <MessageSquare className="h-4 w-4" /> Chat
                  </Label>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Date & Time Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Date & Time</CardTitle>
                <CardDescription>
                  {availableSlots.length > 0 
                    ? "Choose from available slots" 
                    : "Pick your preferred date and time"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableSlots.length === 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <input
                        id="date"
                        type="date"
                        className="border rounded-lg p-2 w-full"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <input
                        id="time"
                        type="time"
                        className="border rounded-lg p-2 w-full"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  availableSlots.map((daySlot) => (
                    <div key={daySlot.date} className="space-y-2">
                      <h4 className="font-medium">
                        {new Date(daySlot.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        {daySlot.slots.map((time: string) => (
                          <Button
                            key={`${daySlot.date}-${time}`}
                            variant={selectedDate === daySlot.date && selectedTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setSelectedDate(daySlot.date);
                              setSelectedTime(time);
                            }}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Session Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Session Notes (Optional)</CardTitle>
                <CardDescription>Share what you'd like to discuss or achieve in this session</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Describe your goals, topics, or questions for this mentoring session..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-medium">{packages.find((p) => p.id === selectedPackage)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session Type</span>
                  <span className="font-medium capitalize">{sessionType}</span>
                </div>
                {selectedDate && selectedTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time</span>
                    <span className="font-medium">
                      {new Date(selectedDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })} at {selectedTime}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{packages.find((p) => p.id === selectedPackage)?.price}</span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleBooking}
                  disabled={!selectedDate || !selectedTime || booking}
                >
                  {booking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Confirm Booking
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By confirming, you agree to our terms and cancellation policy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingPage;
