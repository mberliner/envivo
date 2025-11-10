-- CreateTable
CREATE TABLE "event_blacklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "event_blacklist_source_externalId_key" ON "event_blacklist"("source", "externalId");

-- CreateIndex
CREATE INDEX "event_blacklist_source_externalId_idx" ON "event_blacklist"("source", "externalId");
