import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/auth.models';
import { PagedResult } from './customer.service';

export interface KnowledgeCategory {
  id: string;
  name: string;
  displayOrder: number;
}

export interface KnowledgeArticle {
  id: string;
  businessId: string;
  categoryId?: string;
  categoryName?: string;
  type?: string;
  question: string;
  answer: string;
  keywords?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CsvPreviewItem {
  rowIndex: number;
  question: string;
  answer: string;
  categoryName: string;
  keywords: string;
  valid: boolean;
  duplicate: boolean;
  validationError?: string;
}

export interface CsvPreviewResponse {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  items: CsvPreviewItem[];
}

@Injectable({
  providedIn: 'root'
})
export class KnowledgeBaseService {
  private readonly baseUrl = `${environment.apiUrl}/knowledge-base`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<ApiResponse<KnowledgeCategory[]>> {
    return this.http.get<ApiResponse<KnowledgeCategory[]>>(`${this.baseUrl}/categories`);
  }

  createCategory(name: string, displayOrder: number = 0): Observable<ApiResponse<KnowledgeCategory>> {
    return this.http.post<ApiResponse<KnowledgeCategory>>(`${this.baseUrl}/categories`, { name, displayOrder });
  }

  deleteCategory(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/categories/${id}`);
  }

  getArticles(categoryId?: string, query?: string, page: number = 0, size: number = 20): Observable<ApiResponse<PagedResult<KnowledgeArticle>>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (categoryId) params = params.set('categoryId', categoryId);
    if (query && query.trim()) params = params.set('query', query.trim());
    return this.http.get<ApiResponse<PagedResult<KnowledgeArticle>>>(`${this.baseUrl}/articles`, { params });
  }

  createArticle(article: Partial<KnowledgeArticle>): Observable<ApiResponse<KnowledgeArticle>> {
    return this.http.post<ApiResponse<KnowledgeArticle>>(`${this.baseUrl}/articles`, article);
  }

  updateArticle(id: string, article: Partial<KnowledgeArticle>): Observable<ApiResponse<KnowledgeArticle>> {
    return this.http.put<ApiResponse<KnowledgeArticle>>(`${this.baseUrl}/articles/${id}`, article);
  }

  toggleActive(id: string): Observable<ApiResponse<KnowledgeArticle>> {
    return this.http.patch<ApiResponse<KnowledgeArticle>>(`${this.baseUrl}/articles/${id}/toggle`, {});
  }

  deleteArticle(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/articles/${id}`);
  }

  previewCsv(file: File): Observable<ApiResponse<CsvPreviewResponse>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<CsvPreviewResponse>>(`${this.baseUrl}/preview-csv`, formData);
  }

  importCsv(file: File): Observable<ApiResponse<{ importedCount: number }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ importedCount: number }>>(`${this.baseUrl}/import-csv`, formData);
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export-csv`, { responseType: 'blob' });
  }
}
