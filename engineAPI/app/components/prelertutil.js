/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2014     *
 *                                                          *
 *----------------------------------------------------------*
 *----------------------------------------------------------*
 * WARNING:                                                 *
 * THIS FILE CONTAINS UNPUBLISHED PROPRIETARY               *
 * SOURCE CODE WHICH IS THE PROPERTY OF PRELERT LTD AND     *
 * PARENT OR SUBSIDIARY COMPANIES.                          *
 * PLEASE READ THE FOLLOWING AND TAKE CAREFUL NOTE:         *
 *                                                          *
 * This source code is confidential and any person who      *
 * receives a copy of it, or believes that they are viewing *
 * it without permission is asked to notify Prelert Ltd     *
 * on +44 (0)20 7953 7243 or email to legal@prelert.com.    *
 * All intellectual property rights in this source code     *
 * are owned by Prelert Ltd.  No part of this source code   *
 * may be reproduced, adapted or transmitted in any form or *
 * by any means, electronic, mechanical, photocopying,      *
 * recording or otherwise.                                  *
 *                                                          *
 *----------------------------------------------------------*
 *                                                          *
 *                                                          *
 ************************************************************
 */

/**
 * Provides a  number of utility functions used by the Prelert panels added to the Kibana UI.
 */
define([
],
function() {
  'use strict';

  var prelertutil = {};
  
  prelertutil.get_anomaly_severity = function(normalizedScore) {
      // Returns a severity label (one of critical, major, minor, warning or none)
      // for the supplied normalized anomaly score (a value between 0 and 100).
      if (normalizedScore > 75) {
          return "critical";
      } else if (normalizedScore > 50) {
          return "major";
      } else if (normalizedScore > 25) {
          return "minor";
      } else if (normalizedScore > 0) {
          return "warning";
      } else {
          return "none";
      }  
  };

  return prelertutil;
});
