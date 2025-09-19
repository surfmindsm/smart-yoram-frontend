#!/bin/bash

# Frontend EC2 배포 스크립트

echo "=== Smart Yoram Frontend 배포 ==="
echo ""
echo "이 스크립트는 로컬에서 실행하여 EC2로 프론트엔드를 배포합니다."
echo ""

# 변수 설정
EC2_IP="3.25.230.187"
EC2_USER="ubuntu"
PEM_FILE="~/your-key.pem"  # EC2 접속용 PEM 파일 경로 수정 필요

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}1. 프로덕션 빌드 생성...${NC}"
npm run build

if [ ! -d "build" ]; then
    echo -e "${RED}빌드 실패! build 디렉토리가 없습니다.${NC}"
    exit 1
fi

echo -e "${BLUE}2. 빌드 파일 압축...${NC}"
tar -czf build.tar.gz build/

echo -e "${BLUE}3. EC2로 파일 전송...${NC}"
echo "PEM 파일 경로를 입력하세요 (기본값: ~/your-key.pem):"
read -r PEM_INPUT
if [ -n "$PEM_INPUT" ]; then
    PEM_FILE="$PEM_INPUT"
fi

# 파일 전송
scp -i "$PEM_FILE" build.tar.gz $EC2_USER@$EC2_IP:~/

echo -e "${BLUE}4. EC2에서 배포 실행...${NC}"
ssh -i "$PEM_FILE" $EC2_USER@$EC2_IP << 'EOF'
# Nginx 웹 루트 디렉토리 생성
sudo mkdir -p /var/www/smartyoram

# 기존 파일 백업
if [ -d "/var/www/smartyoram/html" ]; then
    sudo mv /var/www/smartyoram/html /var/www/smartyoram/html.backup.$(date +%Y%m%d-%H%M%S)
fi

# 압축 해제
tar -xzf ~/build.tar.gz
sudo mv ~/build /var/www/smartyoram/html
rm ~/build.tar.gz

# 권한 설정
sudo chown -R www-data:www-data /var/www/smartyoram
sudo chmod -R 755 /var/www/smartyoram

# Nginx 설정 생성
sudo tee /etc/nginx/sites-available/smartyoram-frontend > /dev/null << 'NGINX'
server {
    listen 3000;
    server_name _;

    root /var/www/smartyoram/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

# Nginx 설정 활성화
sudo ln -sf /etc/nginx/sites-available/smartyoram-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "배포 완료!"
EOF

# 로컬 압축 파일 삭제
rm -f build.tar.gz

echo ""
echo -e "${GREEN}=== 배포 완료! ===${NC}"
echo ""
echo "프론트엔드 접속 주소:"
echo -e "${YELLOW}http://$EC2_IP:3000${NC}"
echo ""
echo "주의사항:"
echo "1. EC2 Security Group에서 3000번 포트가 열려있어야 합니다"
echo "2. 백엔드 API는 http://$EC2_IP/api/v1 로 프록시됩니다"