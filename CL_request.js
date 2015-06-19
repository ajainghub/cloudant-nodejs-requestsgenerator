///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
// This is a node js script that create requests for:
// 1. loads randomly generated sample data
// in the form of JSON documents to a Cloudant database
// 2. get documents from an existing database based on primary index
// search index or views 
//
// Some of the sample data used in this script has context about sales deals so that it can be further
// used for creating meaningful indexes
//
// The code has been extended to log in CSV format the time it takes to
// service the request. This is enabled by useing logRT argument.
// This is usually needed if script is used for performance testing. 
// For general use you can use nologRT argument 
//
// Usage: node <thisscriptfilename>.js <action name, must be pre-configured inscript: addDocs | getDocs | createDb ...etc> <credentials set to use, must be pre-configured in script: creds1 | creds2 | creds3> <number of requests> <response time logging: logRT | nologRT> <option param to show docs body: showresponse>
//
// Example: <thisscriptfilename>.js  putDocs creds1 1000 nologRT 
// Above will add 1000 docs to the database that is configured in creds1 (section in the script). It will not log the response time.
// Number of requests per call must be 1 if response time needs to be measured. Script will automatically set to 1 if logRT is passed as argument, i.e., response time is to be measured
//
//
//
//
// Disclaimer: This script is field developed for general testing purposes.
// This script is not Supported by IBM.
//
// Author: Anuj Jain
// Email: jainanuj@us.ibm.com
// Date/Version: 2015-05-15
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
var request = require('request');

// print process.argv
//process.argv.forEach(function (val, index, array) {
//  console.log(index + ': ' + val);
//});
//console.log(process.argv[2]);
//console.log(process.argv[3]);
//console.log(process.argv[4]);
//console.log(process.argv[5]);

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
// USER CONFIGURATION VARIABLES
// Configure the relevant information here and just pass the CREDS
// to the script as the parameter. 
///////////////////////////////////////////////////////////////////////////
//CREDS1
var CLOUDANT_URL1 = "http://<load balancer FQDN>";
var DB_USERNAME1 = "admin";
var DB_PASSWORD1 = "<yourpasswordhere>";
var DB_NAME1 = "salesdb";  //make sure this database exists
var URL_PK1EXT1 = "/_all_docs?startkey=%22001*%22&endkey=%22008*%22&inclusive_end=true&limit=10";
var URL_SR1EXT1 = "/_design/lookup/_search/all?q=Filing.Year:2008&limit=3";
var URL_VW1EXT1 = "";

//CREDS2
var CLOUDANT_URL2 = "http://<load balancer FQDN>";
var DB_USERNAME2 = "admin";
var DB_PASSWORD2 = "<yourpasswordhere>";
var DB_NAME2 = "ironcushiondb";  //make sure this database exists
var URL_PK1EXT2 = "/_all_docs?startkey=%221*%22&endkey=%228*%22&inclusive_end=true&limit=10";
var URL_SR1EXT2 = "/_design/lookup/_search/all?q=Filing.Year:2008&limit=3";
var URL_VW1EXT2 = "";

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
// OTHER VARIABLES
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
// MAIN FUNCTION 
///////////////////////////////////////////////////////////////////////////


//Set relevant variables from arguments and user configuration
//Log variables to console if LOGRT == 0 (i.e, not writing responsetime log)
var LOGTXT = "";

var ACTION = "";
if (  process.argv[2] == "putDocs" ) {
	ACTION = process.argv[2]; 
	//console.log("Requesting PUT.");
} else if ( process.argv[2] == "getDocsPrimaryIdx" ) {
        ACTION = process.argv[2];
        //console.log("Requesting GET.");
} else if (  process.argv[2] == "getDocsSearchIdx" ) {
        ACTION = process.argv[2];
        //console.log("Requesting secondary key search /adhoc / lucene run to get docs.");
} else if (  process.argv[2] == "getDocsViewIdx" ) {
        ACTION = process.argv[2];
        //console.log("Requesting secondary key / view / map reduce index run to get docs.");
} else {
	ACTION = "";
	console.log("Action argument invalid.");
	process.exit(code=0)
}
LOGTXT = LOGTXT + "\nACTION: " + ACTION;

var CREDS = "";
if ( process.argv[3] == "creds1" ) {
	CREDS = "creds1";
	var CLOUDANT_URL = CLOUDANT_URL1;
	var DB_USERNAME = DB_USERNAME1;
	var DB_PASSWORD = DB_PASSWORD1;
	var DB_NAME = DB_NAME1;
	var URL_PK1EXT= URL_PK1EXT1;
        var URL_SR1EXT= URL_SR1EXT1;
        var URL_VW1EXT= URL_VW1EXT1;
	//console.log("Database CREDS1.");
} else if (  process.argv[3] == "creds2" ) {
	CREDS = "creds2"
	var CLOUDANT_URL = CLOUDANT_URL2;
	var DB_USERNAME = DB_USERNAME2;
	var DB_PASSWORD = DB_PASSWORD2;
	var DB_NAME = DB_NAME2;
	var URL_PK1EXT= URL_PK1EXT2;
        var URL_SR1EXT= URL_SR1EXT2;
        var URL_VW1EXT= URL_VW1EXT2;
	//console.log("Database CREDS2.");
} else {
	CREDS = "";
	console.log("Creds or Database invalid.");
	process.exit(code=0)
}
LOGTXT = LOGTXT + "\nCREDS: " + CREDS;

var NUM_REQUESTS = 1;
if ( ( process.argv[4] != null ) && ( Number(process.argv[4]) > 0 ) )  {
	NUM_REQUESTS = process.argv[4];
	//console.log("Number of requests",NUM_REQUESTS);
} else {
	console.log("Invalid number of requests.");
	process.exit(code=0)
}
LOGTXT = LOGTXT + "\nNUM_REQUESTS: " + NUM_REQUESTS;

var LOGRT = 0;
if ( process.argv[5] == "logRT" )  {
	LOGRT = 1;
	if ( NUM_REQUESTS > 1 ) { 
		//console.log("Number of requests reset to 1 for measuring response times.");
		LOGTXT = LOGTXT + "\nLOGRT: Number of requests reset to 1 for measuring response times.";
	} 
	NUM_REQUESTS=1;
	//console.log("Log response time");
        LOGTXT = LOGTXT + "\nLOGRT: Logging response times enabled. Format: Timestamp,Action,Status,Start,End,Duration(ms)";
} else if ( process.argv[5] == "nologRT" ) {
	LOGRT = 0;
	//console.log("Do not log response time."); 
        LOGTXT = LOGTXT + "\nLOGRT: Logging response times disabled.";
} else {
	console.log("Invalid argument for logging response time.");
	process.exit(code=0)
}

var SHOWRESPONSE=0;
//optional last argument
if ( process.argv[6] == "showresponse" )  {
        SHOWRESPONSE = 1;
	LOGTXT = LOGTXT + "\nSHOWRESPONSE: showresponse";
} else {
	SHOWRESPONSE = 0;
	LOGTXT = LOGTXT + "\nSHOWRESPONSE: not showing docs";
}


//process.exit(code=0)

//////////////////////////////////////////////////////////////////////////

if ( ACTION == "putDocs" ) {
	addDocsPUT();
} //End of if ACTION == putDocs

if ( ACTION == "getDocsPrimaryIdx" ) {
        getDocsGET(URL_PK1EXT);
} //End of if ACTION == getDocsPrimaryIdx

if ( ACTION == "getDocsSearchIdx" ) {
        getDocsGET(URL_SR1EXT);
} //End of if ACTION == getDocsSearchIdx


if ( ACTION == "getDocsViewdIdx" ) {
        getDocsGET(URL_VW1EXT);
} //End of if ACTION == getDocsViewIdx

///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
// FUNCTION DECLARATIONS
///////////////////////////////////////////////////////////////////////////
function pausecomp(millis)
 {
  var date = new Date();
  var curDate = null;
  do { curDate = new Date(); }
  while(curDate-date < millis);
}

function getRandomArrayValue(any_array) {
    return any_array[getRandomInt(0,any_array.length-1)];
}

///////////////////////////////////////////////////////////////////////////
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

///////////////////////////////////////////////////////////////////////////

function getRandomNumber(min, max, precision) {
    return parseFloat(((Math.random() * (max - min + 1)) + min).toFixed(precision));
}


///////////////////////////////////////////////////////////////////////////

function getRandomArraySubset(any_array,num_sub_items){
        var sub_array = [];
        var used_idxs = [];        //create a temp array used_idxs of main array indexes used
        var r_idx;
        var items_added = [];

        //for testing only.
        //sub_array=any_array;

        //if num_sub_items > size of any_array then num_sub_items = size of any_array
        //if num_sub_item == -1 then num_sub_items = random size but less than size of any_array
        if ( num_sub_items > any_array.length ) {
                num_sub_items = any_array.length;
                //console.log("num_sub_items oversized. changing to: ", num_sub_items);
        } else if (  num_sub_items < 0 ) {
                num_sub_items=getRandomInt(1,any_array.length);
                //console.log("num_sub_items randomized. Changing to: ", num_sub_items);
        } else {
                //change nothing
                //console.log("num_sub_items is: ", num_sub_items);
        }

        items_added=0;
        //Loop n times when n is num_sub_times times
        while (items_added < num_sub_items) {

                //get a ramdom number as index r_idx from 0 to size of main array
                r_idx=getRandomInt(0,any_array.length-1)
                //console.log("r_idx:", r_idx);

                //loop through used_idxs and check if this index exists in the used_idxs array
                r_idx_used=0;
                for (i = 0; i < used_idxs.length; i++) {
                       if ( r_idx == used_idxs[i] ) {
                                r_idx_used++;
                        } //end of if ( r_idx...
                } //end of for i =...

                if ( r_idx_used > 0  ) {
                        //if exists
                                //end another random indx r_idx
                                //dont increment n
                        //skip and get another number;
                } else {
                        //if not exists
                                //add this index to used_idxs
                                //add the valueof any_array[r_idx] to sub_array
                                //increment n

                        used_idxs[used_idxs.length]=r_idx;
                        sub_array[sub_array.length]=any_array[r_idx]
                        items_added++;
                } //end of if ( r_idx_used > 0

        } // end of while (n <...

        //console.log("sub_array is: ", sub_array);
        //console.log("used_idxs is: ", used_idxs);

        //End of loop num_sub_items times

        return sub_array;
}


///////////////////////////////////////////////////////////////////////////

function sales_uid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
//for GUID uncomment and use below
//return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();

//for a smaller UID uncomment and use below
return s4() + s4() + '-' + s4()
};


///////////////////////////////////////////////////////////////////////////
function addDocsPUT() {

//variables

var SREGIONS = ["Americas", "Asia Pacfic", "Europe", "Middle East" ];
var SPERSONS = ["Leanne Flinn","Edward Young","Haydee Milligan","Lyle Keesee","Shea Mercer","Curtis Chapman","Roselyn Murphy","Marcus Freeman","Lyn Hollis","Lloyd Paschall","Isabelle Mullens","Francis Correa","Olivia Schaefer"];
var STYPE = ["Product License", "Services" , "Support", "Subscription"];
var SPRODUCTS = ["ETL", "Development", "Database", "Analytics", "Security", "QA Testing"];
var CUSTOMERS = ["Unilogic","Solexis","Dalserve","Terrasys","Pancast","Tomiatech","Kancom","Iridimax","Proline","Qualcore","Thermatek","VTGrafix","Sunopia","WestGate","Chromaton","Tecomix","Galcom","Zatheon","OmniTouch","Hivemind","MultiServ","Citisys","Polygan","Dynaroc","Storex","Britech","Thermolock","Cryptonica","LoopSys","ForeTrust","TrueXT","LexiconLabs","Bellgate","Dynalab","Logico","Terralabs"];
var FINANCINGTYPE = [ "Cash Full" , "Credit 1 Year", "Credit 2 Year", "Credit 3 Year" ];
var TERMINATECONDITION = [ "Full Refund", "Pro-rated Refund", "None"];

var salesdeal = new Object();
var db_stmt = new Object();


//Add random sales deals
if ( LOGRT == 0 ) {
	console.log("Adding documents.");
        console.log("Check database after script completes.");
} //End if LOGRT == 1

for ( scount = 0; scount < NUM_REQUESTS; scount++) {

        salesdeal._id = sales_uid();
        salesdeal.ContractID = sales_uid();
        salesdeal.Date = new Date(getRandomInt(2013,2014), getRandomInt(1,12),getRandomInt(1,28),getRandomInt(0,23),getRandomInt(0,59),getRandomInt(0,59),0);
        salesdeal.Name = getRandomArrayValue(SPERSONS);
        salesdeal.Region = getRandomArrayValue(SREGIONS);
        salesdeal.Customer = getRandomArrayValue(CUSTOMERS);
        salesdeal.Products = getRandomArraySubset(SPRODUCTS,-1);
        salesdeal.SalesType = getRandomArrayValue(STYPE);
        salesdeal.Amount = getRandomNumber(0,1000,0);
        salesdeal.FinancingType = getRandomArrayValue(FINANCINGTYPE);
        salesdeal.TerminationCondition = getRandomArrayValue(TERMINATECONDITION);
        salesdeal.POCStartDate = new Date(getRandomInt(2012,2012), getRandomInt(1,12),getRandomInt(1,28),getRandomInt(0,23),getRandomInt(0,59),getRandomInt(0,59),0);
        salesdeal.POCEndDate = new Date(getRandomInt(2013,2014), getRandomInt(1,12),getRandomInt(1,28),getRandomInt(0,23),getRandomInt(0,59),getRandomInt(0,59),0);
        salesdeal.GeoCoordinates = [ getRandomNumber(-180,180,6), getRandomNumber(-90,90,6) ];

        //console.log (JSON.stringify(salesdeal));

        db_stmt.uri = CLOUDANT_URL +"/"+ DB_NAME;
        db_stmt.auth = { "user": DB_USERNAME, "pass" : DB_PASSWORD };
        db_stmt.method = "POST";
        db_stmt.headers = { "Content-Type": "application/json" };
        db_stmt.json = true;
        db_stmt.uri = CLOUDANT_URL +"/"+ DB_NAME;
        //db_stmt.body = JSON.stringify(salesdeal);
        db_stmt.body = salesdeal;

        //console.log(db_stmt);
        //start timer
        var dreq_start = new Date();
        //console.log("Add doc request start.");

        request(db_stmt,
        function (error, response, body ) {
          if ( (!error && response.statusCode == 200) || (!error && response.statusCode == 201) ) {
			if ( SHOWRESPONSE == 1 ) {
                                console.log("\n\n#RESPONSE CODE:",response.statusCode, "\n\n#BODY:\n", body);
	                        //console.log(body);
			}
                        //end timer
                        var dreq_end = new  Date();
                        if ( LOGRT == 1 ) {
                                console.log(Date(),",",ACTION,",SUCCESS,",dreq_start,",",dreq_end,",",(dreq_end.getTime()-dreq_start.getTime()));
				//console.log(Date(),",Add doc request succesful,Start,",dreq_start,",End,",dreq_end,",Duration,", (dreq_end.getTime()-dreq_start.getTime()),",ms");
                        } //End if LOGRT == 1
                  } else {
                        //console.log("\n\n#ERROR:", error, "\n\n#RESPONSE",response,"\n\n#RESPONSE CODE",response.statusCode, "\n\n#BODY:", body)
                        //console.log("\n\n#RESPONSE CODE",response.statusCode, "\n\n#BODY:", body)
                        var dreq_end =new  Date();
                        if ( LOGRT == 1 ) {
                                console.log(Date(),",",ACTION,",FAILED,",dreq_start,",",dreq_end,",",(dreq_end.getTime()-dreq_start.getTime()));
				//console.log(Date(),",Add doc request FAILED,Start,",dreq_start,",End,",dreq_end,",Duration,", (dreq_end.getTime()-dreq_start.getTime()),",ms");
			} else {
                                console.log("\n\n#RESPONSE CODE:",response.statusCode, "\n\n#BODY:\n", body);
                        } //End if LOGRT == 1
                }
          } //end of function (err...
        ) //end of request(std...
}

} //end of function addDocsPUT

///////////////////////////////////////////////////////////////////////////
function getDocsGET(URL_EXT) {

//variables
var salesdeal = new Object();
var db_stmt = new Object();

//Get sales deals
if ( LOGRT == 0 ) {
        console.log("Getting documents based on criteria configured in the script.");
        //console.log("Check database after script completes.");
} //End if LOGRT == 1

for ( scount = 0; scount < NUM_REQUESTS; scount++) {

        //http://104.236.214.170/salesdb2/_all_docs?startkey=%22006*%22&endkey=%22007*%22&inclusive_end=true&limit=10
        //console.log (JSON.stringify(salesdeal));

        //db_stmt.uri = CLOUDANT_URL +"/"+ DB_NAME + "/_all_docs?startkey=%22001*%22&endkey=%22008*%22&inclusive_end=true&limit=10";
	db_stmt.uri = CLOUDANT_URL +"/"+ DB_NAME + "/" + URL_EXT;	
        db_stmt.auth = { "user": DB_USERNAME, "pass" : DB_PASSWORD };
        db_stmt.method = "GET";
        //db_stmt.headers = { "Content-Type": "application/json" };
        //db_stmt.json = true;
        //db_stmt.body = JSON.stringify(salesdeal);

        //console.log(db_stmt);

        //start timer
        var dreq_start = new Date();
        //console.log("Add doc request start.");

        request(db_stmt,
        function (error, response, body ) {
          if ( (!error && response.statusCode == 200) || (!error && response.statusCode == 201) ) {
                        if ( SHOWRESPONSE == 1 ) {
                                console.log("\n\n#RESPONSE CODE:",response.statusCode, "\n\n#BODY:\n", body);
                                //console.log(body);
                        }
                        //end timer
                        var dreq_end =new  Date();
                        if ( LOGRT == 1 ) {
	                        console.log(Date(),",",ACTION,",SUCCESS,",dreq_start,",",dreq_end,",",(dreq_end.getTime()-dreq_start.getTime()));
				//console.log(Date(),",Get docs request succesful,Start,",dreq_start,",End,",dreq_end,",Duration,", (dreq_end.getTime()-dreq_start.getTime()),",ms");
                        } //End if LOGRT == 1
                  } else {
                        //console.log("\n\n#ERROR:", error, "\n\n#RESPONSE",response,"\n\n#RESPONSE CODE",response.statusCode, "\n\n#BODY:", body)
                        //console.log("\n\n#RESPONSE CODE",response.statusCode, "\n\n#BODY:", body)
                        var dreq_end =new  Date();
                        if ( LOGRT == 1 ) {
                               	console.log(Date(),",",ACTION,",FAILED,",dreq_start,",",dreq_end,",",(dreq_end.getTime()-dreq_start.getTime()));
				//console.log(Date(),",Get docs request FAILED,Start,",dreq_start,",End,",dreq_end,",Duration,", (dreq_end.getTime()-dreq_start.getTime()),",ms");
                        } else {
                                console.log("\n\n#RESPONSE CODE:",response.statusCode, "\n\n#BODY:\n", body);
                        } //End if LOGRT == 1
                }
          } //end of function (err...
        ) //end of request(std...
}

} // End of function getDocsGET





