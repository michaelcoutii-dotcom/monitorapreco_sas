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
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 8081

# JVM optimizations for containers (Railway dynamically allocates memory)
# - UseContainerSupport: JVM detects container memory limits
# - MaxRAMPercentage=75: Use up to 75% of available RAM (leaves room for OS)
# - UseG1GC: Better for containers with more memory, good pause times
# - TieredCompilation: Faster startup
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:+TieredCompilation -XX:TieredStopAtLevel=1"

# Run the application with optimized settings
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
