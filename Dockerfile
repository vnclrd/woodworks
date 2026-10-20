# Stage 1: Build the JAR file using Maven
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
COPY . .

# Fix execution permissions and Windows line endings for mvnw on Linux build agents
RUN chmod +x ./mvnw && sed -i 's/\r$//' ./mvnw

RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal runtime container
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]