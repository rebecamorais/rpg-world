import { PartyChestPage } from '@frontend/components/party/PartyChestPage';
import { DEMO_PARTY_ID } from '@frontend/demo/ids';

export default function DemoChestRoute() {
  return <PartyChestPage partyId={DEMO_PARTY_ID} />;
}
