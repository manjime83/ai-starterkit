#!/bin/sh
# Dump the production database and upload a compressed copy to S3.
#
# Runs as a Railway cron service over the private network (DATABASE_URL points at
# postgres.railway.internal). Retention is enforced by the bucket's lifecycle
# rule, so this script only ever uploads — it never lists or deletes objects.
#
# Required environment:
#   DATABASE_URL          postgres connection string (private network)
#   BACKUP_BUCKET         destination S3 bucket name
#   AWS_ACCESS_KEY_ID     credentials for the dedicated backup IAM user
#   AWS_SECRET_ACCESS_KEY
#   AWS_DEFAULT_REGION    e.g. us-east-1
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"

timestamp="$(date -u +%Y/%m/%d/%Y-%m-%dT%H-%M-%SZ)"
key="db/${timestamp}.sql.gz"
tmp="/tmp/backup.sql.gz"

echo "Dumping database to ${tmp} ..."
pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip -9 >"$tmp"

size="$(wc -c <"$tmp" | tr -d ' ')"
if [ "$size" -lt 100 ]; then
  echo "Dump is suspiciously small (${size} bytes); aborting without upload." >&2
  exit 1
fi

echo "Uploading ${size} bytes to s3://${BACKUP_BUCKET}/${key} ..."
aws s3 cp "$tmp" "s3://${BACKUP_BUCKET}/${key}" --only-show-errors

echo "Backup complete: s3://${BACKUP_BUCKET}/${key}"
