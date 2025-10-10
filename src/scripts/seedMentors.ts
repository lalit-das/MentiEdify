import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Use service role key for admin operations
);

const mentorSeedData = [
  // Technology Mentors
  {
    name: 'Sarah Chen',
    title: 'Senior Software Engineer at Google',
    category: 'technology',
    expertise: ['React', 'Node.js', 'System Design', 'Cloud Architecture'],
    bio: '10+ years building scalable web applications. Former tech lead at Microsoft and Amazon.',
    hourly_rate: 150,
    rating: 4.9,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    total_sessions: 250,
    is_available: true
  },
  {
    name: 'Michael Rodriguez',
    title: 'AI/ML Engineer at OpenAI',
    category: 'technology',
    expertise: ['Machine Learning', 'Python', 'TensorFlow', 'Deep Learning'],
    bio: 'PhD in Computer Science. Specialized in NLP and computer vision projects.',
    hourly_rate: 200,
    rating: 4.8,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    total_sessions: 180,
    is_available: true
  },
  {
    name: 'David Kim',
    title: 'DevOps Lead at Netflix',
    category: 'technology',
    expertise: ['Kubernetes', 'Docker', 'AWS', 'CI/CD', 'Terraform'],
    bio: 'Expert in cloud infrastructure and automated deployment pipelines.',
    hourly_rate: 175,
    rating: 4.9,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    total_sessions: 200,
    is_available: true
  },

  // Business Mentors
  {
    name: 'Emily Thompson',
    title: 'Startup Founder & Business Strategist',
    category: 'business',
    expertise: ['Entrepreneurship', 'Business Strategy', 'Fundraising', 'Scaling'],
    bio: 'Built and sold 2 startups. Helping founders navigate early-stage challenges.',
    hourly_rate: 180,
    rating: 4.9,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    total_sessions: 300,
    is_available: true
  },
  {
    name: 'James Wilson',
    title: 'VP of Marketing at Shopify',
    category: 'business',
    expertise: ['Growth Marketing', 'Product Marketing', 'Brand Strategy', 'Analytics'],
    bio: 'Led marketing teams at unicorn startups. Expert in scaling from 0 to millions.',
    hourly_rate: 160,
    rating: 4.8,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    total_sessions: 220,
    is_available: true
  },
  {
    name: 'Lisa Anderson',
    title: 'Finance Director at Goldman Sachs',
    category: 'business',
    expertise: ['Finance', 'Investment', 'Financial Planning', 'Risk Management'],
    bio: '15 years in corporate finance and investment banking.',
    hourly_rate: 190,
    rating: 4.9,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    total_sessions: 150,
    is_available: true
  },

  // Design Mentors
  {
    name: 'Alex Martinez',
    title: 'Lead Product Designer at Airbnb',
    category: 'design',
    expertise: ['UI/UX Design', 'Product Design', 'User Research', 'Figma'],
    bio: 'Designed products used by millions. Passionate about user-centered design.',
    hourly_rate: 140,
    rating: 4.9,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    total_sessions: 270,
    is_available: true
  },
  {
    name: 'Nina Patel',
    title: 'Brand Designer at Apple',
    category: 'design',
    expertise: ['Branding', 'Visual Identity', 'Graphic Design', 'Adobe Suite'],
    bio: 'Creating memorable brands for Fortune 500 companies and startups.',
    hourly_rate: 150,
    rating: 4.8,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nina',
    total_sessions: 190,
    is_available: true
  },

  // Marketing Mentors
  {
    name: 'Ryan Cooper',
    title: 'Digital Marketing Director at HubSpot',
    category: 'marketing',
    expertise: ['SEO', 'Content Marketing', 'Social Media', 'Analytics'],
    bio: 'Grew multiple brands to 7-figure revenue through digital marketing.',
    hourly_rate: 130,
    rating: 4.8,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ryan',
    total_sessions: 240,
    is_available: true
  },
  {
    name: 'Maria Garcia',
    title: 'Content Strategist at Buffer',
    category: 'marketing',
    expertise: ['Content Strategy', 'Copywriting', 'Brand Voice', 'Social Media'],
    bio: 'Built content strategies for top tech companies and influencers.',
    hourly_rate: 120,
    rating: 4.9,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    total_sessions: 210,
    is_available: true
  },

  // Health & Wellness Mentors
  {
    name: 'Dr. Jennifer Lee',
    title: 'Certified Life Coach & Wellness Expert',
    category: 'health',
    expertise: ['Life Coaching', 'Mental Health', 'Mindfulness', 'Personal Growth'],
    bio: 'PhD in Psychology. Helping people achieve work-life balance and mental clarity.',
    hourly_rate: 110,
    rating: 4.9,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer',
    total_sessions: 320,
    is_available: true
  },
  {
    name: 'Mark Stevens',
    title: 'Certified Personal Trainer & Nutritionist',
    category: 'health',
    expertise: ['Fitness', 'Nutrition', 'Weight Loss', 'Athletic Performance'],
    bio: 'Transformed 500+ clients. Specialized in sustainable lifestyle changes.',
    hourly_rate: 90,
    rating: 4.8,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mark',
    total_sessions: 280,
    is_available: true
  },

  // Education Mentors
  {
    name: 'Dr. Robert Brown',
    title: 'Career Counselor & Education Consultant',
    category: 'education',
    expertise: ['Career Counseling', 'Resume Building', 'Interview Prep', 'Job Search'],
    bio: 'Former university professor. Helped 1000+ students land dream jobs.',
    hourly_rate: 100,
    rating: 4.9,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    total_sessions: 350,
    is_available: true
  },
  {
    name: 'Amanda Foster',
    title: 'Academic Advisor & Test Prep Specialist',
    category: 'education',
    expertise: ['College Admissions', 'SAT/GRE Prep', 'Study Skills', 'Academic Planning'],
    bio: 'Ivy League graduate. Expert in standardized test preparation and college strategy.',
    hourly_rate: 95,
    rating: 4.8,
    profile_image_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda',
    total_sessions: 260,
    is_available: true
  }
];

async function seedMentors() {
  console.log('🌱 Starting mentor seeding...');

  for (const mentor of mentorSeedData) {
    const { data, error } = await supabase
      .from('mentors')
      .insert(mentor)
      .select();

    if (error) {
      console.error(`❌ Error adding ${mentor.name}:`, error);
    } else {
      console.log(`✅ Added ${mentor.name} (${mentor.category})`);
    }
  }

  console.log('✨ Mentor seeding completed!');
}

seedMentors();
