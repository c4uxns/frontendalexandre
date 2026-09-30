import { Routes } from '@angular/router';
import { Admin } from './components/admin/admin';
import { Home } from './components/home/home';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'admin', component: Admin },
    { path: 'home', component: Home },
    { path: '**', redirectTo: 'home' },
];