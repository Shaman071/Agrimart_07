# AgriMart Backend - Order State Machine
# Enforces valid status transitions in one place

from enum import Enum
from typing import List, Tuple
from dataclasses import dataclass


class OrderStatus(str, Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    DISPATCHED = "Dispatched"
    COMPLETED = "Completed"
    DISPUTED = "Disputed"


class TransportStatus(str, Enum):
    PICKED_UP = "Picked Up"
    IN_TRANSIT = "In Transit"
    ARRIVED = "Arrived"


class TransactionStatus(str, Enum):
    LOCKED = "Locked"
    RELEASED = "Released"
    REFUNDED = "Refunded"


# Valid transitions: (from_status, [allowed_to_statuses])
VALID_TRANSITIONS: List[Tuple[OrderStatus, List[OrderStatus]]] = [
    (OrderStatus.PENDING, [OrderStatus.ACCEPTED, OrderStatus.DISPUTED]),
    (OrderStatus.ACCEPTED, [OrderStatus.DISPATCHED, OrderStatus.DISPUTED]),
    (OrderStatus.DISPATCHED, [OrderStatus.COMPLETED, OrderStatus.DISPUTED]),
    (OrderStatus.COMPLETED, []),  # Terminal
    (OrderStatus.DISPUTED, []),   # Terminal (resolution handled separately)
]

# Terminal statuses
TERMINAL_STATUSES = {OrderStatus.COMPLETED, OrderStatus.DISPUTED}

# Statuses that can be disputed
DISPUTABLE_STATUSES = {OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.DISPATCHED}


@dataclass
class TransitionResult:
    valid: bool
    error: str = ""


def can_transition(from_status: str, to_status: str) -> TransitionResult:
    """
    Check if a status transition is valid.
    Returns TransitionResult with valid=True/False and error message.
    """
    try:
        from_enum = OrderStatus(from_status)
        to_enum = OrderStatus(to_status)
    except ValueError:
        return TransitionResult(valid=False, error=f"Invalid status value: {from_status} -> {to_status}")

    # Can't transition from terminal state
    if from_enum in TERMINAL_STATUSES:
        return TransitionResult(
            valid=False,
            error=f"Cannot transition from terminal state: {from_status}"
        )

    # Check valid transitions
    allowed = dict(VALID_TRANSITIONS).get(from_enum, [])
    if to_enum not in allowed:
        return TransitionResult(
            valid=False,
            error=f"Invalid transition: {from_status} -> {to_status}. Allowed: {[s.value for s in allowed]}"
        )

    return TransitionResult(valid=True)


def get_next_valid_statuses(current_status: str) -> List[str]:
    """Get list of valid next statuses from current status."""
    try:
        current = OrderStatus(current_status)
    except ValueError:
        return []

    allowed = dict(VALID_TRANSITIONS).get(current, [])
    return [s.value for s in allowed]


def is_terminal(status: str) -> bool:
    """Check if status is terminal (no further transitions allowed)."""
    try:
        return OrderStatus(status) in TERMINAL_STATUSES
    except ValueError:
        return False


def can_dispute(status: str) -> bool:
    """Check if an order in this status can be disputed."""
    try:
        return OrderStatus(status) in DISPUTABLE_STATUSES
    except ValueError:
        return False


def get_transport_next_statuses(current: str) -> List[str]:
    """Get valid next transport statuses."""
    transport_flow = {
        TransportStatus.PICKED_UP: [TransportStatus.IN_TRANSIT, TransportStatus.ARRIVED],
        TransportStatus.IN_TRANSIT: [TransportStatus.ARRIVED],
        TransportStatus.ARRIVED: [],
    }
    try:
        return [s.value for s in transport_flow.get(TransportStatus(current), [])]
    except ValueError:
        return []


# Action permissions by role
ROLE_ACTIONS = {
    "farmer": {
        OrderStatus.PENDING: ["accept", "dispute"],
        OrderStatus.ACCEPTED: ["dispatch", "dispute"],
        OrderStatus.DISPATCHED: ["complete", "dispute"],
    },
    "buyer": {
        OrderStatus.PENDING: ["dispute"],
        OrderStatus.ACCEPTED: ["dispute"],
        OrderStatus.DISPATCHED: ["dispute"],
    },
    "admin": {
        OrderStatus.PENDING: ["force_accept", "force_cancel"],
        OrderStatus.ACCEPTED: ["force_dispatch", "force_cancel"],
        OrderStatus.DISPATCHED: ["force_complete", "force_cancel"],
        OrderStatus.COMPLETED: ["view_audit"],
        OrderStatus.DISPUTED: ["resolve_refund", "resolve_release"],
    }
}


def get_allowed_actions(role: str, status: str) -> List[str]:
    """Get allowed actions for a role on an order with given status."""
    role_actions = ROLE_ACTIONS.get(role, {})
    return role_actions.get(OrderStatus(status), [])