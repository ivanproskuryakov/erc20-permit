// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;

import "./IERC20.sol";

library SafeERC20 {
    function transfer(
        IERC20 _token,
        address _to,
        uint256 _val
    ) internal returns (bool) {
        (bool success, bytes memory data) =
        address(_token).call(
            abi.encodeWithSelector(_token.transfer.selector, _to, _val)
        );
        return success && (data.length == 0 || abi.decode(data, (bool)));
    }
}
