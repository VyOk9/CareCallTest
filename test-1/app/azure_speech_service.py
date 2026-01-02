import time
import threading

from azure.cognitiveservices.speech import (
    AudioConfig,
    CancellationReason,
    ResultReason,
    SpeechConfig,
    SpeechRecognizer,
)

from app.config import EnvVars, get_env_var
from app.enums import AzureSpeechSettings


class SpeechToTextError(Exception):
    pass


class AzureSpeechService:
    DEFAULT_REGION = "francecentral"

    @staticmethod
    def transcribe_audio(file_path: str, max_retries: int = 3, timeout_seconds: int = 90) -> str:
        key = get_env_var(EnvVars.AZURE_SPEECH_KEY)
        region = get_env_var(EnvVars.AZURE_SPEECH_REGION, default=AzureSpeechService.DEFAULT_REGION)
        if not key:
            raise SpeechToTextError("[transcribe_audio] Missing Azure Speech key")
        speech_config = SpeechConfig(subscription=key, region=region)
        speech_config.speech_recognition_language = AzureSpeechSettings.LANGUAGE.value
        for attempt in range(1, max_retries + 1):
            try:
                audio_config = AudioConfig(filename=file_path)
                recognizer = SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

                parts: list[str] = []
                done = threading.Event()
                err_msg: str | None = None

                def on_recognized(evt):
                    if evt.result.reason == ResultReason.RecognizedSpeech and evt.result.text:
                        parts.append(evt.result.text)

                def on_canceled(evt):
                    nonlocal err_msg
                    details = evt.cancellation_details
                    if details and details.reason == CancellationReason.Error:
                        print(
                            f"[transcribe_audio] Cancelled(ERROR): reason={details.reason}, code={details.code}, details={details.error_details}"
                        )
                        err_msg = details.error_details or "[transcribe_audio] Azure Speech error"
                    done.set()

                def on_stopped(evt):
                    done.set()

                recognizer.recognized.connect(on_recognized)
                recognizer.canceled.connect(on_canceled)
                recognizer.session_stopped.connect(on_stopped)

                start_time = time.time()
                recognizer.start_continuous_recognition()

                finished = done.wait(timeout_seconds)
                recognizer.stop_continuous_recognition()

                elapsed = time.time() - start_time
                if not finished:
                    raise SpeechToTextError(f"[transcribe_audio] Timed out after {elapsed:.1f}s")

                if err_msg:
                    raise SpeechToTextError(err_msg)

                text = " ".join(parts).strip()
                if text:
                    print(f"[transcribe_audio] Transcription success '{text}'")
                    return text

                print("[transcribe_audio] No speech recognized")
                return ""
            except SpeechToTextError:
                raise
            except Exception as exc:
                print(f"[transcribe_audio] Attempt {attempt}/{max_retries} failed: {exc}")
                if attempt == max_retries:
                    raise SpeechToTextError("[transcribe_audio] Network or system error after retries") from exc
                time.sleep(1)
        return ""
