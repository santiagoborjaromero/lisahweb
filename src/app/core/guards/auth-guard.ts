import { CanActivateFn, Router } from '@angular/router';
import { Sessions } from './../helpers/session.helper';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const sessions = inject(Sessions);

  let statusLogged = sessions.get('statusLogged');
  if (statusLogged == 'true') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
