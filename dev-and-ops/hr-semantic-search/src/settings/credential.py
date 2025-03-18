from pydantic_settings import BaseSettings
from pydantic import Field 

class CredentialSettings(BaseSettings):
    OPENAI:str=Field(validation_alias='OPENAI_API_KEY')