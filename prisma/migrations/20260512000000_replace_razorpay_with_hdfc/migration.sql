-- AlterTable: rename razorpayPaymentId to hdfcOrderId
ALTER TABLE "Payment" RENAME COLUMN "razorpayPaymentId" TO "hdfcOrderId";
