# Voting dapp project

Project written by Solidity v0.8.7  

Voting.sol functions:
- addVoting() - add voting. Only the owner can do this
- getVoting(id) - get voting information by id
- vote(id, address) - vote for a candidate in the voting
- closeVoting(id) - close the voting by id. This can be closed after 3 days. Winners take eth and the owner gets a commission of 10%
- showCommission() - the owner can see commission from all closed votings
- withdrawCommission() - the owner can take the commission

Deploy on rinkeby
```shell
npm run deploy
```

Test
```shell
npm run test
```
