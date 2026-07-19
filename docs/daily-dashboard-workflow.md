# My Daily Dashboard Workflow

This document captures the Daily Dashboard workflow requested for the connected Google apps environment. It is designed to be used by an automation runner that has direct access to Gmail, Google Calendar, Google Drive, Google Sites, and scheduled task creation.

## Required connected apps and permissions

Before the workflow can run, the automation environment must be connected to and approved for:

- Gmail: read new and unread messages, retrieve thread metadata, and generate account-scoped message links.
- Google Calendar: read events for today and the next seven days.
- Google Drive: search and read metadata for files connected to meetings, projects, deadlines, and action emails.
- Google Sites: search for, create, and update a Site named `My Daily Dashboard` while preserving its URL.
- Scheduler or Tasks: run the workflow every day at 8:00 AM in the user's local time zone.
- Notifications: notify the user when a dashboard update completes or when a source cannot be accessed.

The workflow must not send emails, delete or move files, change calendar events, make purchases, share private information, or perform other outside actions unless the user explicitly approves them.

## Run sequence

Every run must use the connected apps directly and must not depend only on files uploaded inside a ChatGPT Project.

1. Read Google Calendar events for today and the next seven days.
2. Read new and unread Gmail messages.
3. Prioritize emails that need a reply, include a deadline, involve money or contracts, include a booking or appointment, provide an important update, or require the user to complete an action.
4. Ignore newsletters, advertisements, promotions, and low-value automated notifications unless they contain a genuine urgent item.
5. Search Google Drive for files connected to today's meetings, current projects, upcoming deadlines, emails requiring action, and documents likely needed today.
6. Build the dashboard sections listed below using only information supported by Gmail, Calendar, and Drive data.
7. Search Google Sites for an existing Site named `My Daily Dashboard`.
8. If the Site exists, update that exact Site and preserve its URL.
9. If the Site does not exist, create it using the name `My Daily Dashboard`.
10. Verify the Site update succeeds.
11. Notify the user with the Site name, Site URL, next scheduled run, and any missing permissions or failed source updates.

## Dashboard sections

### Daily Summary

Include:

- Today's date.
- The three most important priorities.
- The first appointment.
- The most urgent email.
- Anything important the user may have forgotten.

### Today's Schedule

Show all events in time order with:

- Start time.
- End time.
- Title.
- Useful details.
- Overlapping events and possible conflicts.
- Meetings that may require preparation.

### Important Emails

Show only the most important emails. For each item, include:

- Sender.
- Subject.
- Short summary.
- Action the user needs to take.
- One label: `Urgent`, `Reply Needed`, `Payment`, `Deadline`, `Waiting`, or `Information`.
- Link to the original email when possible.

Do not display full private email bodies or sensitive information on the dashboard.

### Tasks

Create tasks using real information from Gmail, Calendar, and Drive. Put the most important tasks first. Include deadlines when available. Do not invent unsupported tasks.

### Upcoming Deadlines

Show important deadlines and events during the next seven days. Explain what the user needs to do before each deadline.

### Files I May Need

Show useful Google Drive files for today's meetings, projects, and tasks. Explain briefly why each file may be useful and include a link when possible.

### Suggested Daily Plan

Create a realistic plan around existing calendar events. Include time for important email replies, at least one focused-work block, and reasonable breaks. Do not schedule work over an existing calendar event.

## Site design requirements

Create or update a clean, mobile-friendly Site named `My Daily Dashboard` with simple cards for:

- Daily Summary
- Schedule
- Important Emails
- Tasks
- Upcoming Deadlines
- Files
- Daily Plan

Keep the dashboard easy to scan on a phone. Use short summaries instead of full private messages or sensitive document contents. Links should require the user's account access whenever appropriate.

## Current environment status

This repository does not include connected Gmail, Google Calendar, Google Drive, Google Sites, or scheduler credentials. A live first run cannot be completed from this repository alone until those connections are approved in the automation environment.
