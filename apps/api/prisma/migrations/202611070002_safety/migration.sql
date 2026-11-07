-- Protect Supabase's exposed public schema. No Data API policies are granted.
ALTER TABLE "Member" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reward" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RedemptionCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Redemption" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "RedemptionCode"
  ADD CONSTRAINT "RedemptionCode_maxUses_positive" CHECK ("maxUses" > 0),
  ADD CONSTRAINT "RedemptionCode_usedCount_nonnegative" CHECK ("usedCount" >= 0),
  ADD CONSTRAINT "RedemptionCode_usedCount_within_limit" CHECK ("usedCount" <= "maxUses");
