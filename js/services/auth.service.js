import { assert } from '../utils/helpers.js';

const publicUser = ({ password, ...user }) => user;

export class AuthService {
  constructor(storage) { this.storage = storage; }

  login(email, password) {
    const user = this.storage.get('users', []).find(item => item.email.toLowerCase() === String(email).trim().toLowerCase() && item.password === password);
    assert(user, 'Correo o contraseña incorrectos.');
    this.storage.set('session', { userId: user.id, createdAt: new Date().toISOString() });
    return publicUser(user);
  }

  getSession() {
    const session = this.storage.get('session');
    const user = session && this.storage.get('users', []).find(item => item.id === session.userId);
    return user ? publicUser(user) : null;
  }

  requireUser(role) {
    const user = this.getSession();
    assert(user, 'Inicia sesión para continuar.');
    assert(!role || user.role === role, 'No tienes permisos para realizar esta operación.');
    return user;
  }

  getUsers() { return this.storage.get('users', []).map(publicUser); }
  logout() { this.storage.remove('session'); }
}
