class Strategy {
  execute(e) {
    throw new Error("Method not implemented.");
  }
}

class NewFormSubmissionStrategy extends Strategy {
  constructor(config) {
    super();
    this.outputTemplate = config.outputTemplate;
    this.fieldMap = config.fieldMap;
    this.sheet = SpreadsheetApp.openById(sheetId);
    this.sheetObj = this.sheet.getSheetByName(sheetName);
  }

  static getReducedItemResponses(itemResponses) {
    return itemResponses.reduce((acc, itemResponse) => {
      acc[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
      return acc;
    }, {});
  }

  execute(e) {
    let formResponse = e.response;
    let itemResponses = formResponse.getItemResponses();
    const reducedItemResponses = NewFormSubmissionStrategy.getReducedItemResponses(itemResponses);

    // Build output string using template and fieldMap
    let output = this.outputTemplate;
    for (const [placeholder, fieldId] of Object.entries(this.fieldMap)) {
      output = output.replace(`{{${placeholder}}}`, reducedItemResponses[this.sheetObj.getRange(fieldId).getValue()] || "");
    }
    return output;
  }
}

class UpdateSheetStrategy extends Strategy {
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