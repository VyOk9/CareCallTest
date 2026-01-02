import logging
import os
import shutil

from pydub import AudioSegment

from app.enums import AllowedAudioExtension


class AudioUploadError(Exception):
    pass


class AudioUpload:
    @staticmethod
    def convert_audio_to_wav(source_path: str) -> str:
        wav_path = os.path.splitext(source_path)[0] + ".wav"
        logging.info(f"[convert_audio_to_wav] Converting {source_path} to WAV")
        audio = AudioSegment.from_file(source_path)
        audio = audio.set_channels(1).set_frame_rate(16000).set_sample_width(2)
        audio.export(wav_path, format="wav")
        logging.info(f"[convert_audio_to_wav] Conversion complete: {wav_path}")
        return wav_path

    @staticmethod
    def handle_audio_upload(file_path: str, upload_dir: str = "temp_audio") -> str:
        if not os.path.isfile(file_path):
            logging.error(f"[handle_audio_upload] File not found: {file_path}")
            raise AudioUploadError("[handle_audio_upload] File does not exist")
        extension = os.path.splitext(file_path)[1].lower()
        valid_exts = [ext.value for ext in AllowedAudioExtension]
        if extension not in valid_exts:
            logging.error(f"[handle_audio_upload] Invalid extension: {extension}")
            raise AudioUploadError("[handle_audio_upload] Unsupported audio format")
        try:
            os.makedirs(upload_dir, exist_ok=True)
            dest = os.path.join(upload_dir, os.path.basename(file_path))
            shutil.copy2(file_path, dest)
            logging.info(f"[handle_audio_upload] File uploaded to {dest}")
            if extension != ".wav":
                try:
                    dest = AudioUpload.convert_audio_to_wav(dest)
                except Exception as ex:
                    logging.error(f"[handle_audio_upload] Conversion error: {str(ex)}")
                    raise AudioUploadError("[handle_audio_upload] Failed to convert audio") from ex
            return dest
        except OSError as e:
            logging.error(f"[handle_audio_upload] Failed to copy file: {str(e)}")
            raise AudioUploadError("[handle_audio_upload] Error during file copy") from e
