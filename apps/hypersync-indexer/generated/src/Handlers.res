  @genType
module ENSGovernor = {
  module ProposalCreated = Types.MakeRegister(Types.ENSGovernor.ProposalCreated)
  module VoteCast = Types.MakeRegister(Types.ENSGovernor.VoteCast)
  module ProposalCanceled = Types.MakeRegister(Types.ENSGovernor.ProposalCanceled)
  module ProposalExecuted = Types.MakeRegister(Types.ENSGovernor.ProposalExecuted)
  module ProposalQueued = Types.MakeRegister(Types.ENSGovernor.ProposalQueued)
}

  @genType
module ENSToken = {
  module Transfer = Types.MakeRegister(Types.ENSToken.Transfer)
  module DelegateChanged = Types.MakeRegister(Types.ENSToken.DelegateChanged)
  module DelegateVotesChanged = Types.MakeRegister(Types.ENSToken.DelegateVotesChanged)
}

@genType /** Register a Block Handler. It'll be called for every block by default. */
let onBlock: (
  Envio.onBlockOptions<Types.chain>,
  Envio.onBlockArgs<Types.handlerContext> => promise<unit>,
) => unit = (
  EventRegister.onBlock: (unknown, Internal.onBlockArgs => promise<unit>) => unit
)->Utils.magic
