-- AlterTable: Replace examFee/otherFee/transportFee layout with registrationFee and sportsFee
ALTER TABLE "FeeStructure" ADD COLUMN IF NOT EXISTS "registrationFee" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "FeeStructure" ADD COLUMN IF NOT EXISTS "sportsFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Drop removed columns (examFee, otherFee)
ALTER TABLE "FeeStructure" DROP COLUMN IF EXISTS "examFee";
ALTER TABLE "FeeStructure" DROP COLUMN IF EXISTS "otherFee";

-- Recalculate totalFee for existing records
UPDATE "FeeStructure"
SET "totalFee" = "registrationFee" + "tuitionFee" + "sportsFee" + "booksFee" + "uniformFee" + "transportFee";
