import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuditLog {
  id: string;
  createdAt: string;
  userId: string;
  organizationId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: string | null;
  userEmail?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class AuditLogService {
  private readonly BASE_URL = `${environment.apiUrl}/audit-log`;

  constructor(private http: HttpClient) {}

  getOrgAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(this.BASE_URL);
  }
}
