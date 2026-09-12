export type PublicSiteEnv = {
  [key: string]: string | undefined;
  APP_URL?: string;
  VERCEL_ENV?: string;
};

export const PRODUCTION_ORIGIN = "https://gro.expert";
export const LOCAL_ORIGIN = "http://localhost:3000";

function applicationOrigin(value = LOCAL_ORIGIN) {
  const url = new URL(value);
  const isLocalHttp =
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");

  if (
    (url.protocol !== "https:" && !isLocalHttp) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new Error(
      "APP_URL must be an HTTPS origin or a localhost HTTP origin",
    );
  }

  return url.origin;
}

export function getPublicSite(env: PublicSiteEnv = process.env) {
  const appOrigin = applicationOrigin(env.APP_URL);
  const indexable =
    env.VERCEL_ENV === "production" && appOrigin === PRODUCTION_ORIGIN;

  return {
    brand: "Gro",
    formalName: "Gro by Fusion Ventures",
    positioning: "Your dedicated Growth Agent",
    appOrigin,
    origin: appOrigin,
    homepageUrl: `${appOrigin}/`,
    loginUrl: `${appOrigin}/login`,
    socialImageUrl: `${appOrigin}/gro-social`,
    indexable,
  } as const;
}

// Public presentation only. Do not put client-site ingestion credentials here.
export const publicSite = {
  ...getPublicSite(),
  title: "Gro | AI Growth Agent for Your Business",
  description:
    "Get an AI-powered Growth Agent for your business. Gro helps with your website, Google visibility, customer conversations, social media and digital growth — backed by Fusion Ventures.",
  contactUrl:
    "https://wa.me/971542763828?text=Hi%20Fusion%20Ventures%2C%20I%27d%20like%20a%20Growth%20Agent%20for%20my%20business.",
};
