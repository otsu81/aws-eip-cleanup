const AWS = require('aws-sdk');

let getRoleCredentials = async (accountId, roleName, sessionName) => {
    // Set the region
    AWS.config.update({region: process.env.DEFAULT_REGION});
    const arn = `arn:aws:iam::${accountId}:role/${roleName}`;
    // const arn = 'arn:aws:iam::' + accountId + ':role/' + roleName
    var roleToAssume = {RoleArn: arn,
                        RoleSessionName: sessionName,
                        DurationSeconds: 900,};

    // Create the STS service object
    var roleCreds;
    var sts = new AWS.STS();
    const response = await sts.assumeRole(roleToAssume).promise();
    return response;
}

module.exports = getRoleCredentials;