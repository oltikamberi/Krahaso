#!/bin/sh
set -e

# Render (and many hosts) provide postgres://user:pass@host:port/db
# Spring/Hikari wants jdbc:postgresql://host:port/db plus separate credentials.
if [ -n "$DATABASE_URL" ] && [ -z "$SPRING_DATASOURCE_URL" ]; then
  REST=$(printf '%s' "$DATABASE_URL" | sed -E 's|^postgres(ql)?://||')
  case "$REST" in
    *@*)
      CREDS=${REST%%@*}
      HOSTPART=${REST#*@}
      DB_USER=${CREDS%%:*}
      DB_PASS=${CREDS#*:}
      [ "$DB_PASS" = "$CREDS" ] && DB_PASS=""
      ;;
    *)
      HOSTPART=$REST
      DB_USER=""
      DB_PASS=""
      ;;
  esac
  export SPRING_DATASOURCE_URL="jdbc:postgresql://${HOSTPART}"
  [ -z "$SPRING_DATASOURCE_USERNAME" ] && [ -n "$DB_USER" ] && export SPRING_DATASOURCE_USERNAME="$DB_USER"
  [ -z "$SPRING_DATASOURCE_PASSWORD" ] && [ -n "$DB_PASS" ] && export SPRING_DATASOURCE_PASSWORD="$DB_PASS"
fi

exec java ${JAVA_OPTS:--XX:MaxRAMPercentage=75.0} -jar app.jar
