#!/bin/sh
############################################################
#                                                          #
# Contents of file Copyright (c) Prelert Ltd 2006-2014     #
#                                                          #
#----------------------------------------------------------#
#----------------------------------------------------------#
# WARNING:                                                 #
# THIS FILE CONTAINS UNPUBLISHED PROPRIETARY               #
# SOURCE CODE WHICH IS THE PROPERTY OF PRELERT LTD AND     #
# PARENT OR SUBSIDIARY COMPANIES.                          #
# PLEASE READ THE FOLLOWING AND TAKE CAREFUL NOTE:         #
#                                                          #
# This source code is confidential and any person who      #
# receives a copy of it, or believes that they are viewing #
# it without permission is asked to notify Prelert Ltd     #
# on +44 (0)20 7953 7243 or email to legal@prelert.com.    #
# All intellectual property rights in this source code     #
# are owned by Prelert Ltd.  No part of this source code   #
# may be reproduced, adapted or transmitted in any form or #
# by any means, electronic, mechanical, photocopying,      #
# recording or otherwise.                                  #
#                                                          #
#----------------------------------------------------------#
#                                                          #
#                                                          #
############################################################
#
# Script to update the Kibana source files that are duplicated
# in the Prelert Git repository.  Requires that the Kibana Git
# repository be cloned on the machine where it is run.  Either
# the third argument to this script on the $KIBANA_SRC_HOME
# environment variable must point to the top level directory of
# the Kibana Git repository.
#
# The clone of the Kibana Git repository must be sufficiently
# up-to-date to include the tags for the old and new Kibana
# versions.
#
# At the same time as committing any changes made by this script,
# the add_engine_api_kibana.sh script should be updated and the
# full copy of the new version of Kibana placed under
# $PRELERT_TOOLS_HOME/javascript
#

if [ $# -lt 2 ] ; then
    echo "Usage:   $0 <update from Kibana tag> <update to Kibana tag> [ <KIBANA_SRC_HOME> ]"
    echo "Example: $0 v3.0.1 v3.1.0 /home/dave/kibana"
    exit 1
fi

FROM_TAG="$1"
TO_TAG="$2"

if [ $# -gt 2 ] ; then
    KIBANA_SRC_HOME=`cd "$3" && pwd`
else
    if [ -z "$KIBANA_SRC_HOME" ] ; then
        echo '$KIBANA_SRC_HOME not set'
        exit 2
    fi
fi

if [ ! -d "$KIBANA_SRC_HOME" ] ; then
    echo "$KIBANA_SRC_HOME not found"
    exit 3
fi

cd `dirname "$0"`/engineAPI
pwd
find . \( -name '*.rej' -o -name '*.orig' \) -exec rm '{}' \;
FILES=`find . -type f | egrep -v 'prelert|kibana'`
(cd "$KIBANA_SRC_HOME/src" && git diff "$FROM_TAG" "$TO_TAG" $FILES) | patch -p2
if [ $? -ne 0 ] ; then
    echo ''
    echo 'SOME PATCHES COULD NOT BE APPLIED AUTOMATICALLY'
    echo 'You may need to make manual changes'
    echo 'See the text above and the following reject files:'
    find `pwd` -name '*.rej'
fi

