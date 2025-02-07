# Etapa de construcción
FROM golang:1.19-alpine AS builder

# Establecer el directorio de trabajo en la carpeta que contiene tu código fuente
WORKDIR /goapp/Post

# Copiar los archivos necesarios de tu proyecto (por ejemplo, go.mod, main.go, etc.)
COPY goapp/Post/ .

# Descargar las dependencias
RUN go mod download

# Compilar la aplicación Go
RUN go build -o /example-golang ./main.go

# Etapa de ejecución
FROM alpine:latest AS runner

# Instalar las dependencias necesarias
RUN apk --no-cache add ca-certificates

# Establecer el directorio de trabajo en donde se ejecutará la app
WORKDIR /app

# Copiar la aplicación compilada y el archivo .env desde la etapa de construcción
COPY --from=builder /example-golang /app/
COPY .env .env

# Exponer el puerto que usará la aplicación
EXPOSE 8080

# Configurar el contenedor para ejecutar la aplicación
ENTRYPOINT ["/app/example-golang"]
