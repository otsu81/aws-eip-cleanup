const AWS = require('aws-sdk');

async function getRoleCredentials (accountId, roleName, sessionName) {
    // Set the region
    AWS.config.update({region: process.env.DEFAULT_REGION});
    const arn = `arn:aws:iam::${accountId}:role/${roleName}`;
    const roleToAssume = {
        RoleArn: arn,
        RoleSessionName: sessionName,
        DurationSeconds: 900
    };

    // Create the STS service object
    const sts = new AWS.STS();
    return await sts.assumeRole(roleToAssume).promise();
}

exports.getRoleCredentials = getRoleCredentials;