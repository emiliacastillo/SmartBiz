import { NextResponse } from "next/server";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Smart Business Platform API",
    version: "1.0.0",
    description:
      "API para gestionar negocios, tags inteligentes, enlaces, promociones y métricas del MVP de SmartBiz.",
  },
  servers: [
    { url: "http://localhost:3000", description: "Local development" },
    { url: "https://localhost:3000", description: "Preview" },
  ],
  tags: [
    { name: "Auth", description: "Autenticación y sesiones de administrador" },
    { name: "Businesses", description: "Gestión de negocios" },
    { name: "Tags", description: "Tags inteligentes y QR" },
    { name: "Links", description: "Enlaces de acceso directo" },
    { name: "Tracking", description: "Registro de interacciones y clics" },
    { name: "Analytics", description: "Métricas de negocio" },
  ],
  paths: {
    "/api/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesión de administrador",
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", format: "password" },
                },
              },
            },
          },
        },
        responses: {
          "302": { description: "Redirección al panel de administración" },
          "303": { description: "Redirección con error de credenciales" },
        },
      },
    },
    "/api/logout": {
      post: {
        tags: ["Auth"],
        summary: "Cerrar sesión",
        responses: {
          "303": { description: "Redirección a la pantalla de login" },
        },
      },
    },
    "/api/businesses": {
      get: {
        tags: ["Businesses"],
        summary: "Listar negocios",
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "Listado de negocios" },
          "401": { description: "No autorizado" },
        },
      },
      post: {
        tags: ["Businesses"],
        summary: "Crear negocio",
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BusinessInput" },
            },
          },
        },
        responses: {
          "201": { description: "Negocio creado" },
          "400": { description: "Payload inválido" },
          "401": { description: "No autorizado" },
        },
      },
    },
    "/api/businesses/{id}": {
      get: {
        tags: ["Businesses"],
        summary: "Obtener negocio por id",
        parameters: [{ $ref: "#/components/parameters/BusinessId" }],
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "Datos del negocio" },
          "401": { description: "No autorizado" },
          "404": { description: "Negocio no encontrado" },
        },
      },
      patch: {
        tags: ["Businesses"],
        summary: "Actualizar negocio",
        parameters: [{ $ref: "#/components/parameters/BusinessId" }],
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/BusinessInput" } },
          },
        },
        responses: {
          "200": { description: "Negocio actualizado" },
          "400": { description: "Payload inválido" },
          "401": { description: "No autorizado" },
          "404": { description: "Negocio no encontrado" },
        },
      },
    },
    "/api/businesses/{id}/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "Obtener métricas del negocio",
        parameters: [{ $ref: "#/components/parameters/BusinessId" }],
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "Métricas calculadas" },
          "401": { description: "No autorizado" },
        },
      },
    },
    "/api/tags": {
      get: {
        tags: ["Tags"],
        summary: "Listar tags inteligentes",
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "Listado de tags" },
          "401": { description: "No autorizado" },
        },
      },
      post: {
        tags: ["Tags"],
        summary: "Crear tag",
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/TagInput" } },
          },
        },
        responses: {
          "201": { description: "Tag creado" },
          "400": { description: "Payload inválido" },
          "401": { description: "No autorizado" },
        },
      },
    },
    "/api/tags/{id}": {
      get: {
        tags: ["Tags"],
        summary: "Obtener tag por id",
        parameters: [{ $ref: "#/components/parameters/TagId" }],
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "Datos del tag" },
          "401": { description: "No autorizado" },
          "404": { description: "Tag no encontrado" },
        },
      },
      patch: {
        tags: ["Tags"],
        summary: "Actualizar tag",
        parameters: [{ $ref: "#/components/parameters/TagId" }],
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/TagInput" } },
          },
        },
        responses: {
          "200": { description: "Tag actualizado" },
          "400": { description: "Payload inválido" },
          "401": { description: "No autorizado" },
          "404": { description: "Tag no encontrado" },
        },
      },
    },
    "/api/tags/{id}/qr": {
      get: {
        tags: ["Tags"],
        summary: "Generar QR del tag",
        parameters: [{ $ref: "#/components/parameters/TagId" }],
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "Imagen PNG del QR" },
          "401": { description: "No autorizado" },
          "404": { description: "Tag no encontrado" },
        },
      },
    },
    "/api/track/link": {
      get: {
        tags: ["Tracking"],
        summary: "Registrar clic en enlace y redirigir",
        parameters: [
          { name: "linkId", in: "query", required: true, schema: { type: "string" } },
          { name: "tagCode", in: "query", required: false, schema: { type: "string" } },
          { name: "source", in: "query", required: false, schema: { type: "string", enum: ["nfc", "qr", "unknown"] } },
        ],
        responses: {
          "302": { description: "Redirección al destino del enlace" },
          "400": { description: "Parámetros inválidos" },
          "404": { description: "Enlace no encontrado" },
        },
      },
    },
    "/api/track/promotion": {
      get: {
        tags: ["Tracking"],
        summary: "Registrar clic en promoción y redirigir",
        parameters: [
          { name: "promoId", in: "query", required: true, schema: { type: "string" } },
          { name: "tagCode", in: "query", required: false, schema: { type: "string" } },
          { name: "source", in: "query", required: false, schema: { type: "string", enum: ["nfc", "qr", "unknown"] } },
        ],
        responses: {
          "302": { description: "Redirección a la promoción" },
          "400": { description: "Parámetros inválidos" },
          "404": { description: "Promoción no encontrada" },
        },
      },
    },
    "/t/{code}": {
      get: {
        tags: ["Tracking"],
        summary: "Resolver vista pública del tag smart",
        parameters: [
          { name: "code", in: "path", required: true, schema: { type: "string" } },
          { name: "src", in: "query", required: false, schema: { type: "string", enum: ["qr", "nfc", "unknown"] } },
        ],
        responses: {
          "200": { description: "Smart page del negocio" },
          "404": { description: "Tag no existe o está inactivo" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionAuth: {
        type: "apiKey",
        in: "cookie",
        name: "smartbiz_session",
      },
    },
    parameters: {
      BusinessId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
      TagId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
    },
    schemas: {
      BusinessInput: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 80 },
          slug: { type: "string", minLength: 2, maxLength: 60 },
          description: { type: "string", nullable: true },
          logoUrl: { type: "string", format: "uri", nullable: true },
          primaryColor: { type: "string", example: "#ff7a00" },
          secondaryColor: { type: "string", example: "#facc15" },
          phone: { type: "string", nullable: true },
          address: { type: "string", nullable: true },
          website: { type: "string", format: "uri", nullable: true },
          active: { type: "boolean" },
        },
      },
      TagInput: {
        type: "object",
        properties: {
          businessId: { type: "string" },
          code: { type: "string", minLength: 4, maxLength: 12 },
          name: { type: "string", minLength: 2, maxLength: 80 },
          location: { type: "string", nullable: true },
          active: { type: "boolean" },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(openApiSpec);
}
