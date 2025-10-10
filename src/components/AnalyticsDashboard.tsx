// src/components/AnalyticsDashboard.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, DollarSign, Star, Users, TrendingUp, Clock } from 'lucide-react';

interface AnalyticsData {
  totalSessions: number;
  monthlyEarnings: number;
  activeMentees: number;
  averageRating: number;
  sessionTrends: { date: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  recentReviews: { rating: number; text: string; date: string }[];
}

const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Get mentor profile
      const { data: mentorData } = await supabase
        .from('mentors')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!mentorData) return;

      // Calculate date range
      const startDate = new Date();
      if (dateRange === '7days') startDate.setDate(startDate.getDate() - 7);
      else if (dateRange === '30days') startDate.setDate(startDate.getDate() - 30);
      else if (dateRange === '90days') startDate.setDate(startDate.getDate() - 90);
      else startDate.setFullYear(startDate.getFullYear() - 1);

      // Fetch total sessions
      const { data: bookings, count: totalSessions } = await supabase
        .from('bookings')
        .select('*', { count: 'exact' })
        .eq('mentor_id', mentorData.id)
        .eq('status', 'completed')
        .gte('session_date', startDate.toISOString().split('T')[0]);

      // Calculate monthly earnings
      const monthlyEarnings = (bookings || []).reduce((sum, b) => sum + (b.price || 0), 0);

      // Get unique mentees
      const uniqueMentees = new Set((bookings || []).map(b => b.mentee_id)).size;

      // Get average rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('mentor_id', mentorData.id);

      const averageRating = reviews && reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      // Session trends (last 7 days)
      const sessionTrends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const { count } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('mentor_id', mentorData.id)
          .eq('session_date', dateStr)
          .eq('status', 'completed');

        sessionTrends.push({
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          count: count || 0
        });
      }

      // Category breakdown
      const categoryMap = new Map();
      (bookings || []).forEach(booking => {
        const category = booking.topic || 'General';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });

      const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, count]) => ({
        category,
        count
      }));

      // Recent reviews
      const { data: recentReviewsData } = await supabase
        .from('reviews')
        .select('rating, review_text, created_at')
        .eq('mentor_id', mentorData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const recentReviews = (recentReviewsData || []).map(r => ({
        rating: r.rating,
        text: r.review_text || '',
        date: new Date(r.created_at).toLocaleDateString()
      }));

      setAnalytics({
        totalSessions: totalSessions || 0,
        monthlyEarnings,
        activeMentees: uniqueMentees,
        averageRating: Number(averageRating.toFixed(1)),
        sessionTrends,
        categoryBreakdown,
        recentReviews
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No Analytics Data</h3>
        <p className="text-muted-foreground">Complete some sessions to see your analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Performance Analytics</h2>
          <p className="text-muted-foreground mt-1">Track your mentorship impact and earnings</p>
        </div>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalSessions}</div>
            <p className="text-xs text-white/70 mt-1">Completed sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{analytics.monthlyEarnings.toLocaleString()}</div>
            <p className="text-xs text-white/70 mt-1">Total revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Active Mentees</CardTitle>
            <Users className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.activeMentees}</div>
            <p className="text-xs text-white/70 mt-1">Unique mentees</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-white/80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.averageRating}</div>
            <p className="text-xs text-white/70 mt-1">From all reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Session Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {analytics.sessionTrends.map((item, index) => {
                const maxCount = Math.max(...analytics.sessionTrends.map(t => t.count), 1);
                const height = (item.count / maxCount) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-primary rounded-t-lg transition-all hover:opacity-80 relative group"
                         style={{ height: `${Math.max(height, 4)}%` }}>
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
                        {item.count}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Session Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.categoryBreakdown.slice(0, 5).map((item, index) => {
              const total = analytics.categoryBreakdown.reduce((sum, cat) => sum + cat.count, 0);
              const percentage = ((item.count / total) * 100).toFixed(1);
              const colors = ['bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500'];
              
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">{item.category}</span>
                    <span className="text-muted-foreground">{percentage}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${colors[index % colors.length]} transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Recent Reviews
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analytics.recentReviews.length > 0 ? (
            analytics.recentReviews.map((review, index) => (
              <div key={index} className="border-b pb-4 last:border-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                <p className="text-sm text-muted-foreground">{review.text || 'No comment provided'}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">No reviews yet</p>
          )}
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date().toLocaleString('en-IN', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        })}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
