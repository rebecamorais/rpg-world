import { SupabaseClient } from '@supabase/supabase-js';

import { PartyContext } from './application/PartyContext';
import { AcceptMemberUseCase } from './application/accept-member.use-case';
import { CreatePartyUseCase } from './application/create-party.use-case';
import { DeletePartyUseCase } from './application/delete-party.use-case';
import { GetInviteUseCase } from './application/get-invite.use-case';
import { InviteByUsernameUseCase } from './application/invite-by-username.use-case';
import { ListMyPartiesUseCase } from './application/list-my-parties.use-case';
import { RemoveMemberUseCase } from './application/remove-member.use-case';
import { RenamePartyUseCase } from './application/rename-party.use-case';
import { RequestJoinUseCase } from './application/request-join.use-case';
import { RotateInviteCodeUseCase } from './application/rotate-invite-code.use-case';
import { SupabasePartyRepository } from './infrastructure/supabase-party.repository';

export type { PartyContext };

export const createPartyContext = (dbClient: SupabaseClient): PartyContext => {
  const repository = new SupabasePartyRepository(dbClient);

  const listMyParties = new ListMyPartiesUseCase(repository);
  const createParty = new CreatePartyUseCase(repository);
  const renameParty = new RenamePartyUseCase(repository);
  const deleteParty = new DeletePartyUseCase(repository);
  const rotateInviteCode = new RotateInviteCodeUseCase(repository);
  const getInvite = new GetInviteUseCase(repository);
  const requestJoin = new RequestJoinUseCase(repository);
  const inviteByUsername = new InviteByUsernameUseCase(repository);
  const acceptMember = new AcceptMemberUseCase(repository);
  const removeMember = new RemoveMemberUseCase(repository);

  return {
    listMine: listMyParties.execute.bind(listMyParties),
    create: createParty.execute.bind(createParty),
    rename: renameParty.execute.bind(renameParty),
    delete: deleteParty.execute.bind(deleteParty),
    rotateInviteCode: rotateInviteCode.execute.bind(rotateInviteCode),
    getInvite: getInvite.execute.bind(getInvite),
    requestJoin: requestJoin.execute.bind(requestJoin),
    inviteByUsername: inviteByUsername.execute.bind(inviteByUsername),
    acceptMember: acceptMember.execute.bind(acceptMember),
    removeMember: removeMember.execute.bind(removeMember),
  };
};
