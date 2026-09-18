import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    active: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private http = inject(HttpClient);

    createUser(user: Omit<User, 'id'>): Observable<User> {
        return this.http.post<User>('/api/users', user);
    }

    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`/api/users/${id}`);
    }
}
