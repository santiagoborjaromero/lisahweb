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
            
            /** Eclusivos Owner */
            {path:"menus", loadComponent: () => import('./private/menu/menu').then((c)=> c.Menu)},
            {path:"menu/:id", loadComponent: () => import('./private/menu/edit/edit').then((c)=> c.Edit)},
            
            {path:"roles", loadComponent: () => import('./private/roles/roles').then((c)=> c.Roles)},
            {path:"variables", loadComponent: () => import('./private/variables/variables').then((c)=> c.Variables)},
            {path:"clientes", loadComponent: () => import('./private/clientes/clientes').then((c)=> c.Clientes)},
            {path:"generalidades", loadComponent: () => import('./private/generalidades/generalidades').then((c)=> c.Generalidades)},
            
            /** Para clientes */
            {path:"monitoreo", loadComponent: () => import('./private/monitoreo/monitoreo').then((c)=> c.Monitoreo)},
            {path:"dashboard", loadComponent: () => import('./private/dashboard/dashboard').then((c)=> c.Dashboard)},
            {path:"dashusuario", loadComponent: () => import('./private/dashusuario/dashusuario').then((c)=> c.Dashusuario)},

            {path:"profile", loadComponent: () => import('./private/profile/profile').then((c)=> c.Profile)},
            {path:"configs", loadComponent: () => import('./private/config/config').then((c)=> c.Config)},
            {path:"usuarios", loadComponent: () => import('./private/usuarios/usuarios').then((c)=> c.Usuarios)},
            {path:"usuario/:id", loadComponent: () => import('./private/usuarios/edit/edit').then((c)=> c.Edit)},
            {path:"grupousuarios", loadComponent: () => import('./private/grupousuarios/grupousuarios').then((c)=> c.Grupousuarios)},
            {path:"grupousuario/:id", loadComponent: () => import('./private/grupousuarios/edit/edit').then((c)=> c.Edit)},
            {path:"servidores", loadComponent: () => import('./private/servidores/servidores').then((c)=> c.Servidores)},
            {path:"servidor/:id", loadComponent: () => import('./private/servidores/edit/edit').then((c)=> c.Edit)},
            {path:"templates", loadComponent: () => import('./private/templates/templates').then((c)=> c.Templates)},
            {path:"template/:id", loadComponent: () => import('./private/templates/edit/edit').then((c)=> c.Edit)},
            {path:"scripts", loadComponent: () => import('./private/scripts/scripts').then((c)=> c.Scripts)},
            {path:"script/:id", loadComponent: () => import('./private/scripts/edit/edit').then((c)=> c.Edit)},
            {path:"procesos", loadComponent: () => import('./private/procesos/procesos').then((c)=> c.Procesos)},
            {path:"audits", loadComponent: () => import('./private/audit/audit').then((c)=> c.Audit)},
            {path:"hardening", loadComponent: () => import('./private/hardening/hardening').then((c)=> c.Hardening)},
            {path:"terminal", loadComponent: () => import('./private/terminal/terminal').then((c)=> c.Terminal)},
            {path:"hardeningssh", loadComponent: () => import('./private/hardeningssh/hardeningssh').then((c)=> c.Hardeningssh)},
            {path:"terminalssh", loadComponent: () => import('./private/terminalssh/terminalssh').then((c)=> c.Terminalssh)},
            {path:"logs", loadComponent: () => import('./private/logs/logs').then((c)=> c.Logs)},
            {path:"logs/:id", loadComponent: () => import('./private/logserver/logserver').then((c)=> c.Logserver)},

            {path:"administracion", loadComponent: () => import('./private/administracion/administracion').then((c)=> c.Administracion)},
            {
                path: 'administracion/workspace',
                loadComponent: () => import('./private/workspace/workspace').then( (c)=> c.Workspace),
                canActivate: [authGuard],
                children:[
                    {path:"dashboard", loadComponent: () => import('./private/workspace/dashboard/dashboard').then((c)=> c.Dashboard)},
                    {path:"servicios", loadComponent: () => import('./private/workspace/servicios/servicios').then((c)=> c.Servicios)},
                    {path:"usuarios", loadComponent: () => import('./private/workspace/usuarios/usuarios').then((c)=> c.Usuarios)},
                    {path:"grupousuarios", loadComponent: () => import('./private/workspace/grupousuarios/grupousuarios').then((c)=> c.Grupousuarios)},
                    {path:"networking", loadComponent: () => import('./private/workspace/networking/networking').then((c)=> c.Networking)},
                    {path:"update", loadComponent: () => import('./private/workspace/updates/updates').then((c)=> c.Updates)},
                    {path:"store", loadComponent: () => import('./private/workspace/store/store').then((c)=> c.Store)},
                    {path:"terminal", loadComponent: () => import('./private/workspace/terminal/terminal').then((c)=> c.Terminals)},
                    {path:"", redirectTo: "dashboard", pathMatch: "full"},
                    {path:"**", redirectTo: "dashboard"},
                ]
            },
            {path:"", redirectTo: "dashboard", pathMatch: "full"},
            {path:"**", redirectTo: "dashboard"},
        ]
    },
    { path: '**', redirectTo: 'login', pathMatch:"full" }
];
