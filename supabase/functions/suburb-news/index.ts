import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CACHE_HOURS = 24;

const NEWS_CATEGORY_KEYWORDS = {
  violent: [
    "assault",
    "robbery",
    "violence",
    "violent",
    "stabbing",
    "attack",
    "harassment",
    "threat",
    "weapon"
  ],

  property: [
    "theft",
    "burglary",
    "break-in",
    "stealing",
    "stolen",
    "car theft",
    "vehicle theft",
    "property damage",
    "vandalism"
  ],

  other: [
    "police",
    "crime",
    "safety",
    "incident",
    "antisocial",
    "drug",
    "public order",
    "investigation",
    "arrest",
    "fire",
    "suspicious fire",
    "arson"
  ]
};

const GNEWS_SEARCH_KEYWORDS = [
  "police",
  "crime",
  "safety",
  "assault",
  "theft",
  "burglary",
  "robbery",
  "arrest",
  "charged",
  "investigation",
  "stabbing",
  "fire",
  "arson"
];

function getArticleCategory(article: any) {
  const text = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  if (NEWS_CATEGORY_KEYWORDS.violent.some((word) => text.includes(word))) {
    return "violent";
  }

  if (NEWS_CATEGORY_KEYWORDS.property.some((word) => text.includes(word))) {
    return "property";
  }

  return "other";
}

function normaliseGNewsArticle(article: any) {
  return {
    title: article.title || "",
    source: article.source?.name || "Unknown source",
    publishedAt: article.publishedAt || "",
    description: article.description || "",
    url: article.url || "",
    image: article.image || "",
    category: getArticleCategory(article),
  };
}

function getNewsSearchName(suburbName: string) {
  const cleaned = String(suburbName || "")
    // remove text inside brackets, e.g. Richmond (South) -> Richmond
    .replace(/\s*\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // keep the text before "-", "–", or "—"
  const beforeDash = cleaned
    .split(/\s*[-–—]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)[0];

  return beforeDash || cleaned;
}

function normaliseForNewsMatch(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, " ")
    .replace(/\s*[-–—]\s*/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const { suburbSlug, suburbName, city, state } = await req.json();

    if (!suburbSlug || !suburbName) {
      return new Response(
        JSON.stringify({ error: "Missing suburb information" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const gnewsApiKey = Deno.env.get("GNEWS_API_KEY");

    if (!supabaseUrl || !serviceRoleKey || !gnewsApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing server environment variables" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: cached } = await supabase
      .from("suburb_news_cache")
      .select("articles, fetched_at")
      .eq("suburb_slug", suburbSlug)
      .maybeSingle();

    if (cached?.fetched_at) {
      const fetchedAt = new Date(cached.fetched_at).getTime();
      const cacheAgeMs = Date.now() - fetchedAt;
      const cacheIsFresh = cacheAgeMs < CACHE_HOURS * 60 * 60 * 1000;

      if (cacheIsFresh) {
        return new Response(
          JSON.stringify({
            articles: cached.articles || [],
            fromCache: true,
          }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    const searchName = getNewsSearchName(suburbName);
    let query = `"${searchName}" AND (${GNEWS_SEARCH_KEYWORDS.join(" OR ")})`;

    if (query.length > 190) {
      query = `"${searchName}" AND (police OR crime OR safety OR assault OR theft OR burglary OR fire)`;
    }

    const gnewsUrl =
      `https://gnews.io/api/v4/search?` +
      `q=${encodeURIComponent(query)}` +
      `&lang=en` +
      `&country=au` +
      `&max=10` +
      `&sortby=relevance` +
      `&in=title,description,content` +
      `&apikey=${gnewsApiKey}`;

    const gnewsResponse = await fetch(gnewsUrl);

    if (!gnewsResponse.ok) {
      const errorText = await gnewsResponse.text();

      console.error("GNews request failed:", {
        status: gnewsResponse.status,
        body: errorText,
        query,
      });

      return new Response(
        JSON.stringify({
          error: "GNews request failed",
          status: gnewsResponse.status,
          details: errorText,
          query,
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const gnewsData = await gnewsResponse.json();

    const articles = (gnewsData.articles || [])
      .filter((article: any) => {
        const text = normaliseForNewsMatch(
          `${article.title || ""} ${article.description || ""} ${article.content || ""}`
        );

        const fullSuburbText = normaliseForNewsMatch(suburbName);
        const searchNameText = normaliseForNewsMatch(searchName);

        return (
          text.includes(fullSuburbText) ||
          text.includes(searchNameText)
        );
      })
      .map(normaliseGNewsArticle);

    await supabase
      .from("suburb_news_cache")
      .upsert({
        suburb_slug: suburbSlug,
        suburb_name: suburbName,
        city: city || null,
        state: state || null,
        articles,
        fetched_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({
        articles,
        fromCache: false,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("suburb-news function error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to load safety news",
        details: String(error),
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});