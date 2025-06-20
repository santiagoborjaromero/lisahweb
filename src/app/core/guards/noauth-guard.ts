import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sessions } from '../helpers/session.helper';

export const noauthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const sessions = inject(Sessions);

  let statusLogged = sessions.get('statusLogged');
  if (
    statusLogged == 'false' ||
    statusLogged === undefined ||
    statusLogged === null
  ) {
    return true;
  }
  router.navigate(['home']);
  return false;
};
