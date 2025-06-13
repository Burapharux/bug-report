// Create FormStrategy interface
class Strategy {
  execute(e) {
    throw new Error("Method not implemented.");
  }
}

class NewFormSubmissionStrategy extends Strategy {
  execute(e) {
    let formResponse = e.response;
    let itemResponses = formResponse.getItemResponses();

    // Get the title from cell 'cellName' of the Google Sheet
    const sheet = SpreadsheetApp.openById(sheetId);
    const sheetObj = sheet.getSheetByName(sheetName);
    const titleToMatch = sheetObj.getRange(summaryCellName).getValue();
    const departmentTitle = sheetObj.getRange(departmentCellName).getValue();
    let outputString;
    let departmentValue;

    // Find department value from form responses
    itemResponses.forEach(itemResponse => {
      if (itemResponse.getItem().getTitle() === departmentTitle) {
        departmentValue = itemResponse.getResponse();
      }
    });

    // Find and notify only the response that matches the title in 'cellName'
    itemResponses.forEach(itemResponse => {
      if (itemResponse.getItem().getTitle() === titleToMatch) {
        outputString = "ได้รับแจ้งข้อผิดพลาดใหม่" + " : " + itemResponse.getResponse();
        if (departmentValue) {
          outputString += " (แผนก: " + departmentValue + ")";
        }
      }
    });
    return outputString !== undefined ? outputString : undefined;
  }
}

class UpdateFormSubmissionStrategy extends Strategy {
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