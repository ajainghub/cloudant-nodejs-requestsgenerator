# cloudant-nodejs-requestsgenerator
A set of scripts for: 1. creating and loading JSON docs to Cloudant database. 2. making requests to get documents, query views. 3. measure response time of individual requests.

You will need Node.js and request installed


CL_request.js

1. loads randomly generated sample data in the form of JSON documents to a Cloudant database
2. gets documents from an existing database based on primary index search index or views 
(Some of the sample data used in this script has context about sales deals so that it can be further used for creating meaningful indexes)

The code has been extended to log in CSV format the time it takes to service the request. This is enabled by useing logRT argument. This is usually needed if script is used for performance testing. For general use you can use nologRT argument 

Usage: node CL_request.js <action name, must be pre-configured inscript: addDocs | getDocs | createDb ...etc> <credentials set to use, must be pre-configured in script: creds1 | creds2 | creds3> <number of requests> <response time logging: logRT | nologRT> <option param to show docs body: showresponse>

For example:
>node CL_request.js  putDocs creds1 1000 nologRT 

Above will add 1000 docs to the database that is configured in creds1 (section in the script). It will not log the response time.
If response time needs to be measured the number of requests per call must be 1. Script will automatically set to 1 if logRT is passed as argument, i.e., response time is to be measured


run_cmd.sh

This script is a generic script that executes configured command(s) at specified interval and logs output of the script to a log file. Sscript will run for a specified duration.

Usage: ./run_cmd.sh.sh < Duration in minutes > < optional param 'bkgrnd' to run with nohup in background > 
