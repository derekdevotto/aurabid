import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{
    url: "https://aurabid.lol/",
    changeFrequency: "hourly",
    priority: 1,
  }];
}
