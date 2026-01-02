import time

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
    def transcribe_audio(file_path: str, max_retries: int = 3, timeout_seconds: int = 15) -> str:
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
                start_time = time.time()
                result = recognizer.recognize_once_async().get()
                elapsed = time.time() - start_time
                if elapsed > timeout_seconds:
                    raise SpeechToTextError(f"[transcribe_audio] Timed out after {elapsed:.1f}s")
                if result.reason == ResultReason.RecognizedSpeech:
                    print(f"[transcribe_audio] Transcription success '{result.text}'")
                    return result.text
                details = result.cancellation_details
                if details:
                    print(f"[transcribe_audio] Cancelled: reason={details.reason}, code={details.code}, details={details.error_details}")
                    if details.reason == CancellationReason.Error:
                        raise SpeechToTextError(details.error_details)
                else:
                    print(f"[transcribe_audio] No speech recognized (reason={result.reason})")
                return ""
            except SpeechToTextError:
                raise
            except Exception as exc:
                print(f"[transcribe_audio] Attempt {attempt}/{max_retries} failed: {exc}")
                if attempt == max_retries:
                    raise SpeechToTextError("[transcribe_audio] Network or system error after retries") from exc
                time.sleep(1)
        return ""
