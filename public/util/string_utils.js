/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2016     *
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
 * on +44 (0)20 3567 1249 or email to legal@prelert.com.    *
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

/*
 * Contains utility functions for performing operations on Strings.
 */

define(function (require) {

  var _ = require('lodash');
  var moment = require('moment-timezone');

  // Replaces all instances of dollar delimited tokens in the specified String
  // with corresponding values from the supplied object, optionally
  // encoding the replacement for a URI component.
  // For example if passed a String 'http://www.google.co.uk/#q=airline+code+$airline$'
  // and valuesByTokenName of {"airline":"AAL"}, will return
  // 'http://www.google.co.uk/#q=airline+code+AAL'.
  // If a corresponding key is not found in valuesByTokenName, then the String is not replaced.
  function replaceStringTokens(str, valuesByTokenName, encodeForURI) {
    return String(str).replace((/\$([^?&$\'"]{1,40})\$/g), function(match, name) {
      // Use lodash get to allow nested JSON fields to be retrieved.
      var tokenValue = _.get(valuesByTokenName, name, null);
      if (encodeForURI === true && tokenValue !== null) {
        tokenValue = encodeURIComponent(tokenValue);
      }

      // If property not found string is not replaced.
      return tokenValue !== null ? tokenValue : match;
    });
  }

  // creates the default description for a given detector
  function detectorToString(dtr) {
    var BY_TOKEN = " by ";
    var OVER_TOKEN = " over ";
    var USE_NULL_OPTION = " usenull=";
    var PARTITION_FIELD_OPTION = " partitionfield=";
    var EXCLUDE_FREQUENT_OPTION = " excludefrequent=";

    var txt = "";

    if(dtr.function !== undefined && dtr.function !== "") {
      txt += dtr.function;
      if(dtr.fieldName !== undefined && dtr.fieldName !== "") {
        txt += "("+quoteField(dtr.fieldName)+")";
      }
    } else if(dtr.fieldName !== undefined && dtr.fieldName !== "") {
      txt += quoteField(dtr.fieldName);
    }

    if(dtr.byFieldName !== undefined && dtr.byFieldName !== "") {
      txt += BY_TOKEN + quoteField(dtr.byFieldName);
    }

    if(dtr.overFieldName !== undefined && dtr.overFieldName !== "") {
      txt += OVER_TOKEN + quoteField(dtr.overFieldName);
    }

    if(dtr.useNull !== undefined) {
      txt += USE_NULL_OPTION + dtr.useNull;
    }

    if(dtr.partitionFieldName !== undefined && dtr.partitionFieldName !== "") {
      txt += PARTITION_FIELD_OPTION + quoteField(dtr.partitionFieldName);
    }

    if(dtr.excludeFrequent !== undefined && dtr.excludeFrequent !== "") {
      txt += EXCLUDE_FREQUENT_OPTION + dtr.excludeFrequent;
    }

    return txt;
  }

  // wrap a the inputed string in quotes if it contains non-word characters
  function quoteField(field) {
    if(field.match(/\W/g)) {
      return '"'+field+'"';
    } else {
      return field;
    }
  }

  // re-order an object based on the value of the keys
  function sortByKey(list, reverse, comparator) {
    var keys = _.sortBy(_.keys(list), function (key) {
      return comparator ? comparator(list[key], key) : key;
    });

    if (reverse) {
        keys = keys.reverse();
    }

    return _.object(keys, _.map(keys, function (key) {
      return list[key];
    }));
  }

  // non-blocking way of looping over large arrays.
  // each element is passed into fn.
  // 1 millisec wait between batches to allow the browser to keep moving
  // last two args are optional
  // eg, split array into quarters:
  // processLargeArrayAsync(largeArray, callback, (largeArray/4) )
  function processLargeArrayAsync(array, fn, chunk, context) {
    context = context || window;
    chunk = chunk || 100;
    var index = 0;

    function doChunk() {
      var cnt = chunk;
      while (cnt-- && index < array.length) {
        // callback called with args (value, index, array)
        fn.call(context, array[index], index, array);
        ++index;
      }
      if (index < array.length) {
        setTimeout(doChunk, 1);
      }
    }
    doChunk();
  }

  // reutrns an array of possible delimiters found in a string
  function guessDelimiters (text, possibleDelimiters) {
    if(text !== "" &&
       possibleDelimiters !== undefined &&
       possibleDelimiters.length) {

      return possibleDelimiters.filter(weedOut);

      function weedOut (delimiter) {
        var cache = -1;
        return text.split('\n').every(checkLength);

        function checkLength (line) {
          if (!line) {
            return true;
          }

          var length = line.split(delimiter).length;
          if (cache < 0) {
            cache = length;
          }
          return cache === length && length > 1;
        }
      }
    } else {
      return [];
    }
  }

  // guess the time format for a given time string
  function guessTimeFormat(time) {
    var format = "";
    if(isNaN(time)) {
      var matched = false;
      var match;

      // match date format
      if(!matched) {
        var reg = "";

        reg += "(";                                 // 1   ( date

        reg += "(";                                 // 2   ( yyyy-MM-dd
        reg += "(\\d{4})";                          // 3   yyyy
        reg += "([-/.\\s])";                        // 4   - or . or \s
        reg += "(";                                 // 5   ( month
        reg += "([01]\\d)";                         // 6   MM
        reg += "|";                                 //     or
        reg += "(\\w{3})";                          // 7   MMM
        reg += ")";                                 //     ) end month
        reg += "([-/.\\s])";                        // 8   - or . or \s
        reg += "([0-3]\\d)";                        // 9   dd  0-3 and 0-9
        reg += ")";                                 //     ) end yyyy-MM-dd

        reg += "|";                                 //     or

        reg += "(";                                 // 10  ( dd-MM(M)-yyyy or MM(M)-dd-yyyy

        reg += "(";                                 // 11  ( day or month
        reg += "(\\d{2})";                          // 12  dd or MM
        reg += "|";                                 //     or
        reg += "(\\w{3})";                          // 13  MMM
        reg += ")";                                 //     ) end day or month

        reg += "([-/.\\s])";                        // 14  - or . or \s

        reg += "(";                                 // 15  ( day or month
        reg += "(\\d{2})";                          // 16  dd or MM
        reg += "|";                                 //     or
        reg += "(\\w{3})";                          // 17  MMM
        reg += ")";                                 //     ) end day or month

        reg += "([-/.\\s])";                        // 18  - or . or \s
        reg += "(\\d{4})";                          // 19   yyyy
        reg += ")";                                 //     ) end dd-MM[M]-yyyy or MM[M]-dd-yyyy

        reg += ")";                                 //     ) end date

        reg += "([T\\s])?";                         // 20  T or space

        reg += "([0-2]\\d)";                        // 21  HH 0-2 and 0-9
        reg += "([:.])";                            // 22  :.
        reg += "([0-5]\\d)";                        // 23  mm  0-5 and 0-9
        reg += "([:.])";                            // 24  :.
        reg += "([0-5]\\d)";                        // 25  ss  0-5 and 0-9
        reg += "(";                                 // 26  ( optional millisecs
        reg += "([:.])";                            // 27  :.
        reg += "(\\d{3})";                          // 28  3 * 0-9
        reg += ")?";                                //     ) end optional millisecs
        reg += "(";                                 // 29  ( optional timezone matches
        reg += "([+-]\\d{2}[:.]\\d{2}[:.]\\d{2})";  // 30  +- 0-9 0-9 :. 0-9 0-9 :. 0-9 0-9 e.g. +00:00:00
        reg += "|";                                 //     or
        reg += "([+-]\\d{2}[:.]\\d{2})";            // 31  +- 0-9 0-9 :. 0-9 0-9 e.g. +00:00
        reg += "|";                                 //     or
        reg += "([+-]\\d{6})";                      // 32  +- 6 * 0-9 e.g. +000000
        reg += "|";                                 //     or
        reg += "([+-]\\d{4})";                      // 33  +- 4 * 0-9 e.g. +0000
        reg += "|";                                 //     or
        reg += "(Z)";                               // 34  Z
        reg += "|";                                 //     or
        reg += "([+-]\\d{2})";                      // 35  +- 0-9 0-9 e.g. +00
        reg += "|";                                 //     or
        reg += "(";                                 // 36  ( string timezone
        reg += "(\\s)";                             // 37  optional space
        reg += "(\\w{1,4})";                        // 38  1-4 letters e.g UTC
        reg += ")";                                 //     ) end string timezone
        reg += ")?";                                //     ) end optional timezone

        console.log("guessTimeFormat: time format regex: " + reg);

        match = time.match(new RegExp(reg));
        // console.log(match);
        if(match) {
          // add the standard data and time
          if(match[2] !== undefined) { // match yyyy-[MM MMM]-dd
            format += "yyyy";
            format += match[4];
            if(match[6] !== undefined) {
              format += "MM";
            } else if(match[7] !== undefined) {
              format += "MMM";
            }
            format += match[8];
            format += "dd";
          } else if(match[10] !== undefined ) { // match dd-MM[M]-yyyy or MM[M]-dd-yyyy

            if(match[13] !== undefined) {
              // found a word as the first part
              // eg Jan 01 2000
              format += "MMM";
              format += match[14];
              format += "dd";
            } else if(match[17] !== undefined) {
              // found a word as the second part
              // eg 01 Jan 2000
              format += "dd";
              format += match[14];
              format += "MMM";
            } else {
              // check to see if the first number is greater than 12
              // eg 24/03/1981
              // this is a guess, but is only thing we can do
              // with one line from the data set
              if(match[12] !== undefined && (+match[12] > 12)) {
                format += "dd";
                format += match[14];
                format += "MM";
              } else {
                // default to US format.
                format += "MM";
                format += match[14];
                format += "dd";
              }
            }

            format += match[18];
            format += "yyyy";
          }

          // optional T or space splitter
          // wrap T in single quotes
          format += ((match[20] === "T")?"'"+match[20]+"'":match[20]);
          format += "HH";
          format += match[22];
          format += "mm";
          format += match[24];
          format += "ss";

          // add optional millisecs
          if(match[26] !== undefined) {
            // .000
            format += match[27];
            format += "SSS";
          }

          // add optional time zone
          if(match[30] !== undefined) {
            // +00:00:00
            format += "XXXXX";
          } else if(match[31] !== undefined) {
            // +00:00
            format += "XXX";
          } else if(match[32] !== undefined) {
            // +000000
            format += "XXXX";
          }else if(match[33] !== undefined) {
            // +0000
            format += "Z";
          }else if(match[34] !== undefined || match[35] !== undefined) {
            // Z or +00
            format += "X";
          }else if(match[36] !== undefined) {
            // UTC
            if(match[37] !== undefined) {
              // add optional space char
              format += match[37];
            }
            // add time zone name, up to 4 chars
            for(var i=0;i<match[38].length;i++){
              format += "z";
            }
          }

          matched = true;
        }
      }

      // match a different format
      if(!matched) {

      }

    } else {
      // time field is a number, so probably epoch or epoch_ms
      if(time > 10000000000) {
        // probably millseconds
        format = "epoch_ms";

      } else {
        // probably seconds
        format = "epoch";
      }
    }
    return format;
  }

  // generate an example time string based on a given format
  function generateExampleTime(timeFormat) {
    var exampleTime = "";

    if(timeFormat !== undefined && timeFormat !== "") {
      var now = moment();
      now.month(2);
      now.date(24);

      if(timeFormat === "epoch") {
        exampleTime = now.unix();
      } else if(timeFormat === "epoch_ms") {
        exampleTime = now.unix()*1000;
      } else {
        // Y is allowed by moment, but not for the server's time formater
        var tf = timeFormat.replace(/Y/g, "");
        exampleTime = now.formatWithJDF(tf);
      }
    }
    return exampleTime;
  }

  // add commas to large numbers
  // Number.toLocaleString is not supported on safari
  function toLocaleString(x) {
    var result = x;
    if(x && typeof x === "number") {
      var parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      result = parts.join(".");
    }
    return result;
  }

  // escape html characters
  function escapeFunc(str) {
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };
    return String(str).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  // Escapes reserved characters for use in Elasticsearch query terms.
  function escapeForElasticsearchQuery(str) {
    // Escape with a leading backslash any of the characters that
    // Elastic document may cause a syntax error when used in queries:
    // + - = && || > < ! ( ) { } [ ] ^ " ~ * ? : \ /
    // https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#_reserved_characters
    return str.replace(/[-[\]{}()+!<>=?:\/\\^"~*&|\s]/g, '\\$&');
  }

  return {
    replaceStringTokens:          replaceStringTokens,
    detectorToString:             detectorToString,
    sortByKey:                    sortByKey,
    guessDelimiters:              guessDelimiters,
    processLargeArrayAsync:       processLargeArrayAsync,
    guessTimeFormat:              guessTimeFormat,
    generateExampleTime:          generateExampleTime,
    toLocaleString:               toLocaleString,
    escape:                       escapeFunc,
    escapeForElasticsearchQuery:  escapeForElasticsearchQuery
  };
});
