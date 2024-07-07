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
    
    const authHeader = event.headers.Authorization;
    if (!authHeader) {
        return {
        statusCode: 401,
        body: JSON.stringify({
            message: "Unauthorized",
            action: "getPokerGames",
        }),
        headers: headerTemplate,
        };
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return {
        statusCode: 401,
        body: JSON.stringify({
            message: "Unauthorized",
            action: "getPokerGames",
        }),
        headers: headerTemplate,
        };
    }

    let verifiedUserId = undefined;
    try {
        const res = await fetch(
        //error 500
        "https://oqqznkdgb3.execute-api.us-east-1.amazonaws.com/dev/validate_token",
        {
            method: "GET",
            headers: {
            Authorization: `Bearer ${token}`,
            },
        }
        );
        console.log("Response:", res);
        if (res.status === 200) {
        const data = await res.json();
        verifiedUserId = data.user.username;
        } else {
        return {
            statusCode: 500,
            body: JSON.stringify({
            message: "Failed to validate token",
            action: "getPokerGames",
            }),
            headers: headerTemplate,
        };
        }
    } catch (err) {
        console.error("Error validating token:", err);
        return {
        statusCode: 500,
        body: JSON.stringify({
            message: "Failed to validate token",
            action: "getPokerGames",
        }),
        headers: headerTemplate,
        };
    }

    if (!verifiedUserId) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                message: "Unauthorized",
                action: "getPokerGames",
            }),
            headers: headerTemplate,
        }; 
    }

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
