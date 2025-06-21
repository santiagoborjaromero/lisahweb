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
            {path:"", redirectTo: "dashboard", pathMatch: "full"},
            {path:"**", redirectTo: "dashboard"},
        ]
    },
    { path: '**', redirectTo: 'login', pathMatch:"full" }
];
