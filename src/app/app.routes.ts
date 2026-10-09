import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Login } from './components/login/login';
import { authGuard } from './core/guards/auth-guard';
import { Produtos } from './components/produtos/produtos';

export const routes: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'home', component: Home },
    { path: 'produtos', component: Produtos, canActivate: [authGuard] },
    { path: '**', redirectTo: 'home' },
];