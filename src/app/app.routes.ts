import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'home', component: Home },
    { path: '**', redirectTo: 'home' },
];