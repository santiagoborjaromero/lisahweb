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
            
            /** Eclusivos Owner */
            {path:"menu", loadComponent: () => import('./private/menu/menu').then((c)=> c.Menu)},
            {path:"roles", loadComponent: () => import('./private/roles/roles').then((c)=> c.Roles)},
            {path:"variables", loadComponent: () => import('./private/variables/variables').then((c)=> c.Variables)},
            {path:"clientes", loadComponent: () => import('./private/clientes/clientes').then((c)=> c.Clientes)},
            {path:"generalidades", loadComponent: () => import('./private/generalidades/generalidades').then((c)=> c.Generalidades)},

            /** Para clientes */
            {path:"config", loadComponent: () => import('./private/config/config').then((c)=> c.Config)},
            {path:"usuarios", loadComponent: () => import('./private/usuarios/usuarios').then((c)=> c.Usuarios)},
            {path:"grupousuarios", loadComponent: () => import('./private/grupousuarios/grupousuarios').then((c)=> c.Grupousuarios)},
            {path:"servidores", loadComponent: () => import('./private/servidores/servidores').then((c)=> c.Servidores)},
            {path:"templates", loadComponent: () => import('./private/templates/templates').then((c)=> c.Templates)},
            {path:"scripts", loadComponent: () => import('./private/scripts/scripts').then((c)=> c.Scripts)},
            {path:"procesos", loadComponent: () => import('./private/procesos/procesos').then((c)=> c.Procesos)},
            {path:"logs", loadComponent: () => import('./private/logs/logs').then((c)=> c.Logs)},
            {path:"audit", loadComponent: () => import('./private/audit/audit').then((c)=> c.Audit)},
            {path:"", redirectTo: "dashboard", pathMatch: "full"},
            {path:"**", redirectTo: "dashboard"},
        ]
    },
    { path: '**', redirectTo: 'login', pathMatch:"full" }
];
