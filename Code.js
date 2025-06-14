// Load environment variables (simulating a .env)
const token = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ACCESS_TOKEN');
const groupId = PropertiesService.getScriptProperties().getProperty('LINE_GROUP_ID');
const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const sheetName = PropertiesService.getScriptProperties().getProperty('SHEET_NAME');
const summaryCellName = PropertiesService.getScriptProperties().getProperty('SUMMARY_CELL_NAME');
const targetColumn = Number(PropertiesService.getScriptProperties().getProperty('TARGET_COLUMN'));
const summaryColumn = Number(PropertiesService.getScriptProperties().getProperty('SUMMARY_COLUMN'));
const departmentCellName = PropertiesService.getScriptProperties().getProperty('DEPARTMENT_CELL_NAME');

let notifier;
let lineSubscriber;

// Setup a trigger
function createFormSubmitTrigger() {
  let form = FormApp.getActiveForm();
  let triggers = ScriptApp.getProjectTriggers();
  if (triggers.length > 0) return console.log("Please remove existing triggers before creating a new one.");

  ScriptApp.newTrigger("wrappedOnFormSubmit").forForm(form).onFormSubmit().create();
  console.log("Ran the createFormSubmitTrigger");
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

function setUpNotifiers() {
  notifier = new Notifier();
  lineSubscriber = new LineSubscriber(token, groupId);
  notifier.subscribe(lineSubscriber);
}

// Wrapper function to handle form submission
function wrappedOnFormSubmit(e) {
  setUpNotifiers();
  notifier.setStrategy(new NewFormSubmissionStrategy());
  notifier.executeStrategy(e);
}

function onEditTriggerHandler(e) {
  setUpNotifiers();
  notifier.setStrategy(new UpdateSheetStrategy());
  notifier.executeStrategy(e);
}

function setup() {
  setUpNotifiers();
  createFormSubmitTrigger();
  createSheetEditTrigger();
  console.log("Setup completed. Triggers created for form submission and onEdit events.");
}
