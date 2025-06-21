import { CanActivateFn, Router } from '@angular/router';
import { Sessions } from './../helpers/session.helper';
import { inject } from '@angular/core';
import { Functions } from '../helpers/functions.helper';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const sessions = inject(Sessions);
  const func = inject(Functions);

  let statusLogged = sessions.get('statusLogged');
  if (statusLogged == 'true') {
    return true;
  }
  func.goRoute("login")
  return false;
};
