import type { APIRoute } from "astro";
import { renderOgImage } from "@/utils/ogTemplate";
import config from "@/config";

export const GET: APIRoute = async context =>
  renderOgImage(
    config.site.title,
    config.site.description,
    new URL(config.site.url).hostname,
    context.url
  );
