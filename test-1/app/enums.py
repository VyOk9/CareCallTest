import enum


class AllowedAudioExtension(str, enum.Enum):
    M4A = ".m4a"
    MP3 = ".mp3"
    WAV = ".wav"


class AzureSpeechSettings(str, enum.Enum):
    LANGUAGE = "fr-FR"


class FunctionName(str, enum.Enum):
    CREATE_EVENT = "create_event"
    LIST_EVENTS = "list_events"
