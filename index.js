const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const gameTableName = process.env.GAME_TABLE;

exports.handler = async (event) => {
    const groupId = event.queryStringParameters.groupId;
    const requestOrigin = event.headers.origin;

    const headerTemplate = {
        "Access-Control-Allow-Origin": requestOrigin,
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "OPTIONS,GET"
    };

    if (!groupId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'groupId is required' }),
            headers: headerTemplate
        };
    }

    try {
        // Query logic to fetch games with a given `groupId`
        const queryResult = await dynamoDb.scan({
            TableName: gameTableName,
            FilterExpression: "contains(groupId, :groupId)",
            ExpressionAttributeValues: {
                ":groupId": groupId
            }
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify(queryResult.Items),
            headers: headerTemplate
        };
    } catch (err) {
        console.error('Error fetching games:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to fetch games' }),
            headers: headerTemplate
        };
    }
};
