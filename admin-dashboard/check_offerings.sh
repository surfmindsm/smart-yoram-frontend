#!/bin/bash

SUPABASE_URL="https://adzhdsajdamrflvybhxq.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c"

echo "=== 56번 교회 헌금 데이터 분석 ==="
echo ""

curl -s -X GET "${SUPABASE_URL}/functions/v1/check-offerings-migration?church_id=56" \
  -H "Authorization: Bearer ${ANON_KEY}" | jq .
