// Load environment variables (simulating a .env)
const token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
const groupId = PropertiesService.getScriptProperties().getProperty('LINE_GROUP_ID');
const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const sheetName = PropertiesService.getScriptProperties().getProperty('SHEET_NAME');
const summaryCellName = PropertiesService.getScriptProperties().getProperty('SUMMARY_CELL_NAME');

// Interface for Subscriber
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

// Notifier class
class Notifier {
  constructor() {
    this.subscribers = [];
  }

  subscribe(s) {
    this.subscribers.push(s);
  }

  unsubscribe(s) {
    this.subscribers = this.subscribers.filter(subscriber => subscriber !== s);
  }

  notifySubscribers(message) {
    this.subscribers.forEach(subscriber => subscriber.sendMessage(message));
  }

  // The trigger function when the form is submitted
  onFormSubmit(e) {
    let formResponse = e.response;
    let itemResponses = formResponse.getItemResponses();

    // Get the title from cell 'cellName' of the Google Sheet
    const sheet = SpreadsheetApp.openById(sheetId); // Replace with your sheet ID
    const titleToMatch = sheet.getSheetByName(sheetName).getRange(summaryCellName).getValue(); // Replace with your sheet name
    
    // Find and notify only the response that matches the title in 'cellName'
    itemResponses.forEach(itemResponse => {
      if (itemResponse.getItem().getTitle() === titleToMatch) {
        this.notifySubscribers(itemResponse.getItem().getTitle() + " : " + itemResponse.getResponse());
      }
    });
  }
}

// Setup a trigger
function createFormSubmitTrigger() {
  let form = FormApp.getActiveForm();
  let triggers = ScriptApp.getProjectTriggers();
  if (triggers.length > 0) return console.log("Please remove existing triggers before creating a new one.");

  ScriptApp.newTrigger("wrappedOnFormSubmit").forForm(form).onFormSubmit().create();
  console.log("Ran the createFormSubmitTrigger");
}

// Wrapper function to handle form submission
function wrappedOnFormSubmit(e) {
  const notifier = new Notifier();
  const lineSubscriber = new LineSubscriber(token, groupId);
  
  notifier.subscribe(lineSubscriber);
  notifier.onFormSubmit(e);
}