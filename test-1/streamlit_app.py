import http.server
import hashlib
import tempfile
import threading
import time
import urllib.parse
import webbrowser

import requests
import streamlit as st
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from streamlit_calendar import calendar as streamlit_calendar

from app.google_auth import GoogleAuth
from app.workflow_orchestrator import WorkflowError, WorkflowOrchestrator


st.set_page_config(page_title="CareCall Voice Assistant", layout="wide")

with open("style.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

if "processed_sig" not in st.session_state:
    st.session_state["processed_sig"] = None
if "cached_fn" not in st.session_state:
    st.session_state["cached_fn"] = None
if "cached_args" not in st.session_state:
    st.session_state["cached_args"] = {}
if "cached_events" not in st.session_state:
    st.session_state["cached_events"] = None
if "cached_status" not in st.session_state:
    st.session_state["cached_status"] = ""
if "cached_answer" not in st.session_state:
    st.session_state["cached_answer"] = ""

col1, col2, col3 = st.columns([1, 2, 1])
with col2:
    st.image("assets/logo.jpeg", width=120)
    st.markdown(
        "<h1 style='text-align:center;font-size:3rem;margin:0 0 1.5rem 0;color:white;'>CareCall Voice Assistant</h1>",
        unsafe_allow_html=True,
    )

GOOGLE_OAUTH_SCOPES_LIST = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/userinfo.profile",
]
CALLBACK_SERVER_HOST = "127.0.0.1"
CALLBACK_SERVER_PORT = 8599


class GoogleOAuthCallbackHandler(http.server.BaseHTTPRequestHandler):
    received_auth_code = None

    def do_GET(self):  # noqa: N802
        parsed_url = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        if "code" in query_params:
            GoogleOAuthCallbackHandler.received_auth_code = query_params["code"][0]
            page_html = (
                "<html><head><meta charset='utf-8'><title>Authentication</title>"
                "<style>body{background:#0e1117;color:#fff;font-family:sans-serif;display:flex;"
                "align-items:center;justify-content:center;height:100vh;margin:0;}"
                ".container{background:#14181e;padding:2rem;border-radius:8px;"
                "box-shadow:0 0 10px rgba(0,0,0,0.5);text-align:center;}</style></head><body>"
                "<div class='container'><h2>Authentication success</h2>"
                "<p>You can close this tab and return to Streamlit.</p></div></body></html>"
            )
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(page_html.encode("utf-8"))
        else:
            self.send_response(400)
            self.end_headers()

    def log_message(self, *args):
        return


def start_local_callback_server():
    srv = http.server.HTTPServer((CALLBACK_SERVER_HOST, CALLBACK_SERVER_PORT), GoogleOAuthCallbackHandler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()


def fetch_user_profile(access_token_str: str) -> dict:
    r = requests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={"Authorization": f"Bearer {access_token_str}"})
    if r.status_code == 200:
        return r.json()
    return {}


def show_temporary_message(msg: str) -> None:
    placeholder = st.empty()
    placeholder.success(msg)
    time.sleep(3)
    placeholder.empty()


def convert_gcal_to_calendar_events(raw_data):
    if not raw_data:
        return []
    if isinstance(raw_data, dict):
        raw_data = [raw_data]
    events_converted = []
    for item in raw_data:
        title = item.get("summary", "No title")
        start_info = item.get("start", {})
        end_info = item.get("end", {})
        start_val = start_info.get("dateTime") or start_info.get("date")
        end_val = end_info.get("dateTime") or end_info.get("date")
        if start_val and "T" not in start_val:
            start_val += "T00:00:00"
        if end_val and "T" not in end_val:
            end_val += "T00:00:00"
        if not start_val:
            continue
        events_converted.append({"title": title, "start": start_val, "end": end_val if end_val else start_val})
    return events_converted


if "googleCredentials" not in st.session_state:
    if st.button("Sign in with Google"):
        try:
            session_obj = GoogleAuth.create_google_oauth_session(GOOGLE_OAUTH_SCOPES_LIST)
            auth_url = session_obj.authorization_url("https://accounts.google.com/o/oauth2/auth", access_type="offline", prompt="consent")[0]
            start_local_callback_server()
            webbrowser.open(auth_url)
            while GoogleOAuthCallbackHandler.received_auth_code is None:
                time.sleep(0.3)
            token_data = session_obj.fetch_token(
                token_url="https://oauth2.googleapis.com/token",
                code=GoogleOAuthCallbackHandler.received_auth_code,
                client_secret=session_obj.client_secret,
            )
            profile_info = fetch_user_profile(token_data["access_token"])
            st.session_state["userName"] = profile_info.get("given_name", "Unknown")
            st.session_state["userPicture"] = profile_info.get("picture", "")
            st.session_state["googleCredentials"] = Credentials(
                token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token"),
                token_uri="https://oauth2.googleapis.com/token",
                client_id=session_obj.client_id,
                client_secret=session_obj.client_secret,
                scopes=GOOGLE_OAUTH_SCOPES_LIST,
            )
            st.rerun()
        except Exception as exc:
            st.error(f"Authentication failed: {exc}")
    st.stop()

if "hasWelcomed" not in st.session_state:
    st.session_state["hasWelcomed"] = False

if not st.session_state["hasWelcomed"]:
    show_temporary_message(f"Google authentication successful, welcome {st.session_state.get('userName', 'Unknown')}!")
    st.session_state["hasWelcomed"] = True

if st.session_state.get("userPicture"):
    st.markdown(f"<img src='{st.session_state['userPicture']}' style='border-radius:10px;width:80px;height:auto;'/>", unsafe_allow_html=True)

st.markdown(f"<h2>Welcome, {st.session_state.get('userName', 'Unknown')}!</h2>", unsafe_allow_html=True)

calendar_api_service = build("calendar", "v3", credentials=st.session_state["googleCredentials"])

calendar_list_resp = calendar_api_service.calendarList().list().execute()
cal_items = calendar_list_resp.get("items", [])
cal_options = {f"{c.get('summary', 'Unnamed')} ({c.get('id')})": c.get("id") for c in cal_items if c.get("id")}
selected_label = st.selectbox("Select target calendar", list(cal_options.keys())) if cal_options else None
selected_calendar_id = cal_options.get(selected_label, "primary") if selected_label else "primary"

audio_file_uploader = st.file_uploader("Upload an audio file")

if audio_file_uploader:
    audio_bytes = audio_file_uploader.getvalue()
    file_sig = f"{selected_calendar_id}:{hashlib.sha256(audio_bytes).hexdigest()}"

    if st.session_state["processed_sig"] != file_sig:
        workflow_placeholder = st.empty()
        workflow_placeholder.info("Running workflow...")

        suffix = ""
        if "." in audio_file_uploader.name:
            suffix = "." + audio_file_uploader.name.split(".")[-1]

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_audio:
            temp_audio.write(audio_bytes)
            local_audio_path = temp_audio.name
        try:
            workflow_result = WorkflowOrchestrator.orchestrate_workflow(
                local_audio_path,
                calendar_api_service,
                selected_calendar_id,
                max_retries=2,
            )
            workflow_placeholder.empty()
            st.session_state["processed_sig"] = file_sig
            st.session_state["cached_status"] = workflow_result.get("status", "")

            if st.session_state["cached_status"] == "answer_only":
                st.session_state["cached_answer"] = workflow_result.get("answer", "")
                st.session_state["cached_fn"] = None
                st.session_state["cached_args"] = {}
                st.session_state["cached_events"] = None
            else:
                st.session_state["cached_answer"] = ""
                st.session_state["cached_fn"] = workflow_result.get("function_name")
                st.session_state["cached_args"] = workflow_result.get("function_args", {})
                raw_calendar_data = workflow_result.get("calendar_result", "")
                st.session_state["cached_events"] = convert_gcal_to_calendar_events(raw_calendar_data)

        except WorkflowError as w_err:
            workflow_placeholder.empty()
            st.error(f"Workflow failed: {w_err}")

    function_invoked = st.session_state["cached_fn"]
    final_calendar_events = st.session_state["cached_events"]
    status_val = st.session_state.get("cached_status", "")

    if status_val == "success":
        if function_invoked == "create_event":
            date_arg = st.session_state["cached_args"].get("date", "N/A")
            time_arg = st.session_state["cached_args"].get("time", "N/A")
            st.success(f"Event created for {date_arg} at {time_arg}.")
            if final_calendar_events:
                streamlit_calendar(
                    events=final_calendar_events,
                    options={
                        "initialView": "dayGridMonth",
                        "editable": False,
                        "selectable": False,
                        "themeSystem": "auto",
                        "initialDate": final_calendar_events[0]["start"].split("T")[0],
                        "contentHeight": 500,
                        "eventClick": False,
                        "dateClick": False,
                    },
                    key="calendarCreateKey",
                )
        elif function_invoked == "list_events":
            day_arg = st.session_state["cached_args"].get("date", "N/A")
            st.success(f"Events listed for {day_arg}.")
            if not final_calendar_events:
                st.info("You have no events for that date.")
            else:
                streamlit_calendar(
                    events=final_calendar_events,
                    options={
                        "initialView": "dayGridMonth",
                        "editable": False,
                        "selectable": False,
                        "themeSystem": "auto",
                        "contentHeight": 500,
                        "eventClick": False,
                        "dateClick": False,
                    },
                    key="calendarListKey",
                )
        else:
            st.warning("Unknown function call, no calendar to display.")
    elif status_val == "answer_only":
        ans = st.session_state.get("cached_answer", "")
        st.info(ans if ans else "No answer returned.")
    elif status_val == "no_speech":
        st.warning("No speech recognized.")
    else:
        st.info("Upload an audio file to start the workflow.")
else:
    st.info("Upload an audio file to start the workflow.")
