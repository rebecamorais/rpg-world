import { redirect } from 'next/navigation';

/** The NPCs used to be "enemy sheets" here; old links land on the NPCs tab. */
export default function EnemiesPage() {
  redirect('/characters/npcs');
}
