#!/bin/bash

SUPABASE_URL="https://adzhdsajdamrflvybhxq.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c"

if [ "$1" == "migrate" ]; then
  echo "=== 마이그레이션 실행 중... ==="
  echo ""
  curl -s -X POST "${SUPABASE_URL}/functions/v1/migrate-offerings?action=migrate&church_id=56" \
    -H "Authorization: Bearer ${ANON_KEY}" | jq .
else
  echo "=== 마이그레이션 체크 ==="
  echo ""
  curl -s -X GET "${SUPABASE_URL}/functions/v1/migrate-offerings?action=check&church_id=56" \
    -H "Authorization: Bearer ${ANON_KEY}" | jq .
  echo ""
  echo "실행하려면: ./migrate_offerings.sh migrate"
fi
