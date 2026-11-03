# Build
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw
COPY src src
RUN ./mvnw -q -DskipTests package

# Run
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S krahaso && adduser -S krahaso -G krahaso
COPY --from=build /app/target/*.jar app.jar
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && chown krahaso:krahaso /app/docker-entrypoint.sh
USER krahaso
EXPOSE 8080
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
ENTRYPOINT ["/app/docker-entrypoint.sh"]
