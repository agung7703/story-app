import LoginPage from '../pages/auth/login/login-page';
import RegisterPage from '../pages/auth/register/register-page';
import HomePage from '../pages/home/home-page';
import StorieDetailPage from '../pages/storie-detail/storie-detail-page';
import NewStoryPage from '../pages/new-story/new-story-page';
import { checkAuthenticatedRoute, checkUnauthenticatedRouteOnly } from '../utils/auth';
export const routes = {
  '/login': () => checkUnauthenticatedRouteOnly(new LoginPage()),
  '/register': () => checkUnauthenticatedRouteOnly(new RegisterPage()),

  '/': () => checkAuthenticatedRoute(new HomePage()),
  '/storie/:id': () => checkAuthenticatedRoute(new StorieDetailPage()),
  '/new_story': () => checkAuthenticatedRoute(new NewStoryPage()),
};
