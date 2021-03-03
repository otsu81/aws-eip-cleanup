const AWS = require('aws-sdk');
const fs = require('fs');
const org = require('./src/organizations');
const rolecreds = require('./src/getRoleCreds');
require('dotenv').config();

const regions = [
    "eu-north-1",
    "eu-west-1",
    "ap-northeast-1",
    "ap-northeast-2",
    "ap-south-1",
    "ap-southeast-1",
    "ap-southeast-2",
    "ca-central-1",
    "eu-central-1",
    "eu-west-2",
    "eu-west-3",
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2"
    // "ap-northeast-3", // osaka region requires opt-in
    // "eu-south-1", // milan region requires opt-in
    // "me-south-1", // bahrain region requires opt-in
    // "sa-east-1", // sao paolo region requires opt-in
    // "af-south-1", // south africa region requires opt-in
    // "ap-east-1", // hong kong region requires opt-in
];

async function getUnassociatedAddressesFromRegion(accountId, region) {
    try {
        const creds = await rolecreds.getRoleCredentials(accountId, process.env.ROLE, 'elasticIpInventoryBot');
        console.log(`working on ${accountId}:${region}`);
        let ec2 = new AWS.EC2({
            region: region,
            accessKeyId: creds.Credentials.AccessKeyId,
            secretAccessKey: creds.Credentials.SecretAccessKey,
            sessionToken: creds.Credentials.SessionToken
        });

        let eips = await ec2.describeAddresses().promise();

        let missingAssociations = [];
        for (let eip of eips.Addresses) {
            if (!eip.AssociationId) {
                if (eip.Tags.length == 0) missingAssociations.push(eip.AllocationId);
                else {
                    let tags = {};
                    for (let t of eip.Tags) tags[t.Key] = t.Value;
                    if (!tags[process.env.IGNORE_TAG_KEY] == process.env.IGNORE_TAG_VALUE) missingAssociations.push(eip.AllocationId);
                }
            };
        }
        return [accountId, region, missingAssociations];

    } catch (err) {
        console.log(err);
    };

};

// TODO async function deallocateElasticIp(associationIds)

async function run(params) {
    try {
        let accounts = await org.getActiveAccountIdsExceptOu({ParentId: params.ExcludeOU});
        accounts.delete('946939952825');

        // let accounts = ['763263601091', '588323308365'];
        // const regions = ['eu-west-1'];

        let promises = [];
        for (let a of accounts) {
            for (let r of regions) {
                promises.push(getUnassociatedAddressesFromRegion(a, r));
            };
        };

        let results = {};
        let resolved = await Promise.all(promises);
        for (let i in resolved) {
            try {
                if (!resolved[i][2].length == 0) {
                    results[resolved[i][0]] =  {[resolved[i][1]]: resolved[i][2]};
                };
            } catch (err) {
                console.log(resolved[i])
                console.log(err);
            }
        };

        console.log(JSON.stringify(results));

        fs.writeFile('out/result.json', JSON.stringify(results, null, 4), (err) => {
            if (err) console.log(err);
        });

    } catch (err) {
        console.log(err);
    }
};

run({
    ExcludeOU: process.env.EXCLUDE_OU
});