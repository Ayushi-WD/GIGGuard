"""Persistent worker and user tables, including exact INR storage."""

from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from uuid import UUID, uuid4

from sqlalchemy import BigInteger, CheckConstraint, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy import Integer, Numeric, String, Uuid
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
    """Decimal rupees in Python; integer paise in SQLite; NUMERIC elsewhere.

    SQLite NUMERIC affinity can store fractional amounts as floating point.
    Integer paise avoids that loss of precision in the local database.
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


class Worker(Base):
    __tablename__ = "workers"
    __table_args__ = (
        CheckConstraint("average_daily_income > 0", name="positive_income"),
        CheckConstraint("experience_days >= 0", name="non_negative_experience"),
    )

    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    platform: Mapped[Platform] = mapped_column(
        SQLEnum(Platform, native_enum=False, create_constraint=True,
                values_callable=lambda items: [item.value for item in items]),
        nullable=False,
    )
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
        SQLEnum(UserRole, native_enum=False, create_constraint=True,
                values_callable=lambda items: [item.value for item in items]),
        nullable=False,
        default=UserRole.WORKER,
    )
    worker_id: Mapped[UUID | None] = mapped_column(
        Uuid, ForeignKey("workers.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    worker: Mapped[Worker | None] = relationship()
