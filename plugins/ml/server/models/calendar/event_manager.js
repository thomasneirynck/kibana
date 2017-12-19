/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import Boom from 'boom';

export class EventManager {

  constructor(callWithRequest) {
    this.callWithRequest = callWithRequest;
  }

  async getCalendarEvents(calendarId, jobId) {
    try {
      const resp = await this.callWithRequest('ml.events', { calendarId });
      const events = resp.events;
      if (events.length) {
        return events[0];
      } else {
        const extraText = (jobId === undefined) ? '' : ` and job "${jobId}"`;
        throw Boom.notFound(`Events for calendar "${calendarId}"${extraText} not found`);
      }
    } catch (error) {
      throw Boom.badRequest(error);
    }
  }

  async getAllEvents(jobId) {
    const calendarId = '_all';
    try {
      const resp = await this.callWithRequest('ml.events', { calendarId, jobId });
      const events = resp.events;
      if (events.length) {
        return events[0];
      } else {
        const extraText = (jobId === undefined) ? '' : ` and job "${jobId}"`;
        throw Boom.notFound(`Events for calendar "${calendarId}"${extraText} not found`);
      }
    } catch (error) {
      throw Boom.badRequest(error);
    }
  }

  async newEvent(calendarId, events) {
    const body = events;
    try {
      return await this.callWithRequest('ml.events', { calendarId, body });
    } catch (error) {
      return Boom.badRequest(error);
    }
  }

  async deleteEvent(calendarId, eventId) {
    return this.callWithRequest('ml.deleteEvent', { calendarId, eventId });
  }

  isEqual(ev1, ev2) {
    return (ev1.event_id === ev2.event_id &&
      ev1.description === ev2.description &&
      ev1.start === ev2.start &&
      ev1.end === ev2.end);
  }
}
