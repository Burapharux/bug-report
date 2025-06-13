// Load environment variables (simulating a .env)
const token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
const groupId = PropertiesService.getScriptProperties().getProperty('LINE_GROUP_ID');
const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const sheetName = PropertiesService.getScriptProperties().getProperty('SHEET_NAME');
const summaryCellName = PropertiesService.getScriptProperties().getProperty('SUMMARY_CELL_NAME');
const targetColumn = Number(PropertiesService.getScriptProperties().getProperty('TARGET_COLUMN'));
const summaryColumn = Number(PropertiesService.getScriptProperties().getProperty('SUMMARY_COLUMN'));



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
    this.strategy = null; // Placeholder for strategy if needed
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

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  executeStrategy(e) {
    if (this.strategy) {
      const message = this.strategy.execute(e);
      if (!message) {
        Logger.log("No action taken by the strategy.");
        return;
      }
      Logger.log("Strategy executed, returning message: " + message);
      this.notifySubscribers(message);
    } else {
      throw new Error("No strategy set.");
    }
  }

}

// Create FormStrategy interface
class FormStrategy {
  execute(e) {
    throw new Error("Method not implemented.");
  }
}

class NewFormSubmissionStrategy extends FormStrategy {
  execute(e) {
    let formResponse = e.response;
    let itemResponses = formResponse.getItemResponses();

    // Get the title from cell 'cellName' of the Google Sheet
    const sheet = SpreadsheetApp.openById(sheetId); // Replace with your sheet ID
    const titleToMatch = sheet.getSheetByName(sheetName).getRange(summaryCellName).getValue(); // Replace with your sheet name
    let outputString = "";
    
    // Find and notify only the response that matches the title in 'cellName'
    itemResponses.forEach(itemResponse => {
      if (itemResponse.getItem().getTitle() === titleToMatch) {
        outputString = "ได้รับแจ้งข้อผิดพลาดใหม่" + " : " + itemResponse.getResponse();
      }
    });
    return outputString;
  }
}

class UpdateFormSubmissionStrategy extends FormStrategy {
  execute(e) {
    // Get the edited sheet
    const sheet = e.source.getActiveSheet();
    
    // Get the edited cell's row and column
    const editedRow = e.range.getRow();
    const editedColumn = e.range.getColumn();
    
    // Check if the edited column is the target column
    if (editedColumn === targetColumn) {
      // Get the whole row as an array
      const rowData = sheet.getRange(editedRow, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      // Log the entire row data
      Logger.log('Edited Row Data: ' + rowData[summaryColumn - 1]); // Adjust for zero-based index
      return "มีการเปลี่ยนแปลงสถานะของ: " + rowData[summaryColumn - 1] + "เป็นสถานะ " + rowData[targetColumn - 1];
      
    }
    return undefined; // No action if the edited column is not the target column
  }
}

const notifier = new Notifier();
const lineSubscriber = new LineSubscriber(token, groupId);
notifier.subscribe(lineSubscriber);

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
  notifier.setStrategy(new NewFormSubmissionStrategy());
  notifier.executeStrategy(e);
}

function onEditTriggerHandler(e) {
  notifier.setStrategy(new UpdateFormSubmissionStrategy());
  notifier.executeStrategy(e);
}

function createSheetEditTrigger() {
  // Check if the trigger already exists to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'onEditTriggerHandler') {
      Logger.log('Trigger already exists. Skipping creation.');
      return; // Exit if this trigger already exists
    }
  }
  
  // Create the trigger for the onEdit event
  ScriptApp.newTrigger('onEditTriggerHandler')
           .forSpreadsheet(SpreadsheetApp.openById(sheetId)) // Set the trigger for the specific spreadsheet
           .onEdit()
           .create();
  
  Logger.log('Trigger created successfully.');
}

function setup() {
  createFormSubmitTrigger();
  createSheetEditTrigger();
  console.log("Setup completed. Triggers created for form submission and onEdit events.");
}
