import { getActiveRoute } from '../routes/url-parser';
import {
  generateAuthenticatedNavigationListTemplate,
  generateMainNavigationListTemplate,
  generateUnauthenticatedNavigationListTemplate,
  generateSubscribeButtonTemplate,
  generateUnsubscribeButtonTemplate,
} from '../templates';
import { isServiceWorkerAvailable, setupSkipToContent, transitionHelper } from '../utils';
import { getAccessToken, getLogout } from '../utils/auth';
import { routes } from '../routes/routes';
import Swal from 'sweetalert2';
import {
  isCurrentPushSubscriptionAvailable,
  subscribe,
  unsubscribe,
} from '../utils/notification-helper';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #skipLinkButton;

  constructor({ content, drawerNavigation, drawerButton, skipLinkButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#drawerNavigation = drawerNavigation;
    this.#skipLinkButton = skipLinkButton;

    this.#init();
    this.#setupNetworkListeners();
  }

  #init() {
    setupSkipToContent(this.#skipLinkButton, this.#content);
    this.#setupDrawer();
  }

  #setupNetworkListeners() {
    window.addEventListener('offline', () => {
      Swal.fire({
        icon: 'warning',
        title: 'Anda sedang offline',
        text: 'Mohon periksa jaringan anda',
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false,
      });
    });

    window.addEventListener('online', () => {
      location.reload();
    });
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#drawerNavigation.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      const isTargetInsideDrawer = this.#drawerNavigation.contains(event.target);
      const isTargetInsideButton = this.#drawerButton.contains(event.target);

      if (!(isTargetInsideDrawer || isTargetInsideButton)) {
        this.#drawerNavigation.classList.remove('open');
      }

      this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#drawerNavigation.classList.remove('open');
        }
      });
    });
  }

  #setupNavigationList() {
    const isLogin = !!getAccessToken();
    const navListMain = this.#drawerNavigation.children.namedItem('navlist-main');
    const navList = this.#drawerNavigation.children.namedItem('navlist');

    // User not log in
    if (!isLogin) {
      navListMain.innerHTML = '';
      navList.innerHTML = generateUnauthenticatedNavigationListTemplate();
      console.log(
        'After setting unauthenticated navList, push-notification-tools element:',
        document.getElementById('push-notification-tools'),
      );
      return;
    }

    navListMain.innerHTML = generateMainNavigationListTemplate();
    navList.innerHTML = generateAuthenticatedNavigationListTemplate();
    console.log(
      'After setting authenticated navList, push-notification-tools element:',
      document.getElementById('push-notification-tools'),
    );

    const logoutButton = document.getElementById('logout-button');
    logoutButton.addEventListener('click', (event) => {
      event.preventDefault();

      Swal.fire({
        title: 'Apakah Anda yakin ingin keluar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Ya, keluar',
        cancelButtonText: 'Batal',
      }).then((result) => {
        if (result.isConfirmed) {
          getLogout();

          // Redirect
          location.hash = '/login';
        }
      });
    });
  }

  async #setupPushNotification() {
    const pushNotificationTools = document.getElementById('push-notification-tools');
    const isSubscribed = await isCurrentPushSubscriptionAvailable();

    pushNotificationTools.innerHTML = generateSubscribeButtonTemplate();
    document.getElementById('subscribe-button').addEventListener('click', () => {
      subscribe().finally(() => {
        this.#setupPushNotification();
      });
    });

    if (isSubscribed) {
      pushNotificationTools.innerHTML = generateUnsubscribeButtonTemplate();
      document.getElementById('unsubscribe-button').addEventListener('click', () => {
        unsubscribe().finally(() => {
          this.#setupPushNotification();
        });
      });

      return;
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const route = routes[url];

    // Get page instance
    const page = route();

    // Timeout wrapper for updateDOM to avoid transition timeout
    const updateDOMWithTimeout = async () => {
      const timeout = 10000;
      console.time('updateDOMWithTimeout');
      try {
        await Promise.race([
          (async () => {
            this.#content.innerHTML = await page.render();
            await page.afterRender();
          })(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('updateDOM timeout')), timeout),
          ),
        ]);
      } finally {
        console.timeEnd('updateDOMWithTimeout');
      }
    };

    let transition;
    try {
      transition = transitionHelper({
        updateDOM: updateDOMWithTimeout,
      });
    } catch (error) {
      console.error('Transition helper error:', error);
      // Fallback to direct update without transition
      await updateDOMWithTimeout();
      transition = {
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
      };
    }

    transition.ready.catch((error) => {
      console.error('Transition ready error:', error);
    });

    transition.updateCallbackDone.then(() => {
      scrollTo({ top: 0, behavior: 'instant' });
      this.#setupNavigationList();

      const pushNotificationTools = document.getElementById('push-notification-tools');
      console.log('In renderPage - pushNotificationTools element:', pushNotificationTools);

      if (isServiceWorkerAvailable()) {
        console.log('Calling #setupPushNotification');
        this.#setupPushNotification();
      }
    });
  }
}
