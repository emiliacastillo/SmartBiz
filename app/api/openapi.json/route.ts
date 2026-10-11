import { NextResponse } from "next/server";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Smart Business Platform API",
    version: "1.0.0",
    description:
      "API for managing businesses, smart tags, links, promotions, and analytics for the SmartBiz MVP.",
  },
  servers: [
    { url: "http://localhost:3000", description: "Local development" },
    { url: "https://localhost:3000", description: "Preview" },
  ],
  tags: [
    { name: "Auth", description: "Administrator authentication and sessions" },
    { name: "Businesses", description: "Business management" },
    { name: "Tags", description: "Smart tags and QR codes" },
    { name: "Links", description: "Direct-access links" },
    { name: "Tracking", description: "Interaction and click tracking" },
    { name: "Analytics", description: "Business metrics" },
  ],
  paths: {
    "/api/login": {
      post: {
        tags: ["Auth"],
        summary: "Admin login",
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
          "302": { description: "Redirect to the admin panel" },
          "303": { description: "Redirect with invalid credentials" },
        },
      },
    },
    "/api/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out",
        responses: {
          "303": { description: "Redirect to the login screen" },
        },
      },
    },
    "/api/businesses": {
      get: {
        tags: ["Businesses"],
        summary: "List businesses",
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "List of businesses" },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Businesses"],
        summary: "Create business",
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
          "201": { description: "Business created" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/businesses/{id}": {
      get: {
        tags: ["Businesses"],
        summary: "Get business by id",
        parameters: [{ $ref: "#/components/parameters/BusinessId" }],
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "Business data" },
          "401": { description: "Unauthorized" },
          "404": { description: "Business not found" },
        },
      },
      patch: {
        tags: ["Businesses"],
        summary: "Update business",
        parameters: [{ $ref: "#/components/parameters/BusinessId" }],
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/BusinessInput" } },
          },
        },
        responses: {
          "200": { description: "Business updated" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
          "404": { description: "Business not found" },
        },
      },
    },
    "/api/businesses/{id}/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "Get business metrics",
        parameters: [{ $ref: "#/components/parameters/BusinessId" }],
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "Calculated metrics" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/tags": {
      get: {
        tags: ["Tags"],
        summary: "List smart tags",
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "List of tags" },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Tags"],
        summary: "Create tag",
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/TagInput" } },
          },
        },
        responses: {
          "201": { description: "Tag created" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/tags/{id}": {
      get: {
        tags: ["Tags"],
        summary: "Get tag by id",
        parameters: [{ $ref: "#/components/parameters/TagId" }],
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "Tag data" },
          "401": { description: "Unauthorized" },
          "404": { description: "Tag not found" },
        },
      },
      patch: {
        tags: ["Tags"],
        summary: "Update tag",
        parameters: [{ $ref: "#/components/parameters/TagId" }],
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/TagInput" } },
          },
        },
        responses: {
          "200": { description: "Tag updated" },
          "400": { description: "Invalid payload" },
          "401": { description: "Unauthorized" },
          "404": { description: "Tag not found" },
        },
      },
    },
    "/api/tags/{id}/qr": {
      get: {
        tags: ["Tags"],
        summary: "Generate QR code for a tag",
        parameters: [{ $ref: "#/components/parameters/TagId" }],
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "PNG image of the QR code" },
          "401": { description: "Unauthorized" },
          "404": { description: "Tag not found" },
        },
      },
    },
    "/api/track/link": {
      get: {
        tags: ["Tracking"],
        summary: "Track a link click and redirect",
        parameters: [
          { name: "linkId", in: "query", required: true, schema: { type: "string" } },
          { name: "tagCode", in: "query", required: false, schema: { type: "string" } },
          { name: "source", in: "query", required: false, schema: { type: "string", enum: ["nfc", "qr", "unknown"] } },
        ],
        responses: {
          "302": { description: "Redirect to the link destination" },
          "400": { description: "Invalid parameters" },
          "404": { description: "Link not found" },
        },
      },
    },
    "/api/track/promotion": {
      get: {
        tags: ["Tracking"],
        summary: "Track a promotion click and redirect",
        parameters: [
          { name: "promoId", in: "query", required: true, schema: { type: "string" } },
          { name: "tagCode", in: "query", required: false, schema: { type: "string" } },
          { name: "source", in: "query", required: false, schema: { type: "string", enum: ["nfc", "qr", "unknown"] } },
        ],
        responses: {
          "302": { description: "Redirect to the promotion" },
          "400": { description: "Invalid parameters" },
          "404": { description: "Promotion not found" },
        },
      },
    },
    "/t/{code}": {
      get: {
        tags: ["Tracking"],
        summary: "Resolve a public smart tag page",
        parameters: [
          { name: "code", in: "path", required: true, schema: { type: "string" } },
          { name: "src", in: "query", required: false, schema: { type: "string", enum: ["qr", "nfc", "unknown"] } },
        ],
        responses: {
          "200": { description: "Business smart page" },
          "404": { description: "Tag does not exist or is inactive" },
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
