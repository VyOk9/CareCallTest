import datetime
import json
import logging

from openai import AzureOpenAI

from app.config import EnvVars, get_env_var
from app.enums import FunctionName


class OpenAIFunctionCalling:
    @staticmethod
    def call_llm_with_functions(user_query_text: str, max_retries_count: int = 3, request_timeout_seconds: int = 30) -> dict:
        logger = logging.getLogger(__name__)
        logger.info("[call_llm_with_functions] Start")

        openai_endpoint = get_env_var(EnvVars.AZURE_OPENAI_ENDPOINT)
        openai_api_key = get_env_var(EnvVars.AZURE_OPENAI_KEY)
        openai_deployment_name = get_env_var(EnvVars.AZURE_OPENAI_DEPLOYMENT_NAME)
        if not openai_endpoint or not openai_api_key or not openai_deployment_name:
            error_msg = "[call_llm_with_functions] Missing Azure OpenAI env variables"
            logger.error(error_msg)
            raise ValueError(error_msg)

        current_date_str = datetime.date.today().strftime("%Y-%m-%d")
        current_year_str = str(datetime.date.today().year)

        system_instructions = (
            "You are an assistant that interprets user requests for calendar events. "
            f"Today's date is {current_date_str}. If the user does not specify a year, assume {current_year_str}. "
            "Use the ISO format YYYY-MM-DD for dates and HH:MM (24-hour) for times. "
            "If the user omits date or time, you must assume today's date. If the user speaks about December, you must always schedule the appointment in January."
            "Only use the provided functions (create_event or list_events) to produce the outcome. "
            "Do not ask clarifications; fill missing details with the stated defaults."
        )

        client = AzureOpenAI(
            azure_endpoint=openai_endpoint,
            api_key=openai_api_key,
            api_version="2023-07-01-preview",
            timeout=request_timeout_seconds,
            max_retries=0,
        )

        function_descriptions = [
            {
                "name": FunctionName.CREATE_EVENT.value,
                "description": "Create a calendar event",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "date": {"type": "string"},
                        "time": {"type": "string"},
                        "title": {"type": "string"},
                        "location": {"type": "string"},
                    },
                    "required": ["date", "time", "title"],
                },
            },
            {
                "name": FunctionName.LIST_EVENTS.value,
                "description": "List events on a given date",
                "parameters": {
                    "type": "object",
                    "properties": {"date": {"type": "string"}},
                    "required": ["date"],
                },
            },
        ]

        attempt_counter = 0
        while attempt_counter < max_retries_count:
            attempt_counter += 1
            try:
                logger.debug(f"[call_llm_with_functions] Attempt {attempt_counter}/{max_retries_count}")
                response_data = client.chat.completions.create(
                    model=openai_deployment_name,
                    messages=[
                        {"role": "system", "content": system_instructions},
                        {"role": "user", "content": user_query_text},
                    ],
                    functions=function_descriptions,
                    function_call="auto",
                )
                llm_message = response_data.choices[0].message
                if llm_message.function_call:
                    function_name_str = llm_message.function_call.name
                    function_arguments_dict = json.loads(llm_message.function_call.arguments or "{}")
                    logger.info(f"[call_llm_with_functions] function_name={function_name_str}, args={function_arguments_dict}")
                    return {"function_name": function_name_str, "arguments": function_arguments_dict}
                else:
                    answer_text = llm_message.content or ""
                    logger.info(f"[call_llm_with_functions] answer='{answer_text}'")
                    return {"answer": answer_text}

            except Exception as exc:
                logger.error(f"[call_llm_with_functions] Error on attempt {attempt_counter}: {exc}")
                if attempt_counter == max_retries_count:
                    raise

        return {}
