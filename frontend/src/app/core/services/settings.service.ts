import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';

export interface BusinessProfile {
  id: string;
  name: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  operatingHoursJson: string;
  preferredLanguage: string;
  description: string;
}

export interface AiConfig {
  id?: string;
  assistantName: string;
  tone: string;
  greetingMessage: string;
  fallbackMessage: string;
  confidenceThreshold: number;
  enabled: boolean;
  maxResponseTokens: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  membershipStatus?: string;
  joinedAt: string;
}

export interface InviteMemberRequest {
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  password?: string;
}

export interface UpdateTeamMemberRequest {
  fullName: string;
  phone?: string;
  role?: string;
  status?: string;
  password?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly baseUrl = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ApiResponse<BusinessProfile>> {
    return this.http.get<ApiResponse<BusinessProfile>>(`${this.baseUrl}/profile`);
  }

  updateProfile(profile: Partial<BusinessProfile>): Observable<ApiResponse<BusinessProfile>> {
    return this.http.put<ApiResponse<BusinessProfile>>(`${this.baseUrl}/profile`, profile);
  }

  getAiConfig(): Observable<ApiResponse<AiConfig>> {
    return this.http.get<ApiResponse<AiConfig>>(`${this.baseUrl}/ai`);
  }

  updateAiConfig(config: Partial<AiConfig>): Observable<ApiResponse<AiConfig>> {
    return this.http.put<ApiResponse<AiConfig>>(`${this.baseUrl}/ai`, config);
  }

  getTeamMembers(): Observable<ApiResponse<TeamMember[]>> {
    return this.http.get<ApiResponse<TeamMember[]>>(`${this.baseUrl}/team`);
  }

  inviteTeamMember(req: InviteMemberRequest): Observable<ApiResponse<TeamMember>> {
    return this.http.post<ApiResponse<TeamMember>>(`${this.baseUrl}/team`, req);
  }

  updateTeamMember(memberId: string, req: UpdateTeamMemberRequest): Observable<ApiResponse<TeamMember>> {
    return this.http.put<ApiResponse<TeamMember>>(`${this.baseUrl}/team/${memberId}`, req);
  }

  removeTeamMember(memberId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/team/${memberId}`);
  }
}

