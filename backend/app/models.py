"""Persistent worker, user, policy, disruption, claim and payout tables, including exact INR storage."""

from datetime import date, datetime, timezone
from decimal import Decimal
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, CheckConstraint, Date, DateTime, Enum as SQLEnum, Float, ForeignKey
from sqlalchemy import Integer, Numeric, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

from app.database import Base


class Platform(str, Enum):
    SWIGGY = "Swiggy"
    ZOMATO = "Zomato"
    ZEPTO = "Zepto"


class UserRole(str, Enum):
    ADMIN = "admin"
    WORKER = "worker"


class INRAmount(TypeDecorator):
    """Decimal rupees in Python
    integer paise in SQLite
    NUMERIC elsewhere.
    """

    impl = Numeric(12, 2)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "sqlite":
            return dialect.type_descriptor(BigInteger())
        return dialect.type_descriptor(Numeric(12, 2, asdecimal=True))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        amount = Decimal(value)
        if not amount.is_finite() or amount != amount.quantize(Decimal("0.01")):
            raise ValueError("Income must be a finite amount with at most two decimal places")
        return int(amount * 100) if dialect.name == "sqlite" else amount

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        amount = Decimal(value)
        if dialect.name == "sqlite":
            amount /= 100
        return amount.quantize(Decimal("0.01"))


def _enum_column(enum_cls):
    return SQLEnum(enum_cls, native_enum=False, create_constraint=True,
                   values_callable=lambda items: [item.value for item in items])


class Worker(Base):
    __tablename__ = "workers"
    __table_args__ = (
        CheckConstraint("average_daily_income > 0", name="positive_income"),
        CheckConstraint("experience_days >= 0", name="non_negative_experience"),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    platform: Mapped[Platform] = mapped_column(_enum_column(Platform), nullable=False)
    average_daily_income: Mapped[Decimal] = mapped_column(INRAmount(), nullable=False)
    experience_days: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    username: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        _enum_column(UserRole), nullable=False, default=UserRole.WORKER,
    )
    worker_id: Mapped[UUID | None] = mapped_column(
        Uuid, ForeignKey("workers.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    worker: Mapped[Worker | None] = relationship()


# ---------------------------------------------------------------------------
# Claims layer (new)
# ---------------------------------------------------------------------------

class DisruptionType(str, Enum):
    RAIN = "rain"
    HEAT = "heat"
    AQI = "aqi"
    FLOOD = "flood"
    CURFEW = "curfew"


class PolicyStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class ClaimStatus(str, Enum):
    PENDING = "pending"    # created by trigger engine, waiting for fraud check
    APPROVED = "approved"  # fraud score < 30
    REVIEW = "review"      # fraud score 30-60
    REJECTED = "rejected"  # fraud score > 60


class Policy(Base):
    """One week of coverage for one worker."""
    __tablename__ = "policies"
    __table_args__ = (CheckConstraint("week_end >= week_start", name="valid_policy_week"),)

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    worker_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("workers.id", ondelete="CASCADE"), index=True, nullable=False
    )
    week_start: Mapped[date] = mapped_column(Date, nullable=False)
    week_end: Mapped[date] = mapped_column(Date, nullable=False)
    premium: Mapped[Decimal] = mapped_column(INRAmount(), nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[PolicyStatus] = mapped_column(
        _enum_column(PolicyStatus), nullable=False, default=PolicyStatus.ACTIVE
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class DisruptionEvent(Base):
    """A detected (or simulated) disruption in a city."""
    __tablename__ = "disruption_events"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    city: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    disruption_type: Mapped[DisruptionType] = mapped_column(_enum_column(DisruptionType), nullable=False)
    measured_value: Mapped[float] = mapped_column(Float, nullable=False)
    severity_pct: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_hours: Mapped[float] = mapped_column(Float, nullable=False)
    source: Mapped[str] = mapped_column(String(20), nullable=False)  # "api" | "simulated"
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class Claim(Base):
    """Auto-created by the trigger engine. Workers never file these."""
    __tablename__ = "claims"
    __table_args__ = (UniqueConstraint("policy_id", "event_id", name="one_claim_per_policy_event"),)

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    policy_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("policies.id", ondelete="CASCADE"), index=True)
    worker_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("workers.id", ondelete="CASCADE"), index=True)
    event_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("disruption_events.id", ondelete="CASCADE"))
    payout_amount: Mapped[Decimal] = mapped_column(INRAmount(), nullable=False)
    status: Mapped[ClaimStatus] = mapped_column(
        _enum_column(ClaimStatus), nullable=False, default=ClaimStatus.PENDING
    )
    fraud_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # filled by fraud engine
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


class Payout(Base):
    """Money actually released for an approved claim."""
    __tablename__ = "payouts"

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    claim_id: Mapped[UUID] = mapped_column(
        Uuid, ForeignKey("claims.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    worker_id: Mapped[UUID] = mapped_column(Uuid, ForeignKey("workers.id", ondelete="CASCADE"), index=True)
    amount: Mapped[Decimal] = mapped_column(INRAmount(), nullable=False)
    paid_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
