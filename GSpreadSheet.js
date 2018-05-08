/**
 * Custom Google Spreadsheet class.
 * 
 * Usage:
 * 1.   - [Create Google Spreadsheet.](https://docs.google.com/spreadsheets/u/0/)
 *    - Publish Spreadsheet into Web via 'file' -> 'publish in web...' -> 'link' -> 'publish' (specify sheet if you don't want all sheets to be published)
 *    - Use the ID of the URL as to call `GSpreadSheet.fromExport(ID[,hasHeader:bool][,callback:function])`
 * 2.   - [Create Google Spreadsheet.](https://docs.google.com/spreadsheets/u/0/)
 *    - Publish with google developer console
 *    - Get ID, Sheetname, key and optinally a specific value range (like 'A1:C3')
 *    - use these values for `GSpreadSheet.fromAPI(ID,Sheet,Key[,hasHeader:bool][,range:string][,callback:function])`
 */
export default class GSpreadSheet {

	get exportUrl() { return "https://docs.google.com/spreadsheets/d/e/"+this.id+"/pub?output=csv"; }
	get apiUrl() { 
		return "https://sheets.googleapis.com/v4/spreadsheets/"+ this.id+
				"/values/"+this.sheet + (this.range != null ? "!" + this.range : "") +
				"?key=" + this.key;
	}

	/**
	 * Get all rows
	 * @returns {Array<Array<String>>} An Array of rows containing the contents of the spreadsheet.
	 */
	get rows(){ return this._rows }

	/**
	 * Get all columns
	 * @returns {Array<Array<String>>} An Array of columns containing the contents of the spreadsheet.
	 */
	get cols(){ return this._cols; }

	/**
	 * Get a specific row
	 * @param {Number} index The index of the row to retrieve
	 * @returns {Array<String>} A row in form of a string array
	 */
	row(index){ return this.rows[index]; }

	/**
	 * Get a specific column. Can use a number or the column name as index.
	 * @param {Number|String} index The index of the column to retrieve
	 * @returns {Array<String>} A column in form of a string array
	 */
	col(index){ return this.cols[index]; }

	/**
	 * Gets a value of the spreadsheet by it's column and row indices. column index may be the column name.
	 * @param {Number|String} column The column index of the value to retrieve
	 * @param {Number} row The row index of the value to retrieve
	 * @returns {String} The value
	 */
	get(column, row){return this.cols[column][row]; }

	/**
	 * Callback for when data finishes loading
	 * @typedef {{(sheet:GSpreadSheet)=>void}} loadCallback
	 */


	/**
	 * Creates a Sheet instance using the given web-export spreadsheet id.
	 * @param {String} id The Google Spreadsheet ID String
	 * @param {Boolean} hasHeader Wether the Spreadsheet has a header row
	 * @param {loadCallback} onLoad Callback for when the data has been retrieved
	 * @returns {GSpreadSheet} An instance of GSpreadSheet
	 */
	static fromExport(id, hasHeader = false, onLoad = (sheet) => null){
		let newSheet = new GSpreadSheet();
		newSheet.id = id; 
		newSheet.hasHeader = hasHeader; 
		newSheet.onLoad = onLoad;
		let request = new XMLHttpRequest();
		request.open('GET', newSheet.exportUrl, true);
		// once the request is loaded, populate it's data and invoke callback
		request.onload = () => newSheet.CSVValueAssignment.bind(newSheet)(request);
		request.send();
		return newSheet;
	}

	static fromAPI(id, sheet, key, hasHeader = false, range = null, onLoad = (sheet) => null){
		let newSheet = new GSpreadSheet();
		newSheet.id = id;
		newSheet.sheet = sheet;
		newSheet.key = key;
		newSheet.hasHeader = hasHeader;
		newSheet.range = range;
		newSheet.onLoad = onLoad;
		let request = new XMLHttpRequest();
		request.open('GET', newSheet.apiUrl, true);
		request.onload = () => newSheet.JSONValueAssignment.bind(newSheet)(request);
		request.send();
		return newSheet;
	}


	JSONValueAssignment(request){
		let rawData = JSON.parse(request.responseText).values;
		this._rows = Array(rawData.length - (this.hasHeader ? 1 : 0));
		rawData.forEach((rowVal,rowIndex) => {
			if (this.hasHeader){
				if (rowIndex == 0)
					this.headers = rowVal;
				else{
					this._rows[rowIndex - 1] = rowVal;
					this.headers.forEach((hval, hindex) => this._rows[rowIndex-1][hval] = this._rows[rowIndex-1][hindex] );
				}
			} else this._rows[rowIndex] = rowVal;
		});
		this._cols = Array(this._rows[0].length);

		for(let colIndex = 0; colIndex < this._rows[0].length; colIndex++){
			this._cols[colIndex] = Array(this._rows.length);
			this._rows.forEach((rowval, rowIndex) => {
				this._cols[colIndex, rowIndex] = this._rows[rowIndex][colIndex];
				if (this.hasHeader)
				this._cols[this.headers[colIndex]] = this._cols[colIndex];
			})
		}
		this.onLoad(this);
	}

	/**
	 * internally used from the constructor
	 */
	CSVValueAssignment(request){
		// split the response (it's a csv) into rows
		let responseRows = request.responseText.split('\n');
		// define the rows property as array (header row is placed in the headers property if available)
		this._rows = Array(responseRows.length - (this.hasHeader ? 1 : 0));
		// iterate through the rows to assign the values
		responseRows.forEach((val, index) => {
			// if a header row is defined, we can use the headers as index for the columns, as well as the cells when navigating rows.
			// we also can ommit the header row for access when it's not really a data row.
			if (this.hasHeader){
				// if we are on the header row, we put it's values in a seperate property instead of the rows array
				if (index == 0) this.headers = val.split(',');
				else{
					this._rows[index-1] = val.split(',')
					// now add additional accessors to the rows to allow cell access via header texts
					this.headers.forEach((hval, hindex) => this._rows[index-1][hval] = this._rows[index-1][hindex] );
				}
			} else this._rows[index] = val.split(','); // without headers this is much simpler
		});

		// affter defining the rows, we add support for access via columns, starting by creating entry points for each column index
		this._cols = Array(this._rows[0].length);
		// iterate columns
		for(let colIndex = 0; colIndex < this._rows[0].length; colIndex++){
			// assign row-array to each column and then iterate the rows
			this._cols[colIndex] = Array(this._rows.length);
			this._rows.forEach((row, rowIndex) => {
				// map each col/row to row/col
				this._cols[colIndex][rowIndex] = this._rows[rowIndex][colIndex];
				// if headers are available, map these to their respective non-header equivalent
				if (this.hasHeader)
					this._cols[this.headers[colIndex]] = this._cols[colIndex];
			});
		}
		// invoke callback
		this.onLoad(this);
	}

	/**
	 * Converts this Sheet object back into csv format as string.
	 * @returns {String} a csv string
	 */
	toString() {
		let result = "";

		if (this.hasHeader) {
			this.headers.forEach(head => result += head + ',');
			// remove unwanted comma
			result = result.substr(0, result.length - 2);
			result += "\n";
		}
		this.rows.forEach(row => {
			row.forEach(cell => {
				result += cell + ",";
			});
			// remove unwanted comma
			result = result.substr(0, result.length - 2);
			result += "\n";
		})
		// remove unwanted newline
		result = result.substr(0, result.length - 2);
		return result;
	}

	/**
	 * Creates a DOM representation of the spreadsheet as a html table.
	 * @returns {HTMLTableElement} a html table of this object.
	 */
	createTable(){
		let tbl = document.createElement('table');
		if(this.hasHeader){
			let row = document.createElement("tr");
			this.headers.forEach(val => {
				let item = document.createElement("th");
				item.innerText = val;
				row.appendChild(item);
			});
			tbl.appendChild(row);
		}
		for (let rowIndex = 0; rowIndex < this._rows.length; rowIndex++) {
			
			let row = document.createElement("tr");
			this._rows[rowIndex].forEach(val => {
				let item = document.createElement("td");
				item.innerText = val;
				row.appendChild(item);
			});
			tbl.appendChild(row);
		}
		return tbl;
	}
}