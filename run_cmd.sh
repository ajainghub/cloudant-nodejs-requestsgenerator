#!/bin/bash
###################################################################
# This script is a generic script that executes command(s) '$CMD $SCRIPT_NAME' every '$INTERVAL_SEC' seconds and logs output of the script to '$SCRIPT_OUT'
# The command(s) and output file can be configured in variables in the code below.
# This script will run for approximately <argument> minutes ($RUN_DURATION sec)
# This script requires run duration (in minutes) that should be passed as an argument  
# Usage: ./<thisscriptfilename>.sh <Duration in minutes> <optional param 'bkgrnd' to run with nohup in background> 
# This script restarts itself with nohup ./<thisscriptfilename>.sh <Duration in minutes> &
# Use the ps -ef | grep <thisscriptfilename> command to identify the PID and kill this script
# or use the ./stop_run_cmd.sh script that has the pid
###################################################################
# Disclaimer: This script is field developed for general testing purposes.
# This script is not Supported by IBM.
#
# Author: Anuj Jain
# Email: jainanuj@us.ibm.com
# Date/Version: 2015-05-15
###################################################################
if [ -z "$1" ]
then
	echo "No argument supplied. Provide the run duration (in minutes) as first argument."
	echo "To run in background use command: '$0 <Duration in minutes> bkgrnd'"
	exit
fi
TSTAMP=`date +%Y-%m-%d--%H.%M.%S`

#command set 1
CMD1=node
SCRIPT_NAME1=CL_request.js
SCRIPT_ARGS1="putDocs creds2 1 logRT noshowresponse"
SCRIPT_OUT1=Write_responsetimes-$TSTAMP.log.csv

#command set 2
CMD2=node
SCRIPT_NAME2=CL_request.js
SCRIPT_ARGS2="getDocsPrimaryIdx creds2 1 logRT noshowresponse"
SCRIPT_OUT2=Read_responsetimes-$TSTAMP.log.csv

#command set 3
CMD3=node
SCRIPT_NAME3=CL_request.js
SCRIPT_ARGS3="putDocs creds1 1 logRT noshowresponse"
SCRIPT_OUT3=WriteSalesdb_responsetimes-$TSTAMP.log.csv

#command set 4
CMD4=node
SCRIPT_NAME4=CL_request.js
SCRIPT_ARGS4="getDocsPrimaryIdx creds2 1 logRT noshowresponse"
SCRIPT_OUT4=ReadSalesdb_responsetimes-$TSTAMP.log.csv

INTERVAL_SEC=2
RUN_DURATION=`expr $1 \* 60`


echo "# This script will run for approximately $1 minutes ($RUN_DURATION sec), calling the configured scripts every $INTERVAL_SEC seconds and log output to $SCRIPT_OUT1, $SCRIPT_OUT2, $SCRIPT_OUT3, $SCRIPT_OUT4"

if [ "$2" == "bkgrnd" ]
then
        echo "# Script will be started with 'nohup $0 $1 &' to run in background. It will run for $1 minutes."
        echo " - Make sure to kill the background process if you want to terminate before the confgured duration, otherwise it will keep logging till the specified duration."
        echo " - Use 'ps -ef | grep run_cmd' to check and identify the background process and pid."
        echo " - Or, run the script ./stop_run_cmd.sh that will be saved in the directory with the kill command and pid."
        #echo " - Press Enter to continue."

        #spawn the background process
        nohup ./run_cmd.sh $1 &
	PID1=$!
	sleep 3

	#since this will run in background, create the stop/kill file
	#PROC1="run_cmd.sh"
	#PID1=""
	#PID1=`ps -ef | grep "$PROC1" | grep -v grep | awk 'NR==1' |  awk '{print $2}'`

	# Create the processes kill script
	echo "#!/bin/sh" > stop_run_cmd.sh
	echo "echo" "Killing the run_cmd.sh proces" "$PID1" >> stop_run_cmd.sh
	echo "kill -9 $PID1" >> stop_run_cmd.sh
	echo "rm -f stop_run_cmd.sh" >> stop_run_cmd.sh
	echo "echo Done." >> stop_run_cmd.sh
	chmod 755 stop_run_cmd.sh

        #exit from this current run
        exit
fi


echo "---------"
echo "To run in background use command: '$0 $1 bkgrnd'"
echo "Ctrl+C will terminate this current run."

i=0
while [ $i -le `expr $RUN_DURATION / $INTERVAL_SEC` ]
do
	$CMD1 $SCRIPT_NAME1 $SCRIPT_ARGS1 >> $SCRIPT_OUT1
        $CMD2 $SCRIPT_NAME2 $SCRIPT_ARGS2 >> $SCRIPT_OUT2
        $CMD3 $SCRIPT_NAME3 $SCRIPT_ARGS3 >> $SCRIPT_OUT3
        $CMD4 $SCRIPT_NAME4 $SCRIPT_ARGS4 >> $SCRIPT_OUT4
	sleep $INTERVAL_SEC
	i=`expr $i + 1`
done
echo "#Script run ended with output in $SCRIPT_OUT1, $SCRIPT_OUT2, $SCRIPT_OUT3, $SCRIPT_OUT4"
rm -f stop_run_cmd.sh




