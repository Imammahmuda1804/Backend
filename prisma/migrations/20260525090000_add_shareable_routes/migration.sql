-- CreateTable
CREATE TABLE "routes" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created_by_user_id" INTEGER,
    "is_admin_curated" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "share_slug" TEXT NOT NULL,
    "city" TEXT,
    "total_distance_km" DOUBLE PRECISION,
    "estimated_duration_minutes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_stops" (
    "id" SERIAL NOT NULL,
    "route_id" INTEGER NOT NULL,
    "destination_id" INTEGER NOT NULL,
    "stop_order" INTEGER NOT NULL,
    "distance_from_previous_km" DOUBLE PRECISION,
    "distance_to_next_km" DOUBLE PRECISION,
    "note" TEXT,
    "estimated_visit_minutes" INTEGER,

    CONSTRAINT "route_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_routes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "route_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_routes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "routes_share_slug_key" ON "routes"("share_slug");

-- CreateIndex
CREATE INDEX "routes_created_by_user_id_idx" ON "routes"("created_by_user_id");

-- CreateIndex
CREATE INDEX "routes_visibility_idx" ON "routes"("visibility");

-- CreateIndex
CREATE INDEX "routes_is_admin_curated_idx" ON "routes"("is_admin_curated");

-- CreateIndex
CREATE INDEX "routes_city_idx" ON "routes"("city");

-- CreateIndex
CREATE UNIQUE INDEX "route_stops_route_id_destination_id_key" ON "route_stops"("route_id", "destination_id");

-- CreateIndex
CREATE INDEX "route_stops_route_id_idx" ON "route_stops"("route_id");

-- CreateIndex
CREATE INDEX "route_stops_destination_id_idx" ON "route_stops"("destination_id");

-- CreateIndex
CREATE INDEX "route_stops_stop_order_idx" ON "route_stops"("stop_order");

-- CreateIndex
CREATE UNIQUE INDEX "saved_routes_user_id_route_id_key" ON "saved_routes"("user_id", "route_id");

-- CreateIndex
CREATE INDEX "saved_routes_user_id_idx" ON "saved_routes"("user_id");

-- CreateIndex
CREATE INDEX "saved_routes_route_id_idx" ON "saved_routes"("route_id");

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_destination_id_fkey" FOREIGN KEY ("destination_id") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_routes" ADD CONSTRAINT "saved_routes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_routes" ADD CONSTRAINT "saved_routes_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
