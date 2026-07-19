# pg_dump must match the server's major version — same tag as compose.yaml and the
# Railway Postgres service. Bump all three together.
FROM postgres:18

RUN apt-get update && apt-get install -y --no-install-recommends awscli && rm -rf /var/lib/apt/lists/*

COPY backup.sh /backup.sh
RUN chmod +x /backup.sh

ENTRYPOINT ["/backup.sh"]
