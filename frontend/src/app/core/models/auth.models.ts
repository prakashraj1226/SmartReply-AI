export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'BUSINESS_AGENT';
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: string;
  email: string;
  fullName: string;
  role: string;
  businessId: string;
  businessName: string;
  onboardingCompleted: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  businessId: string;
  businessName: string;
  onboardingCompleted: boolean;
}

export interface Business {
  id: string;
  name: string;
  slug: string;
  category?: string;
  email?: string;
  phone?: string;
  address?: string;
  timezone: string;
  operatingHoursJson?: string;
  preferredLanguage: string;
  description?: string;
  onboardingCompleted: boolean;
  active: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalConversations: number;
  openConversations: number;
  unansweredEnquiries: number;
  resolvedConversations: number;
  averageResponseTime: string;
  aiHandledConversations: number;
  humanHandledConversations: number;
  upcomingAppointmentsCount: number;
  volumeTrend: { date: string; total: number; aiHandled: number }[];
  resolutionTrend: { date: string; resolved: number }[];
  recentActivity: {
    id: string;
    senderType: string;
    textContent: string;
    createdAt: string;
    conversationId: string;
    customerName: string;
  }[];
}
