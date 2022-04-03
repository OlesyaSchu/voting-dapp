const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Votings', function () {
  let Votings;
  let votings;
  let Alise, Bob, Carrie, David, Elisabeth;

  async function setup() {
    await votings.addVoting();
  }

  const timestamp = Math.trunc(+new Date/1000) + 60*60*24*4

  async function commissionSetup() {
    await votings.addVoting();
    await votings.vote(0, Bob.address, { value: ethers.utils.parseEther("0.01") })
    await votings.connect(Bob).vote(0, Alise.address, { value: ethers.utils.parseEther("0.01") })
    return votings.closeVoting(0, { timestamp })
  }

  beforeEach(async function () {
    [Alise, Bob, Carrie, David, Elisabeth] = await ethers.getSigners();

    // Alise is the owner of the contract
    Votings = await ethers.getContractFactory("Votings", Alise);

    votings = await Votings.deploy();
  });
  describe('Deployment', function () {
    it("Contract deployed", async function () {
      expect(await votings.owner()).to.equal(Alise.address);
      expect(await votings.votingId()).to.equal(0);
      expect(await votings.showCommission()).to.equal(0);
    })
  })

  describe('Add voting', function () {
    it('owner adds first voting', async function () {
      setup();
      const voting = await votings.getVoting(0);
      expect(voting.id).to.equal(0);
      expect(voting.created.toNumber()).be.closeTo(+new Date()/1000, 10);
      expect(voting.completed).to.equal(false);
      expect(voting.candidates).to.equal(0);
      expect(voting.budget).to.equal(0);
      expect(await votings.votingId()).to.equal(1);
    })
    it('not owner adds votings', async function () {
      await expect(votings.connect(Bob).addVoting()).to.be.reverted
    })
    it('second voting is added', async function () {
      setup();
      await votings.addVoting();
      const voting = await votings.getVoting(1);
      expect(voting.id).to.equal(1);
      expect(voting.created.toNumber()).be.closeTo(+new Date()/1000, 10);
      expect(voting.completed).to.equal(false);
      expect(voting.candidates).to.equal(0);
      expect(voting.budget).to.equal(0);
      expect(await votings.votingId()).to.equal(2);
    })
  })

  describe('Get voting', function () {
    beforeEach(async function() {
      setup();
    })
    it('get voting by existing id', async function () {
      const voting = await votings.getVoting(0);
      expect(voting.id).to.equal(0);
    })
    it('get voting by id that not exist', async function () {
      await expect(votings.getVoting(10)).to.be.reverted
    })
    it('get voting without id', async function () {
      await expect(votings.getVoting()).to.be.reverted
    })
  })

  describe('Vote', function () {
    it('vote by existing id and address', async function () {
      setup()
      await votings.vote(0, Bob.address, { value: ethers.utils.parseEther("0.01") })
      const voting = await votings.getVoting(0);
      expect(voting.candidates).to.equal(1);
      expect(voting.budget).to.equal("10000000000000000");
    })
    it('vote by id that not exist', async function () {
      setup()
      await expect(votings.vote(10, Bob.address, { value: ethers.utils.parseEther("0.01") })).to.be.reverted
    })
    it('vote by address that not exist', async function () {
      setup()
      await expect(votings.vote(0, 'abcdef', { value: ethers.utils.parseEther("0.01") })).to.be.reverted
    })
    it('vote when voting already completed', async function () {
      setup()
      votings.vote(0, Bob.address, { value: ethers.utils.parseEther("0.01") })
      votings.closeVoting(0, { timestamp: Math.trunc(+new Date/1000) + 60*60*24*3 })
      await expect(votings.connect(Bob).vote(0, Alise.address, { value: ethers.utils.parseEther("0.01"), timestamp: Math.trunc(+new Date/1000) + 60*60*24*4 })).to.be.reverted
    })
    it('vote without ether', async function () {
      setup()
      await expect(votings.vote(0, Bob.address)).to.be.reverted
    })
    it('vote for yourself', async function () {
      setup()
      await expect(votings.connect(Bob).vote(0, Bob.address), { value: ethers.utils.parseEther("0.01") }).to.be.reverted
    })
    it('vote when already voted', async function () {
      setup()
      await votings.vote(0, Bob.address, { value: ethers.utils.parseEther("0.01") })
      await expect(votings.vote(0, Carrie.address), { value: ethers.utils.parseEther("0.01") }).to.be.reverted
    })
    it('vote when somebody voted for candidate', async function () {
      setup()
      await votings.vote(0, Bob.address, { value: ethers.utils.parseEther("0.01") })
      await votings.connect(Bob).vote(0, David.address, { value: ethers.utils.parseEther("0.01") })
      const voting = await votings.getVoting(0);
      expect(voting.candidates).to.equal(2);
    })
    it('increase budget', async function () {
      setup()
      votings.vote(0, Elisabeth.address, { value: ethers.utils.parseEther("0.01") }).then(async () => {
        const voting = await votings.getVoting(0);
        expect(voting.budget).to.equal(ethers.utils.parseEther("0.01"));
      })
    })
  })

  describe('Close voting', function () {
    async function closeSetup() {
      await votings.addVoting();
      await votings.vote(0, Bob.address, { value: ethers.utils.parseEther("0.01") })
    }

    it('close voting by existing id', async function () {
      closeSetup()
      votings.closeVoting(0, { timestamp }).then(async () => {
        const voting = await votings.getVoting(0);
        expect(voting.completed).to.equal(true);
      })
    })
    it('close voting by id that not exist', async function () {
      closeSetup()
      await expect(votings.closeVoting(10, { timestamp })).to.be.reverted
    })
    it('close voting without id', async function () {
      closeSetup()
      await expect(votings.closeVoting({ timestamp })).to.be.reverted
    })
    it("close voting when it hasn't been 3 days", async function () {
      closeSetup()
      await expect(votings.closeVoting(0)).to.be.reverted
    })
    it('close voting when the voting have no budget', async function () {
      await votings.addVoting();
      await expect(votings.closeVoting(0, { timestamp })).to.be.reverted
    })
    it('close voting when the voting already completed', async function () {
      closeSetup()
      votings.closeVoting(0, { timestamp })
      await expect(votings.closeVoting(0, { timestamp })).to.be.reverted
    })
  })

  describe('Show commission', function () {
    it('when not owner do this', async function () {
      commissionSetup().then(async () => {
        await expect(votings.connect(Bob).showCommission()).to.be.reverted
      })
    })
    it('when no commission', async function () {
      await expect(await votings.showCommission()).to.equal(0)
    })
    it('after closing the voting', async function () {
      commissionSetup().then(async () => {
        await expect(await votings.showCommission()).to.equal(ethers.utils.parseEther("0.002"))
      })
    })
  })

  describe('Withdraw commission', function () {
    it('when not owner do this', async function () {
      commissionSetup().then(async () => {
        await expect(await votings.connect(Bob).withdrawCommission()).to.be.reverted
      })
    })
    it('when no commission', async function () {
      await expect(votings.withdrawCommission()).to.be.reverted
    })
    it('owner get commission', async function () {
      commissionSetup().then(async () => {
        await expect(await votings.withdrawCommission()).to.changeEtherBalance(Alise.address, ethers.utils.parseEther("0.002"))
      })
    })
    it('check var commission = 0', async function () {
      commissionSetup().then(async () => {
        await votings.withdrawCommission()
        await expect(await votings.showCommission()).to.equal(0)
      })
    })
  })
})
