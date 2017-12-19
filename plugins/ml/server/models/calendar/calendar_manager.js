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
import { EventManager } from './event_manager';

export class CalendarManager {

  constructor(callWithRequest) {
    this.callWithRequest = callWithRequest;
    this.eventManager = new EventManager(callWithRequest);
  }

  async getCalendar(calendarId) {
    try {
      const resp = await this.callWithRequest('ml.calendars', { calendarId });
      const calendars = resp.calendars;
      if (calendars.length) {
        const calendar = calendars[0];
        calendar.events = await this.eventManager.getCalendarEvents(calendarId);
        return calendar;
      } else {
        return Boom.notFound(`Calendar with the id "${calendarId}" not found`);
      }
    } catch (error) {
      throw Boom.badRequest(error);
    }
  }

  async getAllCalendars() {
    try {
      const calendarsResp = await this.callWithRequest('ml.calendars');
      const events = await this.eventManager.getAllEvents();
      const calendars = calendarsResp.calendars;

      // loop events and combine with related calendars
      events.forEach((event) => {
        const calendar = calendars.find((cal) => cal.calendar_id === event.calendar_id);
        if (calendar) {
          if (calendar.events === undefined) {
            calendar.events = [];
          }
          calendar.events.push(event);
        }
      });
      return calendars;
    } catch (error) {
      throw Boom.badRequest(error);
    }
  }

  async newCalendar(calendar) {
    const calendarId = calendar.calendarId;
    const events = calendar.events;
    delete calendar.calendarId;
    delete calendar.events;
    try {
      await this.callWithRequest('ml.addCalendar', { calendarId, body: calendar });
      await this.eventManager.newEvent(calendarId, events);

      // return await this.getCalendar(calendarId); do this?????
      return;
    } catch (error) {
      return Boom.badRequest(error);
    }
  }

  async updateCalendar(calendarId, calendar) {
    const origCalendar = await this.getCalendar(calendarId);
    try {
      // update job_ids
      await this.callWithRequest('ml.updateCalendar', { calendarId, body: calendar });

      // workout the differences between the original events list and the new one
      // if an event has no event_id, it must be new
      const eventsToAdd = calendar.events.filter((event) => (event.event_id === undefined));

      // if an event in the original calendar cannot be found, it must have been deleted
      const eventsToRemove = origCalendar.events.filter((event) => (
        calendar.events.find(e => this.eventManager.isEqual(e, event)) === undefined
      ));

      // note, both of the loops below could be removed if the add and delete endpoints
      // allowed multiple events

      // add all new events
      await Promise.all(eventsToAdd.map(async (event) => {
        await this.eventManager.newEvent(calendarId, event);
      }));

      // remove all removed events
      await Promise.all(eventsToRemove.map(async (event) => {
        await this.eventManager.deleteEvent(calendarId, event.event_id);
      }));

    } catch (error) {
      return Boom.badRequest(error);
    }

    return {};
  }

  async deleteCalendar(calendarId) {
    return this.callWithRequest('ml.deleteCalendar', { calendarId });
  }

}
