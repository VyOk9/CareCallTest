import os
from enum import Enum

from dotenv import load_dotenv


load_dotenv()


class EnvVars(str, Enum):
    AZURE_OPENAI_ENDPOINT = "AZURE_OPENAI_ENDPOINT"
    AZURE_OPENAI_KEY = "AZURE_OPENAI_KEY"
    AZURE_OPENAI_DEPLOYMENT_NAME = "AZURE_OPENAI_DEPLOYMENT_NAME"
    AZURE_SPEECH_KEY = "AZURE_SPEECH_KEY"
    AZURE_SPEECH_REGION = "AZURE_SPEECH_REGION"
    GOOGLE_CLIENT_ID = "GOOGLE_CLIENT_ID"
    GOOGLE_CLIENT_SECRET = "GOOGLE_CLIENT_SECRET"
    GOOGLE_REDIRECT_URI = "GOOGLE_REDIRECT_URI"


def get_env_var(key: EnvVars, *, default: str = "") -> str:
    return os.getenv(key.value, default).strip()
