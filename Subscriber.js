class Subscriber {
  sendMessage(message) {
    throw new Error("Method not implemented.");
  }
}

// LineSubscriber class implementing the Subscriber interface
class LineSubscriber extends Subscriber {
  constructor(token, groupId) {
    super();
    this.token = token;
    this.groupId = groupId;
  }

  sendMessage(message) {
    const url = 'https://api.line.me/v2/bot/message/push';
    
    const payload = {
      "to": this.groupId,
      "messages": [{
        "type": "text",
        "text": message
      }]
    };

    const options = {
      "method": "post",
      "contentType": "application/json",
      "headers": {
        "Authorization": "Bearer " + this.token
      },
      "payload": JSON.stringify(payload)
    };

    try {
      const response = UrlFetchApp.fetch(url, options);
      Logger.log('Response Code: ' + response.getResponseCode());
      Logger.log('Response Body: ' + response.getContentText());
    } catch (e) {
      Logger.log('Error sending message: ' + e.toString());
    }
  }
}