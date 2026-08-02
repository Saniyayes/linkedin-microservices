#!/bin/bash
# One-time AWS infrastructure setup. Run this once before the GitHub Actions
# pipeline can deploy anything. Requires: aws CLI configured with credentials
# that can create IAM roles, EB apps, ECR repos, and RDS instances.
set -e

export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export REGION=us-east-1
aws configure set region $REGION

echo "=== Account: $AWS_ACCOUNT_ID | Region: $REGION ==="

# ---------------------------------------------------------------------------
# 1. IAM roles (one-time, account-level)
# ---------------------------------------------------------------------------
aws iam create-role --role-name aws-elasticbeanstalk-ec2-role \
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' 2>/dev/null || true
aws iam attach-role-policy --role-name aws-elasticbeanstalk-ec2-role --policy-arn arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier
aws iam attach-role-policy --role-name aws-elasticbeanstalk-ec2-role --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
aws iam attach-role-policy --role-name aws-elasticbeanstalk-ec2-role --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
aws iam create-instance-profile --instance-profile-name aws-elasticbeanstalk-ec2-role 2>/dev/null || true
aws iam add-role-to-instance-profile --instance-profile-name aws-elasticbeanstalk-ec2-role --role-name aws-elasticbeanstalk-ec2-role 2>/dev/null || true

sleep 10  # let IAM propagate

# ---------------------------------------------------------------------------
# 2. RDS - PostgreSQL (replaces the docker-compose postgres container)
#    user-service and post-service are wired to real JPA persistence and will
#    connect here. social-service and feed-service still run in-memory.
# ---------------------------------------------------------------------------
DB_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
echo "Generated RDS master password (SAVE THIS): $DB_PASSWORD"

aws rds create-db-instance \
  --db-instance-identifier linkedin-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username postgres \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage 20 \
  --publicly-accessible \
  --backup-retention-period 1 \
  --no-multi-az \
  --storage-type gp3 2>/dev/null || echo "RDS instance already exists, skipping"

echo "Waiting for RDS instance to become available (this takes ~5-10 minutes)..."
aws rds wait db-instance-available --db-instance-identifier linkedin-postgres

RDS_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier linkedin-postgres \
  --query "DBInstances[0].Endpoint.Address" --output text)
echo "RDS endpoint: $RDS_ENDPOINT"
echo "$RDS_ENDPOINT" > /tmp/rds-endpoint.txt
echo "$DB_PASSWORD" > /tmp/rds-password.txt

# Open port 5432 to the internet so EB instances can reach it.
# NOTE: this is a pragmatic first-deployment tradeoff, not best practice -
# tighten this to your EB security group's ID once things are working.
RDS_SG_ID=$(aws rds describe-db-instances --db-instance-identifier linkedin-postgres \
  --query "DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId" --output text)
aws ec2 authorize-security-group-ingress --group-id "$RDS_SG_ID" \
  --protocol tcp --port 5432 --cidr 0.0.0.0/0 2>/dev/null || echo "SG rule already exists, skipping"

# Create the two databases user-service and post-service each need.
PGPASSWORD="$DB_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d postgres -c "CREATE DATABASE user_db;" 2>/dev/null || echo "user_db already exists"
PGPASSWORD="$DB_PASSWORD" psql -h "$RDS_ENDPOINT" -U postgres -d postgres -c "CREATE DATABASE post_db;" 2>/dev/null || echo "post_db already exists"

# ---------------------------------------------------------------------------
# 3. Per-service AWS resources: ECR repo + EB application + EB environment
# ---------------------------------------------------------------------------
declare -a services=("user-service" "social-service" "post-service" "feed-service" "api-gateway")

for SERVICE in "${services[@]}"; do
  echo "=== Setting up $SERVICE ==="

  aws ecr create-repository --repository-name linkedin-$SERVICE --region $REGION 2>/dev/null || true

  aws elasticbeanstalk create-application --application-name linkedin-$SERVICE 2>/dev/null || true

  aws elasticbeanstalk create-environment \
    --application-name linkedin-$SERVICE \
    --environment-name linkedin-$SERVICE-prod \
    --solution-stack-name "64bit Amazon Linux 2023 v4.13.5 running Docker" \
    --option-settings \
        Namespace=aws:autoscaling:launchconfiguration,OptionName=IamInstanceProfile,Value=aws-elasticbeanstalk-ec2-role \
        Namespace=aws:elasticbeanstalk:cloudwatch:logs,OptionName=StreamLogs,Value=true \
        Namespace=aws:elasticbeanstalk:cloudwatch:logs,OptionName=RetentionInDays,Value=14 \
        Namespace=aws:elasticbeanstalk:healthreporting:system,OptionName=SystemType,Value=enhanced \
    2>/dev/null || echo "$SERVICE environment already exists, skipping"

  echo "$SERVICE done"
done

# user-service and post-service need real datasource credentials pointed at RDS.
echo "Waiting for user-service and post-service environments to be ready before setting env vars..."
aws elasticbeanstalk wait environment-updated --environment-name linkedin-user-service-prod 2>/dev/null || sleep 60
aws elasticbeanstalk wait environment-updated --environment-name linkedin-post-service-prod 2>/dev/null || sleep 60

aws elasticbeanstalk update-environment --environment-name linkedin-user-service-prod \
  --option-settings \
      Namespace=aws:elasticbeanstalk:application:environment,OptionName=SPRING_DATASOURCE_URL,Value="jdbc:postgresql://$RDS_ENDPOINT:5432/user_db" \
      Namespace=aws:elasticbeanstalk:application:environment,OptionName=SPRING_DATASOURCE_USERNAME,Value="postgres" \
      Namespace=aws:elasticbeanstalk:application:environment,OptionName=SPRING_DATASOURCE_PASSWORD,Value="$DB_PASSWORD"

aws elasticbeanstalk update-environment --environment-name linkedin-post-service-prod \
  --option-settings \
      Namespace=aws:elasticbeanstalk:application:environment,OptionName=SPRING_DATASOURCE_URL,Value="jdbc:postgresql://$RDS_ENDPOINT:5432/post_db" \
      Namespace=aws:elasticbeanstalk:application:environment,OptionName=SPRING_DATASOURCE_USERNAME,Value="postgres" \
      Namespace=aws:elasticbeanstalk:application:environment,OptionName=SPRING_DATASOURCE_PASSWORD,Value="$DB_PASSWORD"
# api-gateway needs to know where every downstream service actually lives on AWS -
# without this it falls back to docker-compose's local hostnames, which don't
# resolve outside your local Docker network. This bit us once already; baked in
# here so a fresh environment doesn't hit the same bug.
echo "Waiting for all service environments before wiring gateway routes..."
for SVC in user-service post-service social-service feed-service; do
  aws elasticbeanstalk wait environment-updated --environment-name linkedin-$SVC-prod 2>/dev/null || sleep 60
done

USER_SERVICE_URL=$(aws elasticbeanstalk describe-environments --application-name linkedin-user-service --environment-names linkedin-user-service-prod --query "Environments[0].CNAME" --output text)
POST_SERVICE_URL=$(aws elasticbeanstalk describe-environments --application-name linkedin-post-service --environment-names linkedin-post-service-prod --query "Environments[0].CNAME" --output text)
SOCIAL_SERVICE_URL=$(aws elasticbeanstalk describe-environments --application-name linkedin-social-service --environment-names linkedin-social-service-prod --query "Environments[0].CNAME" --output text)
FEED_SERVICE_URL=$(aws elasticbeanstalk describe-environments --application-name linkedin-feed-service --environment-names linkedin-feed-service-prod --query "Environments[0].CNAME" --output text)

aws elasticbeanstalk update-environment --environment-name linkedin-api-gateway-prod \
  --option-settings \
      Namespace=aws:elasticbeanstalk:application:environment,OptionName=USER_SERVICE_URL,Value="http://$USER_SERVICE_URL" \
      Namespace=aws:elasticbeanstalk:application:environment,OptionName=POST_SERVICE_URL,Value="http://$POST_SERVICE_URL" \
      Namespace=aws:elasticbeanstalk:application:environment,OptionName=SOCIAL_SERVICE_URL,Value="http://$SOCIAL_SERVICE_URL" \
      Namespace=aws:elasticbeanstalk:application:environment,OptionName=FEED_SERVICE_URL,Value="http://$FEED_SERVICE_URL"
# ---------------------------------------------------------------------------
# 4. Frontend hosting - AWS Amplify (git-connected, auto-builds on push)
# ---------------------------------------------------------------------------
GATEWAY_URL=$(aws elasticbeanstalk describe-environments \
  --application-name linkedin-api-gateway --environment-names linkedin-api-gateway-prod \
  --query "Environments[0].CNAME" --output text)
echo ""
echo "=== Frontend hosting ==="
echo "Gateway URL for the frontend to call: http://$GATEWAY_URL"
echo ""
echo "Amplify needs a one-time console connection to your GitHub repo (OAuth"
echo "can't be scripted safely from the CLI). Do this manually, it's ~2 minutes:"
echo "  1. https://console.aws.amazon.com/amplify -> New app -> Host web app"
echo "  2. Connect your GitHub repo, branch: main"
echo "  3. App build spec: point it at frontend/amplify.yml (set 'App root' to 'frontend')"
echo "  4. Environment variables -> add VITE_API_BASE_URL = http://$GATEWAY_URL"
echo "  5. Save and deploy - Amplify gives you one URL, and rebuilds on every git push"

echo ""
echo "=== All infrastructure created ==="
echo "Next: add these as GitHub repo secrets (Settings -> Secrets and variables -> Actions):"
echo "  AWS_ACCESS_KEY_ID"
echo "  AWS_SECRET_ACCESS_KEY"
echo ""
echo "RDS endpoint: $RDS_ENDPOINT"
echo "RDS master password saved to /tmp/rds-password.txt - move it somewhere safe, then delete that file."
