  교회 회계 시스템 강화 계획

  📊 현재 상태 분석

  있는 것:
  - ✅ 헌금 내역 관리 (offerings 테이블)
  - ✅ 헌금 유형 관리 (fund_types)
  - ✅ 기부금 영수증 발급 (receipts)
  - ✅ 헌금 통계 (월별/연도별)

  없는 것:
  - ❌ 지출 관리
  - ❌ 계정과목 체계
  - ❌ 예산 관리
  - ❌ 일반 거래 내역
  - ❌ 재무제표

  🎯 제안하는 회계 시스템 구조

  1단계: 데이터베이스 설계

  1.1 계정과목 테이블 (chart_of_accounts)
  - 계정코드, 계정명, 계정구분(수익/비용/자산/부채/자본)
  - 상위계정(계층 구조), 활성 여부
  - 예: 수익-헌금-십일조, 비용-사역비-교육비

  1.2 거래 내역 테이블 (transactions)
  - 거래일자, 계정과목, 금액, 거래유형(수입/지출)
  - 거래처, 적요, 증빙자료, 입력자
  - 예산항목 연결

  1.3 예산 테이블 (budgets)
  - 연도, 월, 계정과목, 예산액
  - 집행액, 잔액, 집행률

  1.4 거래처 테이블 (vendors)
  - 거래처명, 연락처, 주소, 사업자번호
  - 계좌정보, 비고

  2단계: API 개발

  2.1 계정과목 API
  - GET/POST/PUT/DELETE /accounting/chart-of-accounts
  - GET /accounting/chart-of-accounts/tree (계층 구조)

  2.2 거래 API
  - GET/POST/PUT/DELETE /accounting/transactions
  - GET /accounting/transactions/summary (요약)
  - POST /accounting/transactions/bulk (일괄 입력)

  2.3 예산 API
  - GET/POST/PUT /accounting/budgets
  - GET /accounting/budgets/execution (집행 현황)
  - GET /accounting/budgets/comparison (예산 대비 실적)

  2.4 재무제표 API
  - GET /accounting/reports/income-statement (손익계산서)
  - GET /accounting/reports/balance-sheet (재무상태표)
  - GET /accounting/reports/cash-flow (현금흐름표)
  - GET /accounting/reports/ledger (원장)

  3단계: UI 컴포넌트 개발

  3.1 거래 입력 화면
  - 일자별 수입/지출 입력
  - 계정과목 선택 (트리 구조)
  - 증빙 파일 첨부
  - 일괄 입력 기능

  3.2 예산 관리 화면
  - 연간 예산 수립
  - 월별 예산 배분
  - 예산 대비 실적 그래프
  - 예산 집행률 모니터링

  3.3 재무제표 화면
  - 손익계산서 (기간별 수익/비용)
  - 재무상태표 (자산/부채/자본)
  - 현금흐름표
  - PDF/Excel 내보내기

  3.4 회계 대시보드
  - 이번 달 수입/지출 요약
  - 예산 집행 현황
  - 주요 지출 항목 TOP 5
  - 월별 추이 차트

  3.5 거래처 관리 화면
  - 거래처 등록/수정/삭제
  - 거래처별 거래 내역

  4단계: 헌금 시스템과 통합

  4.1 헌금을 회계 거래로 자동 연결
  - offerings → transactions 자동 생성
  - 헌금 유형별 계정과목 매핑
  - 중복 입력 방지

  4.2 통합 재무보고
  - 헌금 + 일반 거래 통합 뷰
  - 교회 전체 재무 현황 한눈에 보기

  📋 구현 우선순위

  Phase 1 (기본 기능)
  1. 계정과목 관리
  2. 수입/지출 거래 입력
  3. 거래 내역 조회/검색

  Phase 2 (분석 기능)
  4. 예산 관리
  5. 예산 대비 실적 분석
  6. 기본 재무보고서 (손익계산서)

  Phase 3 (고급 기능)
  7. 재무상태표, 현금흐름표
  8. 거래처 관리
  9. 회계 대시보드
  10. Excel/PDF 내보내기

  🤔 확인 사항

  계획을 진행하기 전에 몇 가지 확인하고 싶습니다:
                                                                      
⏺ User answered Claude's questions:
  ⎿  · 어떤 단계부터 시작하고 싶으신가요? → Phase 1만 (기본 거래 입력)
     · 어떤 회계 방식을 사용하시나요? → 단식부기 (수입/지출만)
     · 헌금을 회계 거래로 자동 연결할까요? → 수동 관리

⏺ 좋습니다! 단순하고 실용적인 방향으로 진행하겠습니다.

  📝 Phase 1 상세 구현 계획 (단식부기 수입/지출 관리)

  1. 데이터베이스 테이블 설계

  1.1 account_categories (계정과목)
  {
    id: number;
    church_id: number;
    name: string;              // 예: "사역비", "관리비", "시설비"
    type: 'income' | 'expense'; // 수입/지출
    parent_id?: number;         // 상위 카테고리 (선택)
    is_active: boolean;
    display_order: number;
    created_at: timestamp;
    updated_at: timestamp;
  }

  1.2 accounting_transactions (회계 거래)
  {
    id: number;
    church_id: number;
    transaction_date: date;     // 거래일
    category_id: number;        // 계정과목
    type: 'income' | 'expense'; // 수입/지출
    amount: decimal;            // 금액
    vendor_name?: string;       // 거래처
    description: string;        // 적요
    payment_method?: string;    // 결제수단 (현금/카드/계좌이체)
    receipt_file?: string;      // 증빙파일 URL
    input_user_id: number;      // 입력자
    created_at: timestamp;
    updated_at: timestamp;
  }

  1.3 기본 계정과목 (Seed Data)
  수입:
  - 기타수입
  - 임대수입
  - 이자수입
  - 기타

  지출:
  - 사역비 (교육, 선교, 전도)
  - 인건비 (급여, 퇴직금, 4대보험)
  - 관리비 (통신비, 사무용품, 수도광열비)
  - 시설비 (수리비, 건물관리)
  - 차량비 (유류비, 수리비, 보험)
  - 경조사비
  - 접대비
  - 기타

  2. API 엔드포인트 (Supabase Edge Functions)

  2.1 /accounting/categories
  GET    /accounting/admin/categories        - 계정과목 목록
  POST   /accounting/admin/categories        - 계정과목 추가
  PUT    /accounting/admin/categories/:id    - 계정과목 수정
  DELETE /accounting/admin/categories/:id    - 계정과목 삭제

  2.2 /accounting/transactions
  GET    /accounting/admin/transactions           - 거래 내역 조회
         Query: start_date, end_date, type, category_id, keyword
  POST   /accounting/admin/transactions           - 거래 등록
  PUT    /accounting/admin/transactions/:id       - 거래 수정
  DELETE /accounting/admin/transactions/:id       - 거래 삭제
  GET    /accounting/admin/transactions/summary   - 요약 통계

  3. UI 컴포넌트 구조

  3.1 AccountingManagement.tsx (메인 화면)

  탭 구조:
  ┌─────────────────────────────────────────────────┐
  │  회계 관리                                       │
  ├─────────────────────────────────────────────────┤
  │  [거래 내역] [계정과목 관리]                     │
  ├─────────────────────────────────────────────────┤
  │  ┌─ 통계 카드 ─────────────────────────────┐  │
  │  │ 이번 달 수입  │ 이번 달 지출  │  차액    │  │
  │  │   500,000원  │   300,000원   │ +200,000원│  │
  │  └──────────────────────────────────────────┘  │
  │                                                  │
  │  [+ 수입 입력] [+ 지출 입력] [기간: 2024-11]    │
  │  [검색: ______] [구분: 전체▼] [계정과목: 전체▼] │
  │                                                  │
  │  ┌─ 거래 내역 테이블 ──────────────────────┐  │
  │  │ 날짜     │ 구분 │ 계정과목 │ 거래처 │ 금액  │ │
  │  │ 11/15   수입   기타수입   ABC    100,000 │ │
  │  │ 11/14   지출   사역비    교재사   50,000 │ │
  │  └──────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────┘

  3.2 주요 기능

  거래 입력 모달:
  - 거래일 (DatePicker)
  - 구분 (수입/지출 Toggle)
  - 계정과목 (Select - 구분에 따라 필터링)
  - 금액 (NumberInput)
  - 거래처 (TextInput)
  - 결제수단 (Select: 현금/카드/계좌이체)
  - 적요 (Textarea)
  - 증빙파일 (FileUpload - 선택)

  거래 내역 테이블:
  - 정렬: 날짜, 금액
  - 필터: 기간, 구분, 계정과목
  - 검색: 거래처, 적요
  - 액션: 수정, 삭제
  - 월별 합계 표시

  통계 카드:
  - 선택 기간 총 수입
  - 선택 기간 총 지출
  - 차액 (수입-지출)
  - 거래 건수

  계정과목 관리 탭:
  - 계정과목 목록 (수입/지출 구분)
  - 추가/수정/삭제/순서 변경
  - 활성/비활성 토글

  4. 파일 구조

  /admin-dashboard/
  ├── src/
  │   ├── components/
  │   │   └── AccountingManagement.tsx       (새로 생성)
  │   ├── services/
  │   │   └── supabaseApiService.ts          (accounting 네임스페이스 추가)
  │   └── App.tsx                             (라우트 추가)
  └── supabase/
      └── functions/
          └── accounting/
              └── index.ts                    (새로 생성)

  5. 구현 순서

  1. 데이터베이스 마이그레이션 파일 생성
    - account_categories 테이블
    - accounting_transactions 테이블
    - 기본 계정과목 Seed
  2. Supabase Edge Function 구현
    - /accounting/index.ts
    - CRUD API
  3. 프론트엔드 서비스 추가
    - supabaseApiService.ts에 accounting 네임스페이스
  4. UI 컴포넌트 개발
    - AccountingManagement.tsx
    - 거래 입력/수정 모달
    - 통계 카드
    - 거래 내역 테이블
    - 계정과목 관리 탭
  5. 라우팅 추가
    - App.tsx에 /accounting 경로 추가
