#!/bin/bash
# Dump the database, validate the archive, upload to S3, exit.
# Retention is the backups bucket's lifecycle rule — this script only ever uploads.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_BUCKET:?BACKUP_BUCKET is required}"

dump_file="$(mktemp)"
trap 'rm -f "$dump_file"' EXIT

pg_dump --format=custom --no-owner --no-privileges --file="$dump_file" "$DATABASE_URL"

# A backup that pg_restore cannot read is not a backup.
pg_restore --list "$dump_file" >/dev/null

timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
date_path="$(date -u +%Y/%m/%d)"

aws s3 cp "$dump_file" "s3://$BACKUP_BUCKET/db/$date_path/$timestamp.dump"

echo "Backup uploaded: s3://$BACKUP_BUCKET/db/$date_path/$timestamp.dump"
