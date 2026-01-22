#!/bin/bash

SUPABASE_URL="https://adzhdsajdamrflvybhxq.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c"

echo "=== 56번 교회 수입 계정과목 최종 상태 ==="
echo ""

curl -s -X GET "${SUPABASE_URL}/rest/v1/account_categories?church_id=eq.56&type=eq.income&order=parent_id.nullsfirst,name.asc&select=id,name,parent_id" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" | jq -r '
    group_by(.parent_id) |
    map({
      parent: (
        if .[0].parent_id == null then "최상위 항목"
        elif .[0].parent_id == 1924 then "헌금(1924) 하위 항목"
        else ("parent_id=" + (.[0].parent_id | tostring))
        end
      ),
      count: length,
      items: map(.name)
    }) |
    .[] |
    "[\(.parent)] 총 \(.count)개\n  - \(.items | join("\n  - "))\n"
  '
