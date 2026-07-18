import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CandidateBase(BaseModel):
    first_name: str = Field(min_length=2, max_length=80)
    last_name: str = Field(min_length=2, max_length=80)
    middle_name: str | None = Field(default=None, max_length=80)
    birth_date: date | None = None
    gender: str | None = None
    phone: str = Field(min_length=7, max_length=30)
    email: EmailStr
    region: str | None = None
    city: str | None = None
    address: str | None = None
    education: str | None = None
    speciality: str | None = None
    work_experience: str | None = None
    skills: str | None = None
    languages: str | None = None
    desired_direction: str | None = None
    desired_position: str | None = None
    source: str | None = None
    notes: str | None = None
    recruiter_id: uuid.UUID | None = None


class CandidateCreate(CandidateBase):
    create_account: bool = False


class CandidateUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=2, max_length=80)
    last_name: str | None = Field(default=None, min_length=2, max_length=80)
    middle_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    region: str | None = None
    city: str | None = None
    address: str | None = None
    education: str | None = None
    speciality: str | None = None
    work_experience: str | None = None
    skills: str | None = None
    languages: str | None = None
    desired_direction: str | None = None
    desired_position: str | None = None
    source: str | None = None
    notes: str | None = None
    recruiter_id: uuid.UUID | None = None


class StageView(BaseModel):
    id: int
    code: str
    name: str
    position: int
    model_config = ConfigDict(from_attributes=True)


class CandidateView(CandidateBase):
    id: uuid.UUID
    public_id: str
    status: str
    state: str
    stage: StageView
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class StageMove(BaseModel):
    stage_id: int
    comment: str | None = Field(default=None, max_length=1000)
    rejection_reason: str | None = Field(default=None, max_length=1000)


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class TagsUpdate(BaseModel):
    tags: list[str] = Field(max_length=20)
