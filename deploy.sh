
# 환경변수 셋팅
filename="dist/.env"
path="/first/production/"

# 기존 파일 삭제
rm $filename

# .env 파일 생성
echo DB_USER=$(aws ssm get-parameters --region ap-northeast-2 --names $path"DB_USER" --query Parameters[0].Value | sed 's/"//g') >> $filename
echo DB_HOST=$(aws ssm get-parameters --region ap-northeast-2 --names $path"DB_HOST" --query Parameters[0].Value | sed 's/"//g')  >> $filename
echo DB_PASSWD=$(aws ssm get-parameters --region ap-northeast-2 --names $path"DB_PASSWD" --query Parameters[0].Value | sed 's/"//g')  >> $filename

echo DISCORD_TOKEN=$(aws ssm get-parameters --region ap-northeast-2 --names $path"DISCORD_TOKEN" --query Parameters[0].Value | sed 's/"//g')  >> $filename

zip -r dist/lambda.zip node_modules
cd dist
zip -r lambda.zip ./