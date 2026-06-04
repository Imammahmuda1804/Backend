-- CreateTable
CREATE TABLE "saved_route_progress" (
    "id" SERIAL NOT NULL,
    "saved_route_id" INTEGER NOT NULL,
    "route_stop_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "visited_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_route_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saved_route_progress_saved_route_id_route_stop_id_key" ON "saved_route_progress"("saved_route_id", "route_stop_id");

-- CreateIndex
CREATE INDEX "saved_route_progress_saved_route_id_idx" ON "saved_route_progress"("saved_route_id");

-- CreateIndex
CREATE INDEX "saved_route_progress_route_stop_id_idx" ON "saved_route_progress"("route_stop_id");

-- AddForeignKey
ALTER TABLE "saved_route_progress" ADD CONSTRAINT "saved_route_progress_saved_route_id_fkey" FOREIGN KEY ("saved_route_id") REFERENCES "saved_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_route_progress" ADD CONSTRAINT "saved_route_progress_route_stop_id_fkey" FOREIGN KEY ("route_stop_id") REFERENCES "route_stops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
