-- CreateTable
CREATE TABLE "Member" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Reward" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RedemptionCode" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "rewardId" UUID NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMPTZ(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "RedemptionCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Redemption" (
    "id" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "codeId" UUID NOT NULL,
    "rewardId" UUID NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");
CREATE UNIQUE INDEX "RedemptionCode_code_key" ON "RedemptionCode"("code");
CREATE UNIQUE INDEX "Redemption_memberId_codeId_key" ON "Redemption"("memberId", "codeId");
CREATE UNIQUE INDEX "Redemption_memberId_idempotencyKey_key" ON "Redemption"("memberId", "idempotencyKey");
CREATE INDEX "Redemption_memberId_createdAt_id_idx" ON "Redemption"("memberId", "createdAt" DESC, "id" DESC);

ALTER TABLE "RedemptionCode" ADD CONSTRAINT "RedemptionCode_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "RedemptionCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
