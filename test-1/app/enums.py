import enum


class AzureSpeechSettings(str, enum.Enum):
    LANGUAGE = "fr-FR"


class FunctionName(str, enum.Enum):
    CREATE_EVENT = "create_event"
    LIST_EVENTS = "list_events"
