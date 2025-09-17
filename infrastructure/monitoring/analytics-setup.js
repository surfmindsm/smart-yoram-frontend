// Google Analytics Configuration for Smart Yoram Admin Dashboard
// Privacy-compliant analytics tracking

const GA4_TRACKING_ID = process.env.REACT_APP_GA_TRACKING_ID || ''
const environment = process.env.REACT_APP_ENVIRONMENT || 'development'

// Initialize Google Analytics
export const initGA4 = () => {
  if (!GA4_TRACKING_ID) {
    console.warn('Google Analytics tracking ID not configured. Analytics disabled.')
    return
  }

  // Only track in production environment
  if (environment !== 'production') {
    console.log('Analytics disabled in non-production environment')
    return
  }

  // Load gtag script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_TRACKING_ID}`
  document.head.appendChild(script)

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag = gtag

  gtag('js', new Date())
  gtag('config', GA4_TRACKING_ID, {
    // Privacy-focused configuration
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,

    // Custom configuration for church management
    custom_map: {
      custom_parameter_1: 'church_id',
      custom_parameter_2: 'user_role',
    },
  })
}

// Page tracking
export const trackPageView = (pageName, pageTitle) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', {
      page_title: pageTitle,
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_name: pageName,
    })
  }
}

// Event tracking
export const trackEvent = (action, category, label, value) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Church management specific tracking
export const trackChurchAction = (action, data = {}) => {
  trackEvent(action, 'church_management', data.type || 'general', 1)
}

export const trackMemberAction = (action, data = {}) => {
  trackEvent(action, 'member_management', data.type || 'general', 1)
}

export const trackCommunityAction = (action, data = {}) => {
  trackEvent(action, 'community_management', data.type || 'general', 1)
}

export const trackEventAction = (action, data = {}) => {
  trackEvent(action, 'event_management', data.type || 'general', 1)
}

// User context
export const setUserId = (userId) => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA4_TRACKING_ID, {
      user_id: userId,
    })
  }
}

export const setChurchContext = (churchId, churchName) => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA4_TRACKING_ID, {
      custom_parameter_1: churchId,
    })

    window.gtag('event', 'church_context_set', {
      church_id: churchId,
      church_name: churchName,
    })
  }
}

export const setUserRole = (role) => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA4_TRACKING_ID, {
      custom_parameter_2: role,
    })
  }
}

// Error tracking
export const trackError = (errorType, errorMessage) => {
  trackEvent('error', 'application_error', errorType, 1)
}

// Performance tracking
export const trackPerformance = (metricName, value) => {
  trackEvent('performance_metric', 'performance', metricName, value)
}

// Admin dashboard specific analytics
export const adminAnalytics = {
  loginSuccess: (userRole) => {
    trackEvent('login_success', 'authentication', userRole, 1)
  },

  memberAdded: (department) => {
    trackMemberAction('member_added', { type: department })
  },

  memberUpdated: (department) => {
    trackMemberAction('member_updated', { type: department })
  },

  memberDeleted: (department) => {
    trackMemberAction('member_deleted', { type: department })
  },

  eventCreated: (eventType) => {
    trackEventAction('event_created', { type: eventType })
  },

  communityPostCreated: (postType) => {
    trackCommunityAction('post_created', { type: postType })
  },

  dashboardAccessed: (section) => {
    trackEvent('dashboard_access', 'navigation', section, 1)
  },

  exportData: (dataType) => {
    trackEvent('data_export', 'data_management', dataType, 1)
  },

  importData: (dataType) => {
    trackEvent('data_import', 'data_management', dataType, 1)
  },

  searchPerformed: (searchType, resultCount) => {
    trackEvent('search_performed', 'search', searchType, resultCount)
  },
}

export default {
  initGA4,
  trackPageView,
  trackEvent,
  setUserId,
  setChurchContext,
  setUserRole,
  trackError,
  trackPerformance,
  adminAnalytics,
}