class Strategy {
  execute(e) {
    throw new Error("Method not implemented.");
  }
}

class NewFormSubmissionStrategy extends Strategy {
  static getReducedItemResponses(itemResponses) { // this should be private static method. what a pity 
    return itemResponses.reduce((acc, itemResponse) => {
      acc[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
      return acc;
    }, {});
  }

  execute(e) {
    let formResponse = e.response;
    let itemResponses = formResponse.getItemResponses();
    const sheet = SpreadsheetApp.openById(sheetId);
    const sheetObj = sheet.getSheetByName(sheetName);

    const reducedItemResponses = getReducedItemResponses(itemResponses);
    if (!reducedItemResponses) {
      return undefined; // No item responses to process
    }

    const titleColumn = sheetObj.getRange(summaryCellName).getValue();
    const departmentColumn = sheetObj.getRange(departmentCellName).getValue();

    // Construct the output string
    if (!reducedItemResponses[titleColumn]) {
      return undefined;
    }
    let outputString = "ได้รับการแจ้งข้อผิดพลาดใหม่: " + reducedItemResponses[titleColumn];
    const departmentTitle = reducedItemResponses[departmentColumn];
    if (departmentTitle) {
      outputString += " (แผนก: " + departmentTitle + ")";
    }
    // Notify the user
    return outputString;
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