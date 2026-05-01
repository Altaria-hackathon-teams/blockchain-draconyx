import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { LanguageProvider } from "@/lib/LanguageContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">This evidence trail leads nowhere.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SilentWitness — AI Evidence Ledger" },
      { name: "description", content: "Tamper-proof evidence ledger with AI integrity analysis for survivors." },
      { name: "theme-color", content: "#0a1820" },
      { property: "og:title", content: "SilentWitness — AI Evidence Ledger" },
      { property: "og:description", content: "Tamper-proof evidence ledger with AI integrity analysis for survivors." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "SilentWitness — AI Evidence Ledger" },
      { name: "twitter:description", content: "Tamper-proof evidence ledger with AI integrity analysis for survivors." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4aeb54aa-fdca-43c3-bddb-55152878faa1/id-preview-4d5f6269--9271ea2e-8984-4a31-9143-5853b60bf6c8.lovable.app-1777569548208.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/4aeb54aa-fdca-43c3-bddb-55152878faa1/id-preview-4d5f6269--9271ea2e-8984-4a31-9143-5853b60bf6c8.lovable.app-1777569548208.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: () => (
    <LanguageProvider>
      <Outlet />
    </LanguageProvider>
  ),
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
