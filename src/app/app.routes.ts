import { Routes } from '@angular/router';
import { noauthGuard } from './core/guards/noauth-guard';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
    { path: "login", 
        loadComponent: () => import('./public/login/login').then( (c)=> c.Login),
        canActivate: [noauthGuard]
    },
    { path: "secondfactor", 
        loadComponent: () => import('./public/secondfactor/secondfactor').then( (c)=> c.Secondfactor),
        canActivate: [noauthGuard]
    },
    {
        path: 'admin',
        loadComponent: () => import('./private/skeleton/skeleton').then( (c)=> c.Skeleton),
        canActivate: [authGuard],
        children:[
            {path:"dashboard", loadComponent: () => import('./private/dashboard/dashboard').then((c)=> c.Dashboard)},
            {path:"usuarios", loadComponent: () => import('./private/usuarios/usuarios').then((c)=> c.Usuarios)},
            {path:"config", loadComponent: () => import('./private/config/config').then((c)=> c.Config)},
            {path:"menu", loadComponent: () => import('./private/menu/menu').then((c)=> c.Menu)},
            {path:"roles", loadComponent: () => import('./private/roles/roles').then((c)=> c.Roles)},
            {path:"audit", loadComponent: () => import('./private/audit/audit').then((c)=> c.Audit)},
            {path:"grupo", loadComponent: () => import('./private/grupousuarios/grupousuarios').then((c)=> c.Grupousuarios)},
            {path:"", redirectTo: "dashboard", pathMatch: "full"},
            {path:"**", redirectTo: "dashboard"},
        ]
    },
    { path: '**', redirectTo: 'login', pathMatch:"full" }
];
