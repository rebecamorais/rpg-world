import { PartyPage } from '@frontend/components/party/PartyPage';
import { DEMO_PARTY_ID } from '@frontend/demo/ids';

export default function DemoPartyRoute() {
  return <PartyPage partyId={DEMO_PARTY_ID} />;
}
