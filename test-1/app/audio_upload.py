import logging
import os
import shutil

from pydub import AudioSegment


class AudioUploadError(Exception):
    pass


class AudioUpload:
    @staticmethod
    def convert_audio_to_wav(source_path: str) -> str:
        base, ext = os.path.splitext(source_path)
        ext = ext.lower()
        wav_path = source_path if ext == ".wav" else base + ".wav"
        logging.info(f"[convert_audio_to_wav] Converting {source_path} to WAV (normalized)")
        audio = AudioSegment.from_file(source_path)
        audio = audio.set_channels(1).set_frame_rate(16000).set_sample_width(2)
        tmp_path = wav_path + ".tmp"
        audio.export(tmp_path, format="wav")
        os.replace(tmp_path, wav_path)

        logging.info(f"[convert_audio_to_wav] Conversion complete: {wav_path}")
        return wav_path

    @staticmethod
    def handle_audio_upload(file_path: str, upload_dir: str = "temp_audio") -> str:
        if not os.path.isfile(file_path):
            logging.error(f"[handle_audio_upload] File not found: {file_path}")
            raise AudioUploadError("[handle_audio_upload] File does not exist")

        try:
            os.makedirs(upload_dir, exist_ok=True)
            dest = os.path.join(upload_dir, os.path.basename(file_path))
            shutil.copy2(file_path, dest)
            logging.info(f"[handle_audio_upload] File uploaded to {dest}")
            try:
                AudioSegment.from_file(dest)
            except Exception as ex:
                logging.error(f"[handle_audio_upload] Unreadable/unsupported audio file: {ex}")
                raise AudioUploadError("[handle_audio_upload] Unsupported or unreadable audio file") from ex

            try:
                dest = AudioUpload.convert_audio_to_wav(dest)
            except Exception as ex:
                logging.error(f"[handle_audio_upload] Conversion error: {str(ex)}")
                raise AudioUploadError("[handle_audio_upload] Failed to convert audio") from ex

            return dest
        except OSError as e:
            logging.error(f"[handle_audio_upload] Failed to copy file: {str(e)}")
            raise AudioUploadError("[handle_audio_upload] Error during file copy") from e
