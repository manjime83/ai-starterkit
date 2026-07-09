# syntax=docker/dockerfile:1

# pg_dump must match the server major version (Postgres 18 on Railway). The
# official postgres image ships the exact client; aws-cli (v2) is in the Alpine
# community repo. This image runs once per Railway cron tick and exits.
FROM postgres:18-alpine

RUN apk add --no-cache aws-cli

COPY backup.sh /usr/local/bin/backup.sh
RUN chmod +x /usr/local/bin/backup.sh

ENTRYPOINT ["/usr/local/bin/backup.sh"]
