# JS-Google-SpreadSheet
## Usage
 - [Create Google SpreadSheet](https://docs.google.com/spreadsheets/u/0/)
 - Publish SpreadSheet in Web 
 
 ![File-Publish_Web](https://i.imgur.com/KLYS2kI.png) 
 ![Publish_CSV](https://i.imgur.com/2Ni2QQM.png)
 - Get The SpreadSheet ID in the now displayed url:
   - .../spreadsheets/d/e/verylongtext/pub?output=csv
   - .../spreadsheets/d/e/ `verylongtext` /pub?output=csv
   - `verylongtext`
 - Use the ID to create the Spreadsheet object
```js
import GSpreadSheet from '/GSpreadSheet';

// the boolean value indicates whether the sheet has a header row

let sheetInstance = GSpreadSheet.fromExport('verylongtext', false, (sheet) => {
	let some_col = sheet.cols['column name'];
	let some_val = sheet.get('other column', 3);
	let alternative = sheet.cols[1];
	let some_row = sheet.rows[3];
	if (sheet.hasHeader){
		let headers = sheet.headers;
	}
});

// Now Also with API 'support'!

// as above, the boolean value determines whether the sheet (or range) has a header row

let sheetInstance = GSpreadSheet.fromAPI('API_ID', 'Target_Sheet_Name', 'API_Key', false, 'A1:G23', (sheet) => {
	// same as above
});

```