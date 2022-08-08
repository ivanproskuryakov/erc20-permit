const Web3 = require('web3')
const {expect} = require('chai')
const {ethers} = require('hardhat')

const web3 = new Web3()
const BN = web3.utils.BN;

const getPermitSignature = async (signer, token, spender, value, deadline) => {
    const [nonce, name, version, chainId] = await Promise.all([
        token.nonces(signer.address),
        token.name(),
        '1',
        signer.getChainId(),
    ])

    return ethers.utils.splitSignature(
        await signer._signTypedData(
            {
                name,
                version,
                chainId,
                verifyingContract: token.address,
            },
            {
                Permit: [
                    {
                        name: 'owner',
                        type: 'address',
                    },
                    {
                        name: 'spender',
                        type: 'address',
                    },
                    {
                        name: 'value',
                        type: 'uint256',
                    },
                    {
                        name: 'nonce',
                        type: 'uint256',
                    },
                    {
                        name: 'deadline',
                        type: 'uint256',
                    },
                ],
            },
            {
                owner: signer.address,
                spender,
                value,
                nonce,
                deadline,
            }
        )
    )
}

describe('ERC20Permit', function () {
    it('ERC20 permit', async function () {
        const Token = await ethers.getContractFactory('Token')
        const token = await Token.deploy()
        await token.deployed()

        const Vault = await ethers.getContractFactory('Vault')
        const vault = await Vault.deploy()
        await vault.deployed()

        const GelatoPineCore = await ethers.getContractFactory('GelatoPineCore')
        const gelatoPineCore = await GelatoPineCore.deploy(token.address)
        await gelatoPineCore.deployed()

        const ERC20OrderRouter = await ethers.getContractFactory('ERC20OrderRouter')
        const router = await ERC20OrderRouter.deploy(gelatoPineCore.address)
        await router.deployed()

        const Relay = await ethers.getContractFactory('Relay')
        const relay = await Relay.deploy(
            router.address,
            token.address,
            vault.address,
        )
        await relay.deployed()

        const accounts = await ethers.getSigners()
        const privatekey = 'ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        const signer = accounts[0]

        const amount = 1000;
        await token.mint(signer.address, amount)
        const deadline = ethers.constants.MaxUint256

        const {v, r, s} = await getPermitSignature(
            signer,
            token,
            relay.address,
            amount,
            deadline
        )
        const data = web3.eth.abi.encodeParameters(
            ['address', 'uint256'],
            [
                signer.address,
                amount,
            ]
        );
        const vaultAddress = await gelatoPineCore.vaultOfOrder(
            vault.address,               // Limit orders module
            token.address,               // Sell token 1
            signer.address,              // Owner of the order
            signer.address,              // Witness address
            data
        )

        await relay.transferWithPermit(
            amount,
            deadline,
            v,
            r,
            s,
            data,
            signer.address,
            web3.utils.soliditySha3(privatekey),
        )

        expect(await token.balanceOf(vaultAddress)).to.equal(amount)
    })
})
