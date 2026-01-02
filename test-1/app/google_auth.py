import logging

import requests
from requests_oauthlib import OAuth2Session

from app.config import EnvVars, get_env_var


class AuthError(Exception):
    pass


class NetworkError(Exception):
    pass


class GoogleAuth:
    @staticmethod
    def create_google_oauth_session(scope: list[str]) -> OAuth2Session:
        client_id = get_env_var(EnvVars.GOOGLE_CLIENT_ID)
        client_secret = get_env_var(EnvVars.GOOGLE_CLIENT_SECRET)
        redirect_uri = get_env_var(EnvVars.GOOGLE_REDIRECT_URI)
        if not client_id or not client_secret or not redirect_uri:
            logging.error("[create_google_oauth_session] Missing or empty Google OAuth credentials")
            raise AuthError("[create_google_oauth_session] Invalid Google OAuth credentials")
        session = OAuth2Session(client_id=client_id, redirect_uri=redirect_uri, scope=scope)
        session.client_secret = client_secret
        logging.info("[create_google_oauth_session] OAuth session created")
        return session

    @staticmethod
    def get_google_auth_url(scope: list[str]) -> str:
        try:
            sess = GoogleAuth.create_google_oauth_session(scope)
            url, _ = sess.authorization_url("https://accounts.google.com/o/oauth2/auth", access_type="offline", prompt="consent")
            logging.info(f"[get_google_auth_url] Successfully built Google OAuth URL: {url}")
            return url
        except requests.exceptions.RequestException as e:
            logging.error(f"[get_google_auth_url] Network issue contacting Google: {e}")
            raise NetworkError("[get_google_auth_url] Failed to retrieve Google OAuth URL") from e
        except AuthError:
            logging.error("[get_google_auth_url] AuthError: invalid or missing Google credentials")
            raise


get_google_auth_url = GoogleAuth.get_google_auth_url
