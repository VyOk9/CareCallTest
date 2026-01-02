import datetime
import logging
import time
from typing import Any

from googleapiclient.discovery import Resource

from app.enums import FunctionName


class GoogleCalendarIntegration:
    @staticmethod
    def create_google_event(calendar_service: Resource, calendar_id: str, date_str: str, time_str: str, summary: str, location: str = "") -> dict[str, Any]:
        logging.info("[create_google_event] start")
        date_obj = datetime.datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M")
        body = {
            "summary": summary,
            "location": location,
            "start": {"dateTime": date_obj.isoformat(), "timeZone": "UTC"},
            "end": {"dateTime": (date_obj + datetime.timedelta(hours=1)).isoformat(), "timeZone": "UTC"},
        }
        event = calendar_service.events().insert(calendarId=calendar_id, body=body).execute()
        logging.info(f"[create_google_event] event created: {event.get('id')}")
        return event

    @staticmethod
    def list_google_events(calendar_service: Resource, calendar_id: str, date_str: str) -> list[dict[str, Any]]:
        logging.info("[list_google_events] start")
        date_only = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        start_iso = date_only.strftime("%Y-%m-%dT00:00:00Z")
        end_date = date_only + datetime.timedelta(days=1)
        end_iso = end_date.strftime("%Y-%m-%dT00:00:00Z")
        response = calendar_service.events().list(calendarId=calendar_id, timeMin=start_iso, timeMax=end_iso, singleEvents=True, orderBy="startTime").execute()
        events = response.get("items", [])
        logging.info(f"[list_google_events] {len(events)} events found")
        logging.info(f"[list_google_events] events detail: {events}")
        return events

    @staticmethod
    def perform_calendar_operation(calendar_service: Resource, calendar_id: str, function_name: str, args: dict[str, Any], max_retries: int = 3) -> Any:
        logging.info("[perform_calendar_operation] start")
        attempt = 0
        while attempt < max_retries:
            attempt += 1
            logging.debug(f"[perform_calendar_operation] attempt {attempt}/{max_retries}")
            try:
                if function_name == FunctionName.CREATE_EVENT.value:
                    return GoogleCalendarIntegration.create_google_event(calendar_service, calendar_id, args["date"], args["time"], args["title"], args.get("location", ""))
                if function_name == FunctionName.LIST_EVENTS.value:
                    return GoogleCalendarIntegration.list_google_events(calendar_service, calendar_id, args["date"])
                logging.warning(f"[perform_calendar_operation] unknown function_name: {function_name}")
                return {}
            except Exception as ex:
                logging.error(f"[perform_calendar_operation] error on attempt {attempt}: {ex}")
                if attempt == max_retries:
                    raise
                time.sleep(1)
        return {}
