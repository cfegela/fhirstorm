# Build Stage
FROM maven:3.9.8-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests -B

# Execution Stage
FROM eclipse-temurin:21-jre
WORKDIR /app
EXPOSE 8080
COPY --from=builder /app/target/fhirstorm-backend-1.0.0-SNAPSHOT.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
