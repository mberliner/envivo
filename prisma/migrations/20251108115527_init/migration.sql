-- CreateTable
CREATE TABLE "global_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "allowedCountries" TEXT NOT NULL DEFAULT '["AR"]',
    "allowedCities" TEXT NOT NULL DEFAULT '["Buenos Aires","Ciudad de Buenos Aires","CABA"]',
    "allowedGenres" TEXT NOT NULL DEFAULT '["Rock","Pop","Jazz","Metal"]',
    "blockedGenres" TEXT NOT NULL DEFAULT '[]',
    "allowedCategories" TEXT NOT NULL DEFAULT '["Concierto","Festival","Teatro"]',
    "allowedVenueSizes" TEXT NOT NULL DEFAULT '["small","medium","large"]',
    "venueSizeThresholds" TEXT NOT NULL DEFAULT '{"small":500,"medium":2000,"large":5000}',
    "needsRescraping" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    "updatedBy" TEXT
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "endDate" DATETIME,
    "venueId" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "genre" TEXT,
    "imageUrl" TEXT,
    "ticketUrl" TEXT,
    "price" REAL,
    "priceMax" REAL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "events_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "capacity" INTEGER
);

-- CreateTable
CREATE TABLE "artists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "genre" TEXT,
    "imageUrl" TEXT
);

-- CreateTable
CREATE TABLE "event_artists" (
    "eventId" TEXT NOT NULL,
    "artistId" TEXT NOT NULL,

    PRIMARY KEY ("eventId", "artistId"),
    CONSTRAINT "event_artists_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "event_artists_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "artists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "venue_metadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "capacity" INTEGER,
    "source" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateIndex
CREATE INDEX "events_city_idx" ON "events"("city");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");

-- CreateIndex
CREATE INDEX "events_country_idx" ON "events"("country");

-- CreateIndex
CREATE INDEX "venues_city_idx" ON "venues"("city");

-- CreateIndex
CREATE INDEX "venues_name_city_idx" ON "venues"("name", "city");

-- CreateIndex
CREATE UNIQUE INDEX "artists_name_key" ON "artists"("name");

-- CreateIndex
CREATE INDEX "venue_metadata_name_city_idx" ON "venue_metadata"("name", "city");

-- CreateIndex
CREATE UNIQUE INDEX "venue_metadata_name_city_country_key" ON "venue_metadata"("name", "city", "country");
