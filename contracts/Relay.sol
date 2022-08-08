// SPDX-License-Identifier: MIT

pragma solidity ^0.8.11;

import "hardhat/console.sol";
import "./PineUtils.sol";
import "./ERC20OrderRouter.sol";

interface IRouter {
    function depositToken(
        uint256 _amount,
        address _vault,
        IERC20Permit _inputToken,
        address payable _owner,
        address _witness,
        bytes calldata _data,
        bytes32 _secret
    ) external;
}

import "./IERC20Permit.sol";

contract Relay {
    IRouter router;
    IERC20Permit token;
    address vault;

    constructor(IRouter _router, IERC20Permit _token, address _vault) {
        router = _router;
        token = _token;
        vault = _vault;
    }

    function transferWithPermit(
        uint amount,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s,

        bytes calldata _data,
        address _witness,
        bytes32 _secret
    ) external {
        token.permit(msg.sender, address(this), amount, deadline, v, r, s);
        token.transferFrom(address(msg.sender), address(this), amount);

        token.approve(address(router), amount);

        router.depositToken(
            amount,
            vault,
            token,
            payable(address(msg.sender)),
            _witness,
            _data,
            _secret
        );
    }

}
