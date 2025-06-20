import { Routes } from '@angular/router';
import { noauthGuard } from './core/guards/noauth-guard';


export const routes: Routes = [
    { path: "login", 
        loadComponent: () => import('./public/login/login').then( (c)=> c.Login),
        canActivate: [noauthGuard]
    },
];
