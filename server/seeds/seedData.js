require("dotenv").config();
const mongoose = require("mongoose");

const Content = require("../models/Content");
const Character = require("../models/Character");
const Merchandise = require("../models/Merchandise");
const Event = require("../models/Event");
const Release = require("../models/Release");
const Faq = require("../models/Faq");
const Settings = require("../models/Settings");
const { seedCategories } = require("./seedCategories");
const { seedUsers } = require("./seedAdmin");

const MDN_CC0 = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos";
const COMMONS = "https://upload.wikimedia.org/wikipedia/commons/transcoded";
const SAMPLE_AUDIO = "https://www.soundhelix.com/examples/mp3";

const ARTICLES = [
  {
    title: "Starlight Requiem: Why the Final Arc Hits So Hard",
    cat: "anime",
    fandom: "Starlight Requiem",
    genre: "Fantasy",
    tags: ["analysis", "finale", "spoilers"],
    author: "Mika Tan",
    featured: true,
    popularityScore: 92,
    releaseDate: "2026-08-14",
    imageUrl: "/images/stories/anime-rivalries.png",
    description: "Three seasons of clan lore pay off in a finale that rewards every rewatch.",
    body: "Starlight Requiem spent three seasons laying quiet foundations: a forbidden song, two rival clans and a heroine who never asked to carry either legacy.\n\n## The rivalry that became a bond\nThe show's smartest move was letting Kaede and Ren disagree for the right reasons. By the time they fight side by side, the audience has watched every argument that made the alliance possible.\n\n![The two rival clans face each other beneath the blood moon](/images/stories/anime-rivalries.png)\n\n## A soundtrack that tells the story\nComposer Aya Moriyama reprises the lullaby from episode one in the last five minutes. It is a small choice that turns the finale into a full-circle moment.\n\n> Every great finale is a promise the first episode made.\n\nIf you have not watched it yet, start from the beginning. The final arc only works because of everything that comes before it.",
    timeline: [
      { date: "2023-04", title: "Season 1 premieres", description: "The forbidden song is introduced." },
      { date: "2024-10", title: "Season 2: The Clan War", description: "Kaede and Ren become open rivals." },
      { date: "2026-07", title: "Final arc begins", description: "The blood moon rises over the capital." },
      { date: "2026-08", title: "Series finale", description: "The lullaby returns for the closing scene." },
    ],
  },
  {
    title: "Neon Drift 2: Everything We Know So Far",
    cat: "gaming",
    fandom: "Neon Drift",
    genre: "Racing",
    tags: ["preview", "news"],
    author: "Jordan Vale",
    featured: true,
    popularityScore: 85,
    releaseDate: "2026-06-02",
    imageUrl: "/images/trending/gaming-world.png",
    description: "New cities, a rebuilt physics engine and cross-play: the sequel's roadmap in one place.",
    body: "The first Neon Drift turned night-time street racing into a rhythm game. The sequel wants to turn it into a living city.\n\n## Three new districts\nThe reveal trailer showed a harbour district, a vertical market and a highway that loops through a stadium.\n\n## Physics, rebuilt\nThe studio confirmed a new handling model built with community racers who have logged thousands of hours in the original.\n\n![Neon-lit streets of the new city](/images/trending/gaming-world.png)\n\nCross-play between console and PC arrives at launch, with progression shared across platforms.",
    timeline: [
      { date: "2024-03", title: "Neon Drift launches", description: "The original becomes a surprise hit." },
      { date: "2026-06", title: "Sequel revealed", description: "First trailer at the summer showcase." },
      { date: "2027-02", title: "Planned release", description: "Console and PC, cross-play at launch." },
    ],
  },
  {
    title: "Pulse Nine's Comeback Choreography, Broken Down",
    cat: "kpop",
    fandom: "Pulse Nine",
    genre: "Pop",
    tags: ["dance", "comeback"],
    author: "Hana Seo",
    popularityScore: 78,
    releaseDate: "2026-09-05",
    imageUrl: "/images/trending/kpop-world.png",
    description: "The formation changes that make the chorus look effortless.",
    body: "Pulse Nine's comeback single is only three minutes long, but the choreography packs in eleven formation changes.\n\n## The chorus trick\nThe members stagger their arm waves by half a beat, which reads as one continuous ripple on camera.\n\n## Fan chant guide\nThe official fan chant lands on the post-chorus. Learn it before the tour starts in November.",
    timeline: [
      { date: "2026-08-20", title: "Teaser photos", description: "Concept images released." },
      { date: "2026-09-05", title: "Music video", description: "Comeback single goes live." },
      { date: "2026-11-12", title: "World tour", description: "First stop: Seoul." },
    ],
  },
  {
    title: "Beyond Earth Is the Space Epic We Needed",
    cat: "movies",
    fandom: "Beyond Earth",
    genre: "Sci-Fi",
    tags: ["review"],
    author: "Priya Nair",
    popularityScore: 70,
    releaseDate: "2025-12-19",
    imageUrl: "/images/trending/movies-world.png",
    description: "A grounded crew drama wrapped in a gorgeous sci-fi adventure.",
    body: "Beyond Earth follows a salvage crew who find a colony ship drifting past Neptune. What could have been a monster movie becomes a story about who gets to decide humanity's future.\n\n## Practical effects matter\nMost of the ship interiors were built as real sets, and it shows in every close-up.\n\n![A crew member looks out at the colony ship](/images/trending/movies-world.png)",
    timeline: [],
  },
  {
    title: "Inkbound Volume 12 Changes Everything",
    cat: "manga",
    fandom: "Inkbound",
    genre: "Mystery",
    tags: ["review", "spoilers"],
    author: "Kenji Arai",
    popularityScore: 64,
    releaseDate: "2025-05-10",
    imageUrl: "/images/stories/hidden-village.png",
    description: "The hidden village arc finally reveals who has been writing the cursed scrolls.",
    body: "Volume 12 closes the hidden village arc with a reveal that recontextualises the first chapter.\n\n## Rereading the clues\nThe ink stains on the scroll-keeper's sleeves were there from volume two.",
    timeline: [
      { date: "2021-01", title: "Serialisation begins", description: "" },
      { date: "2025-05", title: "Volume 12", description: "The hidden village arc concludes." },
    ],
  },
  {
    title: "Night Warden: A Beginner's Reading Order",
    cat: "comics",
    fandom: "Night Warden",
    genre: "Superhero",
    tags: ["guide"],
    author: "Sam Okafor",
    popularityScore: 58,
    releaseDate: "2024-11-01",
    imageUrl: "/images/stories/hidden-power.png",
    description: "Forty years of issues, trimmed down to the twelve that matter most.",
    body: "Night Warden has one of the longest runs in comics, which makes it intimidating. Start here.\n\n## Start with Year One\nThe origin miniseries is self-contained and sets up every major villain.\n\n## Then jump to The Long Dark\nThe 2012 run is where the modern version of the character was born.",
    timeline: [],
  },
  {
    title: "Building Foam Armour on a Budget",
    cat: "cosplay",
    fandom: "Alter Ego Guild",
    genre: "Tutorial",
    tags: ["guide", "crafting"],
    author: "Emma Wilson",
    popularityScore: 55,
    releaseDate: "2026-03-18",
    imageUrl: "/images/events/cosplay-championship.png",
    description: "EVA foam, contact cement and patience: a full armour build for under $60.",
    body: "Foam armour looks intimidating, but it only needs a few tools.\n\n## Materials\nTwo sheets of 10mm EVA foam, contact cement, a heat gun and a sharp blade.\n\n## Seal before you paint\nThree coats of flexible primer stop the paint from cracking when you move.",
    timeline: [],
  },
  {
    title: "Harbor Lights Season 3 Is Its Best Yet",
    cat: "tv-shows",
    fandom: "Harbor Lights",
    genre: "Drama",
    tags: ["review"],
    author: "Daniel Lee",
    popularityScore: 61,
    releaseDate: "2026-02-07",
    imageUrl: "/images/stories/journey-never-ends.png",
    description: "The small-town drama finally gives its supporting cast room to breathe.",
    body: "Harbor Lights has always been about a lighthouse keeper's family. Season 3 widens the lens to the whole town, and the show is better for it.",
    timeline: [],
  },
];

const MEDIA = [
  { title: "Starlight Requiem: Final Arc Trailer", cat: "anime", type: "trailer", fandom: "Starlight Requiem", genre: "Fantasy", tags: ["trailer", "finale"], duration: "0:15", popularityScore: 90, mediaUrl: `${MDN_CC0}/flower.mp4`, imageUrl: "/images/stories/anime-rivalries.png", releaseDate: "2026-07-01", description: "The blood moon rises. Official final arc trailer." },
  { title: "Neon Drift 2 Reveal Trailer", cat: "gaming", type: "trailer", fandom: "Neon Drift", genre: "Racing", tags: ["trailer", "reveal"], duration: "0:15", popularityScore: 88, mediaUrl: `${MDN_CC0}/friday.mp4`, imageUrl: "/images/trending/gaming-world.png", releaseDate: "2026-06-02", description: "First look at the new city districts." },
  { title: "Big Buck Bunny (Open Movie)", cat: "movies", type: "video", fandom: "Blender Open Movies", genre: "Comedy", tags: ["animation", "open-movie"], duration: "9:56", popularityScore: 74, mediaUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ", imageUrl: "/images/trending/movies-world.png", releaseDate: "2008-05-30", description: "The Blender Foundation's classic short, streamed via YouTube embed." },
  { title: "Sintel: Behind the Dragon", cat: "movies", type: "video", fandom: "Blender Open Movies", genre: "Fantasy", tags: ["animation", "open-movie"], duration: "14:48", popularityScore: 69, mediaUrl: `${COMMONS}/f/f1/Sintel_movie_4K.webm/Sintel_movie_4K.webm.480p.vp9.webm`, imageUrl: "/images/stories/hidden-power.png", releaseDate: "2010-09-27", description: "A lone warrior searches for her dragon in this open movie." },
  { title: "Open Movie Animation Explainer", cat: "movies", type: "explainer", fandom: "Blender Open Movies", genre: "Sci-Fi", tags: ["vfx", "explainer"], duration: "12:14", popularityScore: 52, mediaUrl: `${COMMONS}/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.vp9.webm`, imageUrl: "/images/trending/movie.jpg", releaseDate: "2014-11-10", description: "How the Blender Institute animates an open movie, shot by shot." },
  { title: "Neon Drift Original Soundtrack: Night Run", cat: "gaming", type: "audio", fandom: "Neon Drift", genre: "Electronic", tags: ["soundtrack", "ost"], duration: "6:12", popularityScore: 66, mediaUrl: `${SAMPLE_AUDIO}/SoundHelix-Song-1.mp3`, imageUrl: "/images/trending/gaming.jpg", releaseDate: "2024-03-20", description: "The track that plays during the harbour chase." },
  { title: "Fandom Weekly Podcast Ep. 12: Comeback Season", cat: "kpop", type: "audio", fandom: "Pulse Nine", genre: "Podcast", tags: ["podcast"], duration: "7:05", popularityScore: 58, mediaUrl: `${SAMPLE_AUDIO}/SoundHelix-Song-2.mp3`, imageUrl: "/images/trending/k-pop.jpg", releaseDate: "2026-09-10", description: "We react to Pulse Nine's comeback and preview the tour." },
  { title: "Lo-fi Lore: Manga Reading Ambience", cat: "manga", type: "audio", fandom: "Inkbound", genre: "Lo-fi", tags: ["ambience", "soundtrack"], duration: "5:44", popularityScore: 47, mediaUrl: `${SAMPLE_AUDIO}/SoundHelix-Song-3.mp3`, imageUrl: "/images/stories/hidden-village.png", releaseDate: "2025-01-15", description: "Soft beats for long reading sessions." },
  { title: "Cosplay Craft Diaries: Armour Timelapse", cat: "cosplay", type: "video", fandom: "Alter Ego Guild", genre: "Tutorial", tags: ["crafting", "timelapse"], duration: "0:15", popularityScore: 50, mediaUrl: `${MDN_CC0}/flower.mp4`, imageUrl: "/images/events/cosplay-championship.png", releaseDate: "2026-03-20", description: "A full foam armour build in fifteen seconds." },
];

const CHARACTERS = [
  { name: "Kaede Hoshino", alias: "The Moonlit Blade", cat: "anime", fandom: "Starlight Requiem", role: "Protagonist", power: 88, intelligence: 76, popularity: 95, tags: ["swordswoman", "clan heir"], imageUrl: "/images/trending/anime-world.png", bio: "Heir to the Hoshino clan who inherits a forbidden song that can end the clan war, or restart it." },
  { name: "Ren Kurogane", alias: "Iron Crow", cat: "anime", fandom: "Starlight Requiem", role: "Rival", power: 91, intelligence: 70, popularity: 89, tags: ["rival", "strategist"], imageUrl: "/images/stories/anime-rivalries.png", bio: "Kaede's rival from the Kurogane clan, raised to believe the song must never be sung." },
  { name: "Vex", alias: "Street Ghost", cat: "gaming", fandom: "Neon Drift", role: "Racer", power: 60, intelligence: 82, popularity: 84, tags: ["racer", "hacker"], imageUrl: "/images/trending/gaming.jpg", bio: "An underground racer who can map any city in a single night run." },
  { name: "Juno Park", alias: "Main Dancer", cat: "kpop", fandom: "Pulse Nine", role: "Performer", power: 55, intelligence: 74, popularity: 93, tags: ["dancer", "leader"], imageUrl: "/images/trending/k-pop.jpg", bio: "Pulse Nine's main dancer and choreographer of the comeback single." },
  { name: "Captain Idris Hale", alias: "", cat: "movies", fandom: "Beyond Earth", role: "Captain", power: 58, intelligence: 90, popularity: 72, tags: ["pilot"], imageUrl: "/images/trending/movies-world.png", bio: "Salvage captain who finds the drifting colony ship." },
  { name: "The Night Warden", alias: "Elias Crane", cat: "comics", fandom: "Night Warden", role: "Vigilante", power: 80, intelligence: 88, popularity: 81, tags: ["vigilante", "detective"], imageUrl: "/images/stories/hidden-power.png", bio: "A detective by day who guards the old city by night." },
  { name: "Sumi", alias: "Scroll-keeper", cat: "manga", fandom: "Inkbound", role: "Archivist", power: 45, intelligence: 95, popularity: 68, tags: ["mystery"], imageUrl: "/images/stories/hidden-village.png", bio: "The quiet archivist of the hidden village, who knows more than she says." },
  { name: "Mara Voss", alias: "Lighthouse Keeper", cat: "tv-shows", fandom: "Harbor Lights", role: "Lead", power: 30, intelligence: 84, popularity: 70, tags: ["drama"], imageUrl: "/images/stories/journey-never-ends.png", bio: "Keeper of the harbour lighthouse and the town's reluctant peacemaker." },
  { name: "Nova", alias: "Guild Founder", cat: "cosplay", fandom: "Alter Ego Guild", role: "Cosplayer", power: 40, intelligence: 78, popularity: 66, tags: ["armour", "props"], imageUrl: "/images/events/cosplay-championship.png", bio: "Award-winning armour builder who runs free workshops for new cosplayers." },
];

const MERCH = [
  { name: "Starlight Requiem Clan Hoodie", cat: "anime", fandom: "Starlight Requiem", productType: "Apparel", price: 69.99, oldPrice: 84.99, rating: 4.8, reviews: 214, tag: "Best Seller", imageUrl: "/images/shop/anime-hoodie.png", description: "Heavyweight hoodie with the Hoshino clan crest." },
  { name: "Vex 1/7 Scale Figure", cat: "gaming", fandom: "Neon Drift", productType: "Figures", price: 84.99, oldPrice: 0, rating: 4.9, reviews: 96, tag: "Limited Edition", imageUrl: "/images/shop/cyber-warrior-figure.png", description: "Numbered run of 2,000 with light-up base." },
  { name: "Inkbound Collector Box Set", cat: "manga", fandom: "Inkbound", productType: "Manga", price: 59.99, oldPrice: 72.0, rating: 4.7, reviews: 158, tag: "Collectible", imageUrl: "/images/shop/manga-box-set.png", description: "Volumes 1 to 12 with an exclusive art card." },
  { name: "Neon City Poster Set", cat: "gaming", fandom: "Neon Drift", productType: "Posters", price: 24.99, oldPrice: 0, rating: 4.5, reviews: 61, tag: "New", imageUrl: "/images/shop/neon-poster-set.png", description: "Three A2 prints of the new city districts." },
  { name: "Fandom Accessories Pack", cat: "cosplay", fandom: "Alter Ego Guild", productType: "Accessories", price: 19.99, oldPrice: 0, rating: 4.4, reviews: 43, tag: "New", imageUrl: "/images/shop/accessories-pack.png", description: "Pins, lanyard and charms for convention season." },
  { name: "Collector Mystery Box", cat: "anime", fandom: "Starlight Requiem", productType: "Collectibles", price: 99.99, oldPrice: 0, rating: 4.6, reviews: 120, tag: "Collectible", imageUrl: "/images/shop/mystery-box.png", description: "A surprise mix of figures, prints and exclusives." },
  { name: "Pulse Nine Official Lightstick v2", cat: "kpop", fandom: "Pulse Nine", productType: "Accessories", price: 49.99, oldPrice: 0, rating: 0, reviews: 0, tag: "Pre-Order", isUpcoming: true, releaseDate: "2026-11-01", imageUrl: "/images/trending/kpop-world.png", description: "Bluetooth-synced lightstick for the world tour." },
  { name: "Neon Drift 2 Collector's Edition", cat: "gaming", fandom: "Neon Drift", productType: "Collectibles", price: 129.99, oldPrice: 0, rating: 0, reviews: 0, tag: "Pre-Order", isUpcoming: true, releaseDate: "2027-02-14", imageUrl: "/images/trending/gaming-world.png", description: "Steelbook, art book and a die-cast car." },
];

const EVENTS = [
  { name: "Anime Universe Convention", cat: "anime", eventType: "Convention", date: "2026-10-17", time: "10:00 AM", venue: "Expo Centre", address: "University Road", city: "Karachi", country: "Pakistan", latitude: 24.9056, longitude: 67.0822, capacity: "12,000", ticketUrl: "https://example.com/tickets/anime-universe", imageUrl: "/images/events/anime-convention.png", description: "Two days of panels, screenings and artist alley.", highlight: "" },
  { name: "Cosplay Championship Finals", cat: "cosplay", eventType: "Convention", date: "2026-11-08", time: "2:00 PM", venue: "Expo Centre Hall 3", address: "Abdul Haq Road", city: "Lahore", country: "Pakistan", latitude: 31.4697, longitude: 74.2728, capacity: "4,500", ticketUrl: "https://example.com/tickets/cosplay-finals", imageUrl: "/images/events/cosplay-championship.png", description: "The country's best cosplayers compete for the national title.", highlight: "" },
  { name: "Pulse Nine World Tour: Seoul", cat: "kpop", eventType: "Concert", date: "2026-11-12", time: "7:00 PM", venue: "KSPO Dome", address: "Olympic Park", city: "Seoul", country: "South Korea", latitude: 37.5197, longitude: 127.1276, capacity: "15,000", ticketUrl: "https://example.com/tickets/pulse-nine-seoul", imageUrl: "/images/events/kpop-festival.png", description: "Opening night of the comeback world tour.", highlight: "" },
  { name: "Neon Drift Community Tournament", cat: "gaming", eventType: "Tournament", date: "2026-12-05", time: "12:00 PM", venue: "Dubai Esports Arena", address: "Business Bay", city: "Dubai", country: "UAE", latitude: 25.1857, longitude: 55.2653, capacity: "2,000", ticketUrl: "https://example.com/tickets/neon-drift-cup", imageUrl: "/images/events/gaming-tournament.png", description: "Open bracket time-trial tournament with live commentary.", highlight: "" },
  { name: "Manga & Comic Expo", cat: "manga", eventType: "Convention", date: "2027-01-23", time: "11:00 AM", venue: "Tokyo Big Sight", address: "Ariake", city: "Tokyo", country: "Japan", latitude: 35.6298, longitude: 139.7942, capacity: "30,000", ticketUrl: "https://example.com/tickets/manga-expo", imageUrl: "/images/events/manga-comic-expo.png", description: "Publishers, creators and exclusive first-print volumes.", highlight: "" },
  { name: "Beyond Earth Fan Screening", cat: "movies", eventType: "Screening", date: "2026-10-30", time: "8:30 PM", venue: "Nueplex Cinemas", address: "DHA Phase 8", city: "Karachi", country: "Pakistan", latitude: 24.7922, longitude: 67.0651, capacity: "300", ticketUrl: "https://example.com/tickets/beyond-earth", imageUrl: "/images/trending/movie.jpg", description: "Fan screening with a costume contest before the film.", highlight: "" },
  { name: "Fan Community Summer Meetup", cat: "anime", eventType: "Meetup", date: "2026-07-19", time: "4:00 PM", venue: "Frere Hall Gardens", address: "Fatima Jinnah Road", city: "Karachi", country: "Pakistan", latitude: 24.8474, longitude: 67.0329, capacity: "400", ticketUrl: "", imageUrl: "/images/events/fan-community-meetup.png", description: "An afternoon of trading, sketching and snacks.", highlight: "Over 400 fans showed up to our first summer meetup. The sketch wall filled up in an hour and the card-trading corner ran until sunset." },
  { name: "Starlight Requiem Finale Premiere", cat: "anime", eventType: "Premiere", date: "2026-08-14", time: "9:00 PM", venue: "Cinepax Ocean Mall", address: "Clifton", city: "Karachi", country: "Pakistan", latitude: 24.8266, longitude: 67.0336, capacity: "250", ticketUrl: "", imageUrl: "/images/stories/anime-rivalries.png", description: "Live premiere screening of the series finale.", highlight: "The whole theatre sang the lullaby along with Kaede in the final scene. Easily our most emotional premiere yet." },
];

const RELEASES = [
  { title: "Starlight Requiem: The Movie", cat: "anime", releaseType: "Anime", fandom: "Starlight Requiem", releaseDate: "2027-03-20", platform: "Cinemas", tag: "Announced", imageUrl: "/images/stories/anime-rivalries.png", description: "The story continues after the finale." },
  { title: "Neon Drift 2", cat: "gaming", releaseType: "Game", fandom: "Neon Drift", releaseDate: "2027-02-14", platform: "PC, PS5, Xbox", tag: "Pre-Order", imageUrl: "/images/trending/gaming-world.png", description: "The sequel with three new districts and cross-play." },
  { title: "Beyond Earth II", cat: "movies", releaseType: "Movie", fandom: "Beyond Earth", releaseDate: "2027-06-11", platform: "Cinemas", tag: "Announced", imageUrl: "/images/trending/movies-world.png", description: "The salvage crew returns." },
  { title: "Harbor Lights Season 4", cat: "tv-shows", releaseType: "TV Show", fandom: "Harbor Lights", releaseDate: "2027-01-09", platform: "Streaming", tag: "Confirmed", imageUrl: "/images/stories/journey-never-ends.png", description: "Ten new episodes." },
  { title: "Night Warden #500", cat: "comics", releaseType: "Comic", fandom: "Night Warden", releaseDate: "2026-11-25", platform: "Print & Digital", tag: "Collectible", imageUrl: "/images/stories/hidden-power.png", description: "Landmark anniversary issue with variant covers." },
  { title: "Inkbound Volume 13", cat: "manga", releaseType: "Manga", fandom: "Inkbound", releaseDate: "2026-10-28", platform: "Print", tag: "Pre-Order", imageUrl: "/images/stories/hidden-village.png", description: "A new arc begins." },
  { title: "Pulse Nine: Second Full Album", cat: "kpop", releaseType: "K-Pop", fandom: "Pulse Nine", releaseDate: "2027-01-30", platform: "Streaming & CD", tag: "Announced", imageUrl: "/images/trending/k-pop.jpg", description: "Twelve tracks including the comeback single." },
  { title: "Pulse Nine Lightstick v2 Drop", cat: "kpop", releaseType: "Merchandise", fandom: "Pulse Nine", releaseDate: "2026-11-01", platform: "Official store", tag: "Limited Edition", imageUrl: "/images/trending/kpop-world.png", description: "Tour lightstick, limited first batch." },
];

const FAQS = [
  { category: "Account", question: "How do I create an account?", answer: "Click \"Join Hub\" in the top-right corner, fill in your name, email and password, pick your favourite fandoms and you're in.", keywords: ["register", "signup", "sign", "join", "account", "create"] },
  { category: "Account", question: "How do I reset my password?", answer: "On the login page click \"Forgot password?\", enter your email and we'll send you a secure reset link that's valid for 30 minutes.", keywords: ["reset", "forgot", "password", "recover"] },
  { category: "Account", question: "How do I change my profile picture or favourite fandoms?", answer: "Open your Dashboard > Profile. You can upload an avatar, edit your display name and bio, and choose your favourite fandoms there.", keywords: ["profile", "avatar", "picture", "photo", "favourite", "favorite", "fandoms"] },
  { category: "Content", question: "How do I bookmark an article?", answer: "Open any article, character, video, event or merch item and click the bookmark icon. Everything you save appears in Dashboard > Bookmarks, where you can also add a personal note.", keywords: ["bookmark", "save", "saved", "favourite"] },
  { category: "Content", question: "How do I submit fan content?", answer: "Go to Dashboard > Submissions, click \"New submission\", add a title, category and your content. An admin reviews it and, once approved, it's published on the Stories page.", keywords: ["submit", "submission", "fan", "write", "publish", "article"] },
  { category: "Content", question: "How do I rate videos and articles?", answer: "Log in, open a video in the Multimedia Center or any article, and click the stars (1 to 5). You can change your rating at any time.", keywords: ["rate", "rating", "stars", "review"] },
  { category: "Content", question: "How do I search and filter content?", answer: "Use the Explore page. Search by keyword, then filter by category, content type, genre, release year and popularity, and sort by latest, most popular or A-Z. Genre, year and popularity filters are available once you log in.", keywords: ["search", "filter", "find", "sort", "explore"] },
  { category: "Events", question: "How do I find events near me?", answer: "On the Events page, click \"Use my location\" and allow location access. The map shows events around you and the list is sorted by distance. You can also filter the calendar by city.", keywords: ["near", "nearby", "location", "map", "gps", "city"] },
  { category: "Events", question: "Where can I buy event tickets?", answer: "Each event page has a \"Get tickets\" button that links to the organiser's official ticketing site.", keywords: ["ticket", "tickets", "booking", "entry"] },
  { category: "Merchandise", question: "Can I buy the merchandise shown?", answer: "The merchandise showcase is for discovery only. FanHub+ doesn't sell products or take payments, but you can bookmark items to keep track of them.", keywords: ["buy", "purchase", "order", "checkout", "price", "merch", "merchandise", "shop", "product", "hoodie", "figure", "poster", "lightstick", "cart"] },
  { category: "General", question: "How do I make text bigger or switch to light mode?", answer: "Use the \"T\" button in the navigation bar to change the text size; logged-in users keep it across devices. The dark/light theme is set by the administrators for the whole site.", keywords: ["dark", "light", "theme", "mode", "font", "text", "size", "accessibility"] },
  { category: "General", question: "How do I report a bug or send feedback?", answer: "Head to the Contact page, choose Bug, Suggestion or Query and fill in the form. Bug reports ask a few extra questions to help us fix things faster.", keywords: ["bug", "report", "feedback", "contact", "suggestion", "problem", "issue"] },
];

async function insertMissing(Model, key, items, build) {
  let added = 0;
  for (const item of items) {
    const exists = await Model.exists({ [key]: item[key] });
    if (!exists) {
      await Model.create(build(item));
      added += 1;
    }
  }
  console.log(`  ${Model.modelName}: ${added} added`);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Seeding ${mongoose.connection.name}...`);

  await seedUsers();
  const cats = await seedCategories();
  const withCategory = ({ cat, ...rest }) => ({ ...rest, category: cats[cat] });

  await insertMissing(Content, "title", ARTICLES, (a) => ({ ...withCategory(a), type: "article", status: "published", views: a.popularityScore * 3 }));
  await insertMissing(Content, "title", MEDIA, (m) => ({ ...withCategory(m), status: "published", views: m.popularityScore * 2 }));
  await insertMissing(Character, "name", CHARACTERS, withCategory);
  await insertMissing(Merchandise, "name", MERCH, withCategory);
  await insertMissing(Event, "name", EVENTS, withCategory);
  await insertMissing(Release, "title", RELEASES, withCategory);
  await insertMissing(Faq, "question", FAQS, (f) => f);
  await Settings.getSingleton();

  console.log("Done.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
