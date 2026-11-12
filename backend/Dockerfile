FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /build
COPY pom.xml .
COPY src ./src

RUN mvn -B clean package -DskipTests


FROM eclipse-temurin:21-jre-alpine

RUN apk add --no-cache curl \
    && addgroup -S app \
    && adduser -S -G app app

WORKDIR /app

COPY --from=build /build/target/backend-1.0-SNAPSHOT.jar app.jar

RUN mkdir -p /app/data \
    && chown -R app:app /app

USER app

EXPOSE 10000

ENTRYPOINT ["java", "-jar", "app.jar"]