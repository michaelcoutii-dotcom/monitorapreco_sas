# 🚀 GUIA ALTERNATIVO - EXECUTAR BACKEND

Se `mvn package` não funcionou, tente uma das opções abaixo:

## Opção 1: Usar Spring Boot Run (RECOMENDADO)

```bash
cd backend
mvn clean spring-boot:run
```

**Vantagem:** Não precisa compilar JAR, Spring Boot roda direto
**Esperado:** "Tomcat started on port(s): 8080"

---

## Opção 2: Usar Docker

```bash
cd backend
docker build -t price-monitor-backend .
docker run -p 8080:8080 price-monitor-backend
```

---

## Opção 3: Compilar com Java direto

```bash
# Compilar classes
javac -version
cd backend
javac -d target/classes -cp ".:$(mvn dependency:build-classpath -q -Dmdep.outputFile=/dev/stdout)" src/main/java/com/mercadolivre/pricemonitor/*.java
```

---

## Opção 4: Usar Maven Wrapper

```bash
cd backend
./mvnw clean package -DskipTests  # Linux/Mac
# ou
mvnw.cmd clean package -DskipTests  # Windows
```

---

## ✅ RECOMENDADO: Spring Boot Run

É a forma mais simples e não precisa gerar JAR:

```bash
cd backend
mvn clean spring-boot:run
```

Este comando:
1. ✅ Compila automaticamente
2. ✅ Executa direto sem JAR
3. ✅ Hot reload (recompila com Ctrl+S)
4. ✅ Perfeito para desenvolvimento

**Resultado esperado:**
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_|\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::        (v3.2.0)

Tomcat started on port(s): 8080 (http)
```

Depois acesse: http://localhost:8080/api/products

---

## 🔧 Se Maven não estiver instalado

1. **Baixar Maven:**
   - https://maven.apache.org/download.cgi
   - Descompactar em C:\Program Files\apache-maven

2. **Adicionar ao PATH:**
   - Variáveis de ambiente → PATH
   - Adicionar: `C:\Program Files\apache-maven\bin`

3. **Verificar instalação:**
   ```bash
   mvn --version
   ```

---

## 📋 Checklist Rápido

- [ ] Java 17+ instalado? `java -version`
- [ ] Maven instalado? `mvn --version`
- [ ] Backend folder correto? `cd backend`
- [ ] pom.xml existe? `ls pom.xml`
- [ ] Usar `mvn clean spring-boot:run` (SEM JAR)

