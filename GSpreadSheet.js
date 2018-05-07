/**
 * Custom Google Spreadsheet class.
 * 
 * Usage:
 *  - [Create Google Spreadsheet.](https://docs.google.com/spreadsheets/u/0/)
 *  - Publish Spreadsheet into Web via 'file' -> 'publish in web...' -> 'link' -> 'publish' (specify sheet if you don't want all sheets to be published)
 *  - Use the ID of the URL as parameter for the constructor
 * 
 * It's the part between the '.../d/e/' and '/pubhtml'
 * 
 * so 
 * 
 * `https://docs.google.com/spreadsheets/d/e/2PACX-1vSHxqWOh3tbxbnA-J6j7nuvVQ2bahoqdsuYe5jtYgmv_4Bs1z4BBC0LH2-ry2uX6XB5fPwYbekFKrnR/pubhtml`
 * 
 * becomes
 * 
 * `2PACX-1vSHxqWOh3tbxbnA-J6j7nuvVQ2bahoqdsuYe5jtYgmv_4Bs1z4BBC0LH2-ry2uX6XB5fPwYbekFKrnR`
 * 
 * then you can create a Spreadsheet like:
 * ```js
 * let sheetID = "2PACX-1vSHxqWOh3tbxbnA-J6j7nuvVQ2bahoqdsuYe5jtYgmv_4Bs1z4BBC0LH2-ry2uX6XB5fPwYbekFKrnR";
 * let sheet = new GSpreadSheet(sheetID);
 * 
 * console.log(sheet.get[1, 2]);
 * ```
 */
class GSpreadSheet {

	/**
	 * Prefix for google spreadsheet documents. This is the url layout as of 07.05.2018
	 */
	get urlpre() { return "https://docs.google.com/spreadsheets/d/e/"; }
	
	/**
	 * Suffix for google spreadsheet documents. This is the url layout as of 07.05.2018
	 */
	get urlpost() { return "/pub?output=csv" };

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
	 * Creates a Sheet instance using the given spreadsheet id. Requires network connection!
	 * @param {String} id The Google Spreadsheet ID String
	 * @param {Boolean} hasHeader Wether the Spreadsheet has a header row
	 * @param {loadCallback} onLoad Callback for when the data has been retrieved
	 * 
	 */
	constructor(id, hasHeader = false, onLoad = (sheet) => null) { 
		this.id = id; 
		this.hasHeader = hasHeader; 
		this.onLoad = onLoad;
		let request = new XMLHttpRequest();
		request.open('GET', this.urlpre + this.id + this.urlpost, true);
		// once the request is loaded, populate it's data and invoke callback
		request.onload = () => this.valueAssignment.bind(this)(request);
		request.send();
	}

	/**
	 * internally used from the constructor
	 */
	valueAssignment(request){
		// split the response (it's a csv) into rows
		let responseRows = request.responseText.split('\n');
		// define the rows property as array (header row is placed in the headers property if available)
		this._rows = Array(responseRows.length - (this.hasHeader ? 2 : 1));
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
				if (this.hasHeader){
					this._cols[this.headers[colIndex]] = this._cols[colIndex];
				}
			});
		}
		// invoke callback
		this.onLoad();
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
export default GSpreadSheet;
