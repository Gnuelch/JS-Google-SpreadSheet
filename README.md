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
require GSpreadSheet from '/GSpreadSheet';

...

somefunction = new function(){
	let sheetInstance = new GSpreadSheet('verylongtext', false, (sheet) => {
		let some_col = sheet.cols['column name'];
		let some_val = sheet.get('other column', 3);
		let alternative = sheet.cols[1];
		let some_row = sheet.rows[3];
		if (sheet.hasHeader){
			let headers = sheet.headers;
		}
	});
}
```