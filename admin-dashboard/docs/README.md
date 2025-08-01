# Smart Yoram Admin Dashboard Documentation

스마트 교회요람 관리자 대시보드 문서입니다.

## 📚 문서 목록

### UI Documentation
- [Push Notifications UI](./push-notifications-ui.md) - 푸시 알림 UI 구현 가이드
- [Member Management UI](./member-management-ui.md) - 교인 관리 UI (작성 예정)
- [Attendance UI](./attendance-ui.md) - 출석 관리 UI (작성 예정)
- [Dashboard UI](./dashboard-ui.md) - 대시보드 UI (작성 예정)

### Component Documentation
- [UI Components](./ui-components.md) - 재사용 가능한 UI 컴포넌트 (작성 예정)
- [Form Components](./form-components.md) - 폼 컴포넌트 가이드 (작성 예정)
- [Layout Components](./layout-components.md) - 레이아웃 컴포넌트 (작성 예정)

### Development
- [Setup Guide](./setup-guide.md) - 개발 환경 설정 (작성 예정)
- [Style Guide](./style-guide.md) - 코딩 스타일 가이드 (작성 예정)
- [Testing Guide](./testing-guide.md) - 테스트 가이드 (작성 예정)

## 🔗 Quick Links

- [Live Demo](https://smart-yoram-admin.vercel.app)
- [Main Project Documentation](../../../docs/README.md)
- [Backend API Documentation](../../../smart-yoram-backend/docs/README.md)

## 🎨 UI/UX Overview

### Design Principles
1. **Simplicity** - 직관적이고 사용하기 쉬운 인터페이스
2. **Accessibility** - 시니어 사용자를 고려한 큰 글씨와 명확한 버튼
3. **Responsiveness** - 모바일, 태블릿, 데스크톱 모두 지원
4. **Consistency** - 일관된 디자인 시스템

### Tech Stack
- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components
- **State Management**: React Hooks
- **Routing**: React Router v6
- **API Client**: Fetch API
- **Build Tool**: Create React App

### Project Structure
```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   └── ...             # Feature components
├── services/           # API services
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript types
└── App.tsx            # Main application
```

## 🔑 Key Features

### 1. Authentication
- JWT-based login
- Role-based access control
- Auto refresh token
- Secure token storage

### 2. Push Notifications
- Send to individuals, groups, or entire church
- Rich notification content
- Delivery tracking
- History management

### 3. Member Management
- CRUD operations
- Family relationships
- Search and filter
- Excel import/export

### 4. Attendance Tracking
- Visual attendance marking
- Statistics dashboard
- QR code check-in support
- Attendance reports

### 5. Church Management
- Church information
- Service schedules
- Announcements
- Bulletin management

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Run Development Server**
   ```bash
   npm start
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Optimizations
- Touch-friendly buttons (min 44x44px)
- Swipe gestures for navigation
- Optimized data tables for small screens
- Bottom navigation for key features

## 🎯 Component Guidelines

### Component Structure
```typescript
// ComponentName.tsx
interface ComponentNameProps {
  // Props definition
}

export default function ComponentName({ ...props }: ComponentNameProps) {
  // Component logic
  return (
    // JSX
  );
}
```

### Styling Convention
- Use Tailwind CSS classes
- Create custom components for repeated patterns
- Use CSS modules for complex animations
- Follow mobile-first approach

## 🧪 Testing

### Test Structure
```
__tests__/
├── components/     # Component tests
├── services/       # API service tests
└── utils/         # Utility function tests
```

### Running Tests
```bash
npm test              # Run all tests
npm test -- --watch  # Watch mode
npm test -- --coverage # Coverage report
```

## 📦 Deployment

### Vercel Deployment
1. Connect GitHub repository
2. Set environment variables
3. Deploy with automatic builds

### Manual Deployment
```bash
npm run build
# Upload build/ directory to hosting service
```

## 🐛 Debugging

### Common Issues
1. **CORS Errors**: Check API URL and CORS settings
2. **Auth Failures**: Verify token expiration and refresh
3. **Build Errors**: Check TypeScript types and imports

### Debug Tools
- React Developer Tools
- Redux DevTools (if using Redux)
- Network tab for API debugging

## 📝 Contributing

1. Follow the style guide
2. Write tests for new features
3. Update documentation
4. Submit PR with screenshots

---

*Last updated: 2024-01-XX*