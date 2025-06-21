import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Sessions } from '../helpers/session.helper';
import { Functions } from '../helpers/functions.helper';

export const noauthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const sessions = inject(Sessions);
  const func = inject(Functions);

  let statusLogged = sessions.get('statusLogged');
  if (
    statusLogged == 'false' ||
    statusLogged === undefined ||
    statusLogged === null
  ) {
    return true;
  }
  func.goRoute("admin")
  return false;
};
