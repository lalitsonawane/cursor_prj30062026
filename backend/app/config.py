from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    api_key: str = "dev-key-change-me"
    model_path: str = "nvidia/LocateAnything-3B"
    mock_inference: bool = True
    max_image_bytes: int = 5_000_000
    max_image_edge: int = 1280
    generation_mode: str = "fast"
    max_new_tokens: int = 2048
    scene_lister_mode: str = "taxonomy"  # taxonomy | openai
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    fireworks_api_key: str = ""
    fireworks_model: str = "accounts/fireworks/models/deepseek-v4-pro"
    fireworks_base_url: str = "https://api.fireworks.ai/inference/v1"
    llm_provider: str = "fireworks"  # fireworks | openai | local
    cors_origins: str = "*"
    host: str = "0.0.0.0"
    port: int = 8000


settings = Settings()
