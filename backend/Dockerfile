# Java Backend - Dockerfile (Multi-stage Build)
# Clone and run: docker-compose up -d --build

# ===== STAGE 1: Build =====
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml and source
COPY pom.xml .
COPY src ./src

# Build the application (download deps + compile in one step for reliability)
RUN mvn clean package -DskipTests -B

# ===== STAGE 2: Runtime =====
FROM eclipse-temurin:21-jre

WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8081

# JVM optimizations for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:+UseStringDeduplication"

# Run the application with optimized settings
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
