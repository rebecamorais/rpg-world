import { SupabaseClient } from '@supabase/supabase-js';

import { ConditionCatalog } from '@backend/contexts/conditions/domain/condition';

import { CombatContext } from './application/CombatContext';
import { AddParticipantUseCase } from './application/add-participant.use-case';
import { ChangeConditionUseCase } from './application/change-condition.use-case';
import { EncounterCommands } from './application/encounter-commands';
import { GetEncounterUseCase } from './application/get-encounter.use-case';
import { SetConditionsUseCase } from './application/set-conditions.use-case';
import { UpdateParticipantUseCase } from './application/update-participant.use-case';
import { SupabaseCombatRepository } from './infrastructure/supabase-combat.repository';

export type { CombatContext };

export const createCombatContext = (
  dbClient: SupabaseClient,
  catalog: ConditionCatalog,
): CombatContext => {
  const repository = new SupabaseCombatRepository(dbClient);

  const getEncounter = new GetEncounterUseCase(repository);
  const addParticipant = new AddParticipantUseCase(repository);
  const updateParticipant = new UpdateParticipantUseCase(repository);
  const setConditions = new SetConditionsUseCase(repository, catalog);
  const changeCondition = new ChangeConditionUseCase(repository, catalog);
  const commands = new EncounterCommands(repository);

  return {
    get: getEncounter.execute.bind(getEncounter),
    addParticipant: addParticipant.execute.bind(addParticipant),
    updateParticipant: updateParticipant.execute.bind(updateParticipant),
    setConditions: setConditions.execute.bind(setConditions),
    changeCondition: changeCondition.execute.bind(changeCondition),
    create: commands.create.bind(commands),
    removeParticipant: commands.removeParticipant.bind(commands),
    setOrder: commands.setOrder.bind(commands),
    start: commands.start.bind(commands),
    endTurn: commands.endTurn.bind(commands),
    previousTurn: commands.previousTurn.bind(commands),
    setMyInitiative: commands.setMyInitiative.bind(commands),
    finish: commands.finish.bind(commands),
  };
};
