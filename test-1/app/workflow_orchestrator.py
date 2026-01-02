import logging
import time
from typing import Any

from googleapiclient.discovery import Resource

from app.audio_upload import AudioUpload, AudioUploadError
from app.azure_speech_service import AzureSpeechService, SpeechToTextError
from app.config import EnvVars, get_env_var
from app.google_auth import AuthError, get_google_auth_url
from app.google_calendar_integration import GoogleCalendarIntegration
from app.openai_function_calling import OpenAIFunctionCalling


class ConfigError(Exception):
    pass


class WorkflowError(Exception):
    pass


class WorkflowOrchestrator:
    @staticmethod
    def check_environment() -> bool:
        logging.info("[check_environment] check_environment")
        for var in EnvVars:
            val = get_env_var(var)
            if not val:
                msg = f"[check_environment] Missing env var {var.value}"
                logging.error(msg)
                raise ConfigError(msg)
        return True

    @staticmethod
    def generate_google_auth_url(scope: list[str]) -> str:
        url = get_google_auth_url(scope)
        logging.info("[generate_google_auth_url] generate_google_auth_url done")
        return url

    @staticmethod
    def orchestrate_workflow(audio_file_path: str, calendar_service: Resource, calendar_id: str, max_retries: int = 3) -> dict[str, Any]:
        logger = logging.getLogger(__name__)
        logger.info("[orchestrate_workflow] orchestrate_workflow Start")
        attempt = 0
        while attempt < max_retries:
            attempt += 1
            logger.debug(f"[orchestrate_workflow] Attempt {attempt}/{max_retries}")
            try:
                uploaded = AudioUpload.handle_audio_upload(audio_file_path)
                recognized = AzureSpeechService.transcribe_audio(uploaded)
                if not recognized:
                    logger.warning("[orchestrate_workflow] No speech recognized")
                    return {"status": "no_speech"}
                llm_result = OpenAIFunctionCalling.call_llm_with_functions(recognized)
                if "function_name" not in llm_result:
                    return {"status": "answer_only", "answer": llm_result.get("answer", "")}
                fn_name = llm_result["function_name"]
                fn_args = llm_result["arguments"]
                res_cal = GoogleCalendarIntegration.perform_calendar_operation(calendar_service, calendar_id, fn_name, fn_args)
                return {"status": "success", "function_name": fn_name, "function_args": fn_args, "calendar_result": res_cal}
            except (AudioUploadError, SpeechToTextError) as ex:
                logger.error(f"[orchestrate_workflow] Audio or STT error on attempt {attempt}: {ex}")
                if attempt == max_retries:
                    raise WorkflowError(str(ex)) from ex
                time.sleep(1)
            except AuthError as ex:
                logger.error(f"[orchestrate_workflow] Auth error: {ex}")
                raise WorkflowError("Authentication error") from ex
            except Exception as ex:
                logger.error(f"[orchestrate_workflow] Unexpected error: {ex}")
                if attempt == max_retries:
                    raise WorkflowError("Unexpected workflow error") from ex
                time.sleep(1)
        return {}
