#!/bin/sh
set -e

# Render (and many hosts) provide postgres://… — Spring wants jdbc:postgresql://…
if [ -n "$DATABASE_URL" ] && [ -z "$SPRING_DATASOURCE_URL" ]; then
  JDBC_URL=$(printf '%s' "$DATABASE_URL" | sed -e 's|^postgres://|jdbc:postgresql://|' -e 's|^postgresql://|jdbc:postgresql://|')
  export SPRING_DATASOURCE_URL="$JDBC_URL"
fi

exec java ${JAVA_OPTS:--XX:MaxRAMPercentage=75.0} -jar app.jar
