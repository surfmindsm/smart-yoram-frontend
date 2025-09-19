// Sentry Configuration for Smart Yoram Admin Dashboard
// Error tracking and performance monitoring setup

import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

const environment = process.env.REACT_APP_ENVIRONMENT || 'development'
const sentryDsn = process.env.REACT_APP_SENTRY_DSN || ''

export const initSentry = () => {
  if (!sentryDsn) {
    console.warn('Sentry DSN not configured. Error tracking disabled.')
    return
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    integrations: [
      new BrowserTracing({
        // Set up automatic route change tracking
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
    ],

    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Session replay
    replaysSessionSampleRate: environment === 'production' ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Error filtering
    beforeSend(event, hint) {
      // Filter out development errors
      if (environment === 'development') {
        const error = hint.originalException
        if (error && error.message && error.message.includes('ResizeObserver')) {
          return null
        }
      }

      // Don't send events from localhost in production builds
      if (environment === 'production' && window.location.hostname === 'localhost') {
        return null
      }

      return event
    },

    // Release tracking
    release: process.env.REACT_APP_VERSION || 'unknown',

    // Tags
    tags: {
      app: 'smart-yoram-admin',
      environment,
    },
  })

  // Set user context helper
  const setUserContext = (user) => {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.full_name,
    })
  }

  // Set church context helper
  const setChurchContext = (church) => {
    Sentry.setTag('church_id', church.id)
    Sentry.setTag('church_name', church.name)
    Sentry.setContext('church', {
      id: church.id,
      name: church.name,
      subscription_plan: church.subscription_plan,
    })
  }

  return {
    setUserContext,
    setChurchContext,
    captureException: Sentry.captureException,
    captureMessage: Sentry.captureMessage,
    addBreadcrumb: Sentry.addBreadcrumb,
  }
}

// Error boundary for React components
export const SentryErrorBoundary = Sentry.withErrorBoundary

// Custom error reporting
export const reportApiError = (error, context = {}) => {
  Sentry.withScope((scope) => {
    scope.setTag('error_type', 'api_error')
    scope.setContext('api_context', context)
    Sentry.captureException(error)
  })
}

export const reportUserAction = (action, data = {}) => {
  Sentry.addBreadcrumb({
    message: action,
    category: 'user_action',
    data,
    level: 'info',
  })
}

export default {
  initSentry,
  SentryErrorBoundary,
  reportApiError,
  reportUserAction,
}