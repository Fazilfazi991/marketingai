import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // OAuth codes arrive in the query string; never print callback requests in dev logs.
  logging: { incomingRequests: { ignore: [/\/api\/integrations\/google\/callback/] } },
};

export default nextConfig;
