const Faq = require("../models/Faq");
const Content = require("../models/Content");
const Character = require("../models/Character");
const Category = require("../models/Category");
const Event = require("../models/Event");
const Release = require("../models/Release");

const CATEGORY_SYNONYMS = {
  anime: ["anime", "animes", "otaku", "shonen", "shounen", "isekai"],
  gaming: ["game", "games", "gaming", "gamer", "esports", "rpg"],
  movies: ["movie", "movies", "film", "films", "cinema", "blockbuster"],
  "tv-shows": ["tv", "tv show", "tv shows", "series", "sitcom", "drama"],
  kpop: ["kpop", "k-pop", "idol", "idols", "korean", "comeback"],
  comics: ["comic", "comics", "superhero", "superheroes", "graphic novel"],
  manga: ["manga", "manhwa", "manhua", "chapter"],
  cosplay: ["cosplay", "costume", "costumes", "cosplayer", "prop"],
};

const STOPWORDS = new Set(
  "a an the is are am was were be been to of in on for and or but with at by from how do does did can could would should i me my we you your it its this that what where when which who why whom there here about into as if so any some please tell show".split(
    " "
  )
);

const ONBOARDING_STEPS = [
  {
    text: "Explore is your starting point. Search every fandom at once and narrow results by category, content type, genre, release year and popularity, then sort by latest, most popular or A-Z.",
    links: [{ label: "Open Explore", to: "/explore" }],
  },
  {
    text: "Stories and Characters: read featured articles with timelines of key moments, and browse character cards you can filter by category and fandom.",
    links: [
      { label: "Stories", to: "/stories" },
      { label: "Characters", to: "/characters" },
    ],
  },
  {
    text: "The Multimedia Center streams trailers, videos, soundtracks and podcasts. Registered fans can rate anything from 1 to 5 stars.",
    links: [{ label: "Multimedia", to: "/multimedia" }],
  },
  {
    text: "Events shows conventions, meetups and screenings on a map and a calendar. Allow location access to see what is happening near you, filter by city, and jump straight to ticket links.",
    links: [{ label: "Events", to: "/events" }],
  },
  {
    text: "Your Dashboard collects bookmarks, notes, chat history and your favourite fandoms. Bookmark any article, character, video or merch item to find it later.",
    links: [{ label: "My dashboard", to: "/dashboard" }],
  },
  {
    text: "Finally, share your own fan content from Dashboard > Submissions (an admin reviews it before it goes live), and use the Contact page to report bugs or suggest features.",
    links: [
      { label: "Submit content", to: "/dashboard/submissions" },
      { label: "Send feedback", to: "/contact" },
    ],
  },
];

const DEFAULT_SUGGESTIONS = ["Give me a tour", "Recommend some anime", "Upcoming events", "How do I bookmark?"];

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !STOPWORDS.has(word));
}

function detectCategory(lower) {
  for (const [slug, words] of Object.entries(CATEGORY_SYNONYMS)) {
    if (words.some((word) => new RegExp(`(^|[^a-z])${word}([^a-z]|$)`).test(lower))) return slug;
  }
  return null;
}

function contentLink(item) {
  if (item.type === "article") return `/stories/${item._id}`;
  return `/multimedia?item=${item._id}`;
}

async function answerFromFaq(message) {
  const words = tokenize(message);
  if (words.length === 0) return null;

  const faqs = await Faq.find({ active: true });
  let best = null;
  let bestScore = 0;

  for (const faq of faqs) {
    const questionWords = new Set(tokenize(faq.question));
    const keywords = faq.keywords.map((k) => k.toLowerCase());

    let overlap = 0;
    for (const word of words) {
      if (questionWords.has(word)) overlap += 1;
      if (keywords.some((k) => k === word || (k.length > 4 && word.startsWith(k)))) overlap += 1.5;
    }

    const score = overlap / Math.max(questionWords.size, 3);
    if (score > bestScore) {
      bestScore = score;
      best = faq;
    }
  }

  if (!best || bestScore < 0.34) return null;

  Faq.updateOne({ _id: best._id }, { $inc: { hits: 1 } }).catch(() => {});
  return { text: best.answer, intent: "faq", suggestions: ["Give me a tour", "Recommend something"] };
}

async function recommend(slug, skip = 0) {
  const category = slug ? await Category.findOne({ slug }) : null;
  const filter = { status: "published" };
  if (category) filter.category = category._id;

  const items = await Content.find(filter)
    .sort({ ratingAverage: -1, popularityScore: -1, views: -1 })
    .skip(skip)
    .limit(3);

  const characters = category
    ? await Character.find({ category: category._id }).sort({ popularity: -1 }).skip(Math.floor(skip / 2)).limit(2)
    : [];

  if (items.length === 0 && characters.length === 0) {
    return {
      text: category
        ? `I couldn't find more ${category.name} picks right now. Try another fandom or browse the Explore page.`
        : "There's nothing to recommend yet. Check back once some content has been published!",
      links: [{ label: "Explore", to: category ? `/explore?category=${category.slug}` : "/explore" }],
      intent: "recommend",
    };
  }

  const label = category ? category.name : "across FanHub+";
  const lines = items.map((item) => `• ${item.title} (${item.type})`);
  characters.forEach((c) => lines.push(`• ${c.name}${c.fandom ? ` from ${c.fandom}` : ""} (character)`));

  return {
    text: `Here are some top picks ${category ? `for ${label}` : label}:\n${lines.join("\n")}`,
    links: [
      ...items.map((item) => ({ label: item.title, to: contentLink(item) })),
      ...characters.map((c) => ({ label: c.name, to: `/characters/${c._id}` })),
    ],
    suggestions: ["Show me more", "Upcoming events", "Recommend some gaming"],
    intent: "recommend",
  };
}

async function upcomingEvents(lower) {
  const today = new Date().toISOString().slice(0, 10);
  const cities = (await Event.distinct("city")).filter(Boolean);
  const city = cities.find((c) => lower.includes(c.toLowerCase()));

  const filter = { date: { $gte: today } };
  if (city) filter.city = city;

  const events = await Event.find(filter).sort({ date: 1 }).limit(3);

  if (events.length === 0) {
    return {
      text: city ? `No upcoming events in ${city} right now.` : "No upcoming events are listed yet.",
      links: [{ label: "Events calendar", to: "/events" }],
      intent: "events",
    };
  }

  return {
    text: `Upcoming events${city ? ` in ${city}` : ""}:\n${events
      .map((e) => `• ${e.name} on ${e.date}${e.city ? ` in ${e.city}` : ""}`)
      .join("\n")}`,
    links: [...events.map((e) => ({ label: e.name, to: `/events/${e._id}` })), { label: "Events map", to: "/events" }],
    suggestions: ["Events near me", "Give me a tour"],
    intent: "events",
  };
}

async function upcomingReleases() {
  const releases = await Release.find({ releaseDate: { $gte: new Date() } })
    .sort({ releaseDate: 1 })
    .limit(4);

  if (releases.length === 0) {
    return { text: "No upcoming releases are listed yet.", intent: "releases" };
  }

  return {
    text: `Coming soon:\n${releases
      .map((r) => `• ${r.title} (${r.releaseType}) on ${r.releaseDate.toISOString().slice(0, 10)}`)
      .join("\n")}`,
    links: [{ label: "All upcoming releases", to: "/shop#releases" }],
    intent: "releases",
  };
}

function onboardingReply(step) {
  const current = ONBOARDING_STEPS[step];
  const isLast = step === ONBOARDING_STEPS.length - 1;
  return {
    text: `Step ${step + 1} of ${ONBOARDING_STEPS.length}: ${current.text}${isLast ? "\n\nThat's the tour! Say \"finish\" to wrap up." : "\n\nSay \"next\" to continue or \"stop\" to end the tour."}`,
    links: current.links,
    suggestions: isLast ? ["Finish"] : ["Next", "Stop tour"],
    intent: "onboarding",
  };
}

async function generateReply({ session, message, user }) {
  const lower = message.toLowerCase().trim();

  if (session.onboardingStep >= 0) {
    if (/^(stop|skip|exit|quit|cancel|end)\b/.test(lower) || /stop tour/.test(lower)) {
      session.onboardingStep = -1;
      return {
        text: "Tour stopped. Ask me anything whenever you like!",
        suggestions: DEFAULT_SUGGESTIONS,
        intent: "onboarding",
      };
    }

    if (/^(next|yes|ok|okay|continue|sure|go on|y|yep|finish|done)\b/.test(lower)) {
      const nextStep = session.onboardingStep + 1;
      if (nextStep >= ONBOARDING_STEPS.length) {
        session.onboardingStep = -1;
        session.onboardingCompleted = true;
        return {
          text: "You've completed the FanHub+ tour. Welcome aboard! Want a recommendation to get started?",
          suggestions: ["Recommend something", "Upcoming events"],
          intent: "onboarding",
        };
      }
      session.onboardingStep = nextStep;
      return onboardingReply(nextStep);
    }
  }

  if (/(tour|guide me|onboard|get(ting)? started|new here|how does (this|it) work|show me around|walk me through)/.test(lower)) {
    session.onboardingStep = 0;
    return onboardingReply(0);
  }

  const category = detectCategory(lower);
  if (category) session.lastCategory = category;

  if (/^(hi|hello|hey|yo|hola|salam|good (morning|evening|afternoon))\b/.test(lower)) {
    const name = user?.name ? `, ${user.name.split(" ")[0]}` : "";
    return {
      text: `Hey${name}! I'm the FanHub+ assistant. I can answer questions about the platform, recommend content, find events or give you a quick tour.`,
      suggestions: DEFAULT_SUGGESTIONS,
      intent: "greeting",
    };
  }

  if (/(thank|thx|appreciate)/.test(lower)) {
    return { text: "Anytime! Enjoy exploring FanHub+.", suggestions: DEFAULT_SUGGESTIONS, intent: "thanks" };
  }

  if (/(recommend|suggest|what should i|similar|something to (watch|read|play|listen)|show me more|more picks|popular|trending|best)/.test(lower)) {
    const wantsMore = /(more|another|else)/.test(lower);
    const previousRecs = session.messages.filter((m) => m.from === "bot" && m.intent === "recommend").length;
    const slug = category || session.lastCategory || user?.favoriteFandoms?.[0] || null;
    return recommend(slug, wantsMore ? previousRecs * 3 : 0);
  }

  if (/(event|convention|\bcon\b|meetup|meet-up|screening|concert|tournament|premiere|near me)/.test(lower)) {
    return upcomingEvents(lower);
  }

  if (/(upcoming|release|coming soon|\bdrop(s)?\b|launch)/.test(lower)) {
    return upcomingReleases();
  }

  const faqAnswer = await answerFromFaq(message);
  if (faqAnswer) return faqAnswer;

  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) {
      return {
        text: `${cat.name}: ${cat.description || "one of our fandom universes."} Want some recommendations?`,
        links: [{ label: `Browse ${cat.name}`, to: `/category/${cat.slug}` }],
        suggestions: [`Recommend some ${cat.name}`, "Upcoming events"],
        intent: "category",
      };
    }
  }

  return {
    text: "I'm not sure about that one yet. I can help with platform questions, recommendations, events and releases, or give you a guided tour.",
    suggestions: DEFAULT_SUGGESTIONS,
    intent: "fallback",
  };
}

module.exports = { generateReply, ONBOARDING_STEPS, DEFAULT_SUGGESTIONS, detectCategory };
