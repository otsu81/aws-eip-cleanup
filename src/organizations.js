const AWS = require('aws-sdk');
const getPaginatedResults = require('./paginator');

async function getActiveAccountIds(params) {
    // endpoint for Organizations only exist in us-east-1
    AWS.config.update({region: 'us-east-1'});
    const org = new AWS.Organizations();

    const accounts = await getPaginatedResults(async (NextMarker) => {
        const accs = await org.listAccounts({NextToken: NextMarker}).promise();
        return {
            marker: accs.NextToken,
            results: accs.Accounts
        };
    });

    let activeAccounts = new Set();
    for (acc of accounts) {
        if (acc.Status == 'ACTIVE') activeAccounts.add(acc.Id);
    };
    return activeAccounts;
};

async function getActiveAccountIdsExceptOu(params) {
    var accounts = await getActiveAccountIds();

    const org = new AWS.Organizations({region: 'us-east-1'});
    const outOfScopeIds = await getPaginatedResults(async (NextMarker) => {
        const a = await org.listAccountsForParent({ParentId: params.ParentId, NextToken: NextMarker}).promise();
        return {
            marker: a.NextToken,
            results: a.Accounts
        }
    });

    for (let id of outOfScopeIds) {
        accounts.delete(id.Id);
    }
    return accounts;
};

exports.getActiveAccountIds = getActiveAccountIds;
exports.getActiveAccountIdsExceptOu = getActiveAccountIdsExceptOu;