-- CreateTable: activity_tags
CREATE TABLE "activity_tags" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_tags_pkey" PRIMARY KEY ("id")
);

-- AlterTable: types_enseignement — add activity_tag_id FK
ALTER TABLE "types_enseignement" ADD COLUMN "activity_tag_id" UUID;

ALTER TABLE "types_enseignement"
    ADD CONSTRAINT "types_enseignement_activity_tag_id_fkey"
    FOREIGN KEY ("activity_tag_id") REFERENCES "activity_tags"("id") ON DELETE SET NULL;

-- CreateIndex : unicité du code
CREATE UNIQUE INDEX "activity_tags_code_key" ON "activity_tags"("code");

-- CreateIndex : performance sur isActive
CREATE INDEX "activity_tags_isActive_idx" ON "activity_tags"("isActive");