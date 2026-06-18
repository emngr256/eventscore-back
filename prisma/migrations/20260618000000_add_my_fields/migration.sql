-- AlterTable
ALTER TABLE "events" ADD COLUMN     "announcement_url" TEXT,
ADD COLUMN     "certificate_bottom_padding" INTEGER DEFAULT 32,
ADD COLUMN     "certificate_content_padding" INTEGER DEFAULT 48,
ADD COLUMN     "certificate_overlay_opacity" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "certificate_template_url" TEXT,
ADD COLUMN     "certificate_text_color" TEXT DEFAULT '#78350f',
ADD COLUMN     "certificate_text_size" DOUBLE PRECISION DEFAULT 1.0,
ADD COLUMN     "certificate_top_padding" INTEGER DEFAULT 32,
ADD COLUMN     "social_post_url" TEXT;

-- AlterTable
ALTER TABLE "scores" DROP COLUMN "comment";

-- CreateTable
CREATE TABLE "jury_comments" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submission_id" TEXT NOT NULL,
    "jury_id" TEXT NOT NULL,

    CONSTRAINT "jury_comments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "jury_comments" ADD CONSTRAINT "jury_comments_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jury_comments" ADD CONSTRAINT "jury_comments_jury_id_fkey" FOREIGN KEY ("jury_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
