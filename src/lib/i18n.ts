import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import modular translation files
import commonEn from '../../locales/en/common.json';
import authEn from '../../locales/en/auth.json';
import navigationEn from '../../locales/en/navigation.json';
import adminEn from '../../locales/en/admin.json';
import usersEn from '../../locales/en/users.json';
import rolesEn from '../../locales/en/roles.json';
import permissionsEn from '../../locales/en/permissions.json';
import postsEn from '../../locales/en/posts.json';
import messagesEn from '../../locales/en/messages.json';
import sidebarEn from '../../locales/en/sidebar.json';
import clientsEn from '../../locales/en/clients.json';
import loginLogsEn from '../../locales/en/login-logs.json';

import commonFr from '../../locales/fr/common.json';
import authFr from '../../locales/fr/auth.json';
import navigationFr from '../../locales/fr/navigation.json';
import adminFr from '../../locales/fr/admin.json';
import usersFr from '../../locales/fr/users.json';
import rolesFr from '../../locales/fr/roles.json';
import permissionsFr from '../../locales/fr/permissions.json';
import postsFr from '../../locales/fr/posts.json';
import messagesFr from '../../locales/fr/messages.json';
import sidebarFr from '../../locales/fr/sidebar.json';
import clientsFr from '../../locales/fr/clients.json';
import loginLogsFr from '../../locales/fr/login-logs.json';
  
const resources = {
  en: {
    translation: {
     
      common: commonEn,
      auth: authEn,
      navigation: navigationEn,
      admin: adminEn,
      user: usersEn,
      users: usersEn,
      roles: rolesEn,
      permissions: permissionsEn,
      posts: postsEn,
      messages: messagesEn,
      sidebar: sidebarEn,
      clients: clientsEn,
      loginLogs: loginLogsEn,
    },
  },
  fr: {
    translation: {
      common: commonFr,
      auth: authFr,
      navigation: navigationFr,
      admin: adminFr,
      user: usersFr,
      users: usersFr,
      roles: rolesFr,
      permissions: permissionsFr,
      posts: postsFr,
      messages: messagesFr,
      sidebar: sidebarFr,
      clients: clientsFr,
      loginLogs: loginLogsFr,
    },
  },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Prevent hydration issues
    react: {
      useSuspense: false,
    },
  });

export default i18n;
