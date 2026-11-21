from uuid import uuid4

from app.auth_utils import create_token, decode_token


def test_valid_token_round_trips():
    user_id = str(uuid4())
    assert decode_token(create_token(user_id)) == user_id


def test_old_fake_token_is_rejected():
    assert decode_token(f"token_{uuid4()}") is None


def test_tampered_user_id_is_rejected():
    token = create_token(str(uuid4()))
    _, expires, signature = token.split(".")
    forged = f"{uuid4()}.{expires}.{signature}"
    assert decode_token(forged) is None


def test_tampered_signature_is_rejected():
    token = create_token(str(uuid4()))
    assert decode_token(token[:-1] + ("0" if token[-1] != "0" else "1")) is None


def test_expired_token_is_rejected():
    user_id = str(uuid4())
    token = create_token(user_id, now=1_000_000)
    assert decode_token(token, now=1_000_000 + 25 * 60 * 60) is None


def test_garbage_is_rejected():
    for bad in ("", "abc", "a.b", "a.b.c.d"):
        assert decode_token(bad) is None