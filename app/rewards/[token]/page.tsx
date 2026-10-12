import { RewardStatus } from "@/components/reward-status";
export const metadata = { title: "My reward | SmartBiz", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function RewardPage({ params }: { params: Promise<{ token: string }> }) {
  return <RewardStatus token={(await params).token} />;
}
