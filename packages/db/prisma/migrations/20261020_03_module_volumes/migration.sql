-- CreateTable: module_volumes (L2-01)
CREATE TABLE "module_volumes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "moduleId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "volume" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_volumes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "module_volumes_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules"("id") ON DELETE CASCADE
);

-- Uniqueness on (module, type)
CREATE UNIQUE INDEX "module_volumes_moduleId_type_key" ON "module_volumes"("moduleId", "type");

-- Index for lookups by module
CREATE INDEX "module_volumes_moduleId_idx" ON "module_volumes"("moduleId");;