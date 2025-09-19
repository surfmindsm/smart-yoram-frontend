module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Basic rules to prevent errors
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'prefer-const': 'warn'
  }
}