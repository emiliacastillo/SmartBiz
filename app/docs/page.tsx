import Head from "next/head";
import Script from "next/script";

export default function ApiDocsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
      <Head>
        <title>SmartBiz API Docs</title>
        <meta name="description" content="Swagger documentation for the Smart Business Platform API" />
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      </Head>

      <div style={{ padding: "2rem 1rem 3rem" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", color: "#fbbf24" }}>
              SmartBiz
            </p>
            <h1 style={{ margin: "0.5rem 0 0", fontSize: 36 }}>API documentation</h1>
          </div>
          <div id="swagger-ui" />
        </div>
      </div>

      <Script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" strategy="afterInteractive" />
      <Script id="swagger-init" strategy="afterInteractive">
        {`
          window.addEventListener('load', function() {
            if (!window.SwaggerUIBundle) return;
            SwaggerUIBundle({
              url: '/api/openapi.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              persistAuthorization: true,
              presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
              layout: 'BaseLayout',
              theme: 'dark'
            });
          });
        `}
      </Script>
    </main>
  );
}
